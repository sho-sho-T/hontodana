/**
 * 読書ダッシュボードメインコンポーネント
 */

'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsSummaryCard } from './StatsSummaryCard'
import { GoalProgressCard } from './GoalProgressCard'
import { useReadingGoals } from '@/hooks/useReadingGoals'
import type { ReadingStats } from '@/lib/models/reading-progress'
import { formatStatValue } from '@/lib/utils/stats-formatters'

// アイコンコンポーネント（テスト用の簡易実装）
const BookIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

export interface ReadingDashboardProps {
  userId: string
  className?: string
}

const ReadingDashboardComponent = ({ userId, className = '' }: ReadingDashboardProps) => {
  const [stats, setStats] = useState<ReadingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('week')

  const {
    goals,
    activeGoals,
    isLoading: goalsLoading,
    error: goalsError,
    calculateProgress,
    getGoalAlerts
  } = useReadingGoals(userId)

  // 統計データの読み込み（useCallbackでメモ化）
  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 実際の実装では認証トークンを使用
      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365
      
      // テスト用のモックデータ
      const mockStats: ReadingStats = {
        totalReadingTime: 150,
        averageSessionTime: 45,
        totalPagesRead: 350,
        averagePagesPerSession: 25,
        averagePagesPerDay: 10,
        booksCompleted: 5,
        totalCompletedPages: 1200,
        averageBookLength: 240,
        booksInProgress: 3,
        dailyStats: [],
        weeklyStats: [],
        readingPace: {
          last7Days: 10,
          last30Days: 8
        },
        readingConsistency: 0.75
      }

      setStats(mockStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [timeRange, userId])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // アラートの取得（メモ化）
  const alerts = useMemo(() => getGoalAlerts(), [getGoalAlerts])

  // ローディング状態（アクセシビリティ改善）
  if (isLoading || goalsLoading) {
    return (
      <div className={`space-y-6 ${className}`} data-testid="dashboard-loading">
        <div 
          className="animate-pulse" 
          role="status" 
          aria-live="polite" 
          aria-label="読書統計を読み込み中"
        >
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className="h-32 bg-gray-200 rounded"
                aria-label={`統計カード ${i} 読み込み中`}
              />
            ))}
          </div>
          <div 
            className="h-64 bg-gray-200 rounded"
            aria-label="チャート読み込み中"
          />
        </div>
        <span className="sr-only">読書統計データを読み込んでいます。しばらくお待ちください。</span>
      </div>
    )
  }

  // エラー状態（アクセシビリティ改善）
  if (error || goalsError) {
    return (
      <div className={`space-y-6 ${className}`} data-testid="dashboard-error">
        <Card 
          className="p-6 border-red-200 bg-red-50" 
          role="alert"
          aria-live="assertive"
        >
          <h3 className="text-lg font-semibold text-red-800 mb-2" id="error-title">
            エラーが発生しました
          </h3>
          <p className="text-red-600" aria-describedby="error-title">
            {error || goalsError?.message}
          </p>
          <Button 
            onClick={loadStats} 
            className="mt-4"
            variant="outline"
            aria-label="統計データの再読み込みを実行"
          >
            再試行
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="dashboard-container">
      {/* ヘッダー（アクセシビリティ改善） */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900" id="dashboard-title">
          読書ダッシュボード
        </h1>
        
        <div 
          className="flex space-x-2" 
          role="group" 
          aria-labelledby="dashboard-title"
          aria-label="時間範囲選択"
        >
          {(['week', 'month', 'quarter', 'year'] as const).map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
              aria-pressed={timeRange === range}
              aria-label={`${
                range === 'week' ? '週間' :
                range === 'month' ? '月間' :
                range === 'quarter' ? '四半期' :
                '年間'
              }の統計を表示`}
            >
              {range === 'week' && '週間'}
              {range === 'month' && '月間'}
              {range === 'quarter' && '四半期'}
              {range === 'year' && '年間'}
            </Button>
          ))}
        </div>
      </div>

      {/* アラート表示 */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <Card 
              key={alert.goalId} 
              className={`p-4 border-l-4 ${
                alert.severity === 'error' ? 'border-red-500 bg-red-50' :
                alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                alert.severity === 'success' ? 'border-green-500 bg-green-50' :
                'border-blue-500 bg-blue-50'
              }`}
            >
              <p className="text-sm font-medium">{alert.message}</p>
            </Card>
          ))}
        </div>
      )}

      {/* 統計サマリー */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsSummaryCard
            title="総読書時間"
            value={stats.totalReadingTime}
            unit="minutes"
            icon={<ClockIcon />}
            trend={{
              direction: 'up',
              value: 15,
              period: '先週'
            }}
          />
          
          <StatsSummaryCard
            title="読書ページ数"
            value={stats.totalPagesRead}
            unit="pages"
            icon={<BookIcon />}
            trend={{
              direction: 'stable',
              value: stats.readingPace.last7Days,
              period: '1日平均'
            }}
          />
          
          <StatsSummaryCard
            title="完読書籍"
            value={stats.booksCompleted}
            unit="books"
            icon={<TrendingUpIcon />}
            trend={{
              direction: 'up',
              value: 2,
              period: '今月'
            }}
          />
        </div>
      )}

      {/* 読書目標進捗 */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">読書目標</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeGoals.map(goal => {
              const progress = calculateProgress(goal)
              return (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  progress={progress}
                  onEdit={(goalId) => console.log('Edit goal:', goalId)}
                  onDelete={(goalId) => console.log('Delete goal:', goalId)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* データが無い場合の表示 */}
      {stats && stats.totalReadingTime === 0 && (
        <Card className="p-8 text-center">
          <BookIcon />
          <h3 className="text-lg font-semibold text-gray-900 mt-4">読書データがありません</h3>
          <p className="text-gray-600 mt-2">
            読書セッションを記録して統計を表示しましょう
          </p>
          <Button className="mt-4">
            読書記録を開始
          </Button>
        </Card>
      )}
    </div>
  )
}

// React.memoでコンポーネントをラップ
export const ReadingDashboard = memo(ReadingDashboardComponent, (prevProps, nextProps) => {
  return (
    prevProps.userId === nextProps.userId &&
    prevProps.className === nextProps.className
  )
})

ReadingDashboard.displayName = 'ReadingDashboard'