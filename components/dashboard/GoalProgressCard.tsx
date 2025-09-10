/**
 * 読書目標進捗カードコンポーネント
 * パフォーマンス最適化: React.memoとuseMemoで最適化
 */

import type React from 'react'
import { memo, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ReadingGoal, GoalProgress } from '@/lib/models/reading-goals'
import { formatStatValue } from '@/lib/utils/stats-formatters'

export interface GoalProgressCardProps {
  goal: ReadingGoal
  progress: GoalProgress
  onEdit?: (goalId: string) => void
  onDelete?: (goalId: string) => void
  className?: string
}

const GoalProgressCardComponent = ({
  goal,
  progress,
  onEdit,
  onDelete,
  className = ''
}: GoalProgressCardProps) => {
  // メモ化したゴール情報
  const goalInfo = useMemo(() => ({
    unit: getGoalUnit(goal.type),
    displayName: getGoalDisplayName(goal.type),
    formattedTarget: formatStatValue(goal.targetValue, getGoalUnit(goal.type))
  }), [goal.type, goal.targetValue])
  
  // メモ化した進捗情報（デフォルト値で保護）
  const progressInfo = useMemo(() => {
    const safeProgress = progress || {
      currentValue: 0,
      progressPercentage: 0,
      remainingToTarget: goal.targetValue,
      isOnTrack: true,
      isCompleted: false,
      isExpired: false,
      dailyTargetToFinish: undefined,
      daysRemaining: undefined
    }
    
    return {
      color: getProgressColor(safeProgress.progressPercentage, safeProgress.isOnTrack),
      textColor: getProgressTextColor(safeProgress.progressPercentage, safeProgress.isOnTrack),
      formattedCurrent: formatStatValue(safeProgress.currentValue, goalInfo.unit),
      formattedRemaining: formatStatValue(safeProgress.remainingToTarget, goalInfo.unit),
      formattedDaily: safeProgress.dailyTargetToFinish ? formatStatValue(safeProgress.dailyTargetToFinish, goalInfo.unit) : null
    }
  }, [progress, goalInfo.unit, goal.targetValue])

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {goalInfo.displayName}
            </h3>
            <p className="text-sm text-gray-600">
              目標: {goalInfo.formattedTarget}
            </p>
          </div>
          
          <div className="flex space-x-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(goal.id)}
                className="text-xs"
              >
                編集
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(goal.id)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                削除
              </Button>
            )}
          </div>
        </div>

        {/* 進捗バー */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">進捗</span>
            <span className={`font-medium ${progressInfo.textColor}`}>
              {progress?.progressPercentage ?? 0}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${progressInfo.color}`}
              style={{ width: `${Math.min(progress?.progressPercentage ?? 0, 100)}%` }}
              role="progressbar"
              aria-valuenow={progress?.progressPercentage ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`進捗率 ${progress?.progressPercentage ?? 0}%`}
            />
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">現在の値</p>
            <p className="font-semibold">
              {progressInfo.formattedCurrent}
            </p>
          </div>
          <div>
            <p className="text-gray-600">残り</p>
            <p className="font-semibold">
              {progressInfo.formattedRemaining}
            </p>
          </div>
        </div>

        {/* ステータス表示 */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            {progress?.isCompleted ? (
              <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                達成
              </span>
            ) : progress?.isExpired ? (
              <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                期限切れ
              </span>
            ) : progress?.isOnTrack ?? true ? (
              <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                順調
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                遅れ
              </span>
            )}
          </div>

          {progress?.daysRemaining !== undefined && progress.daysRemaining > 0 && (
            <p className="text-xs text-gray-500">
              残り{progress.daysRemaining}日
            </p>
          )}
        </div>

        {/* 推奨ペース */}
        {!progress?.isCompleted && !progress?.isExpired && progressInfo.formattedDaily && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">目標達成には</p>
            <p className="text-sm font-medium">
              1日{progressInfo.formattedDaily}のペースが必要
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

// ヘルパー関数をコンポーネント外で定義してパフォーマンス最適化
function getGoalUnit(type: ReadingGoal['type']): 'books' | 'pages' | 'minutes' | 'sessions' {
  switch (type) {
    case 'books_per_year':
    case 'books_per_month':
      return 'books'
    case 'pages_per_month':
    case 'pages_per_year':
      return 'pages'
    case 'reading_time_per_day':
    case 'minutes_per_week':
    case 'minutes_per_month':
      return 'minutes'
    case 'sessions_per_week':
      return 'sessions'
    case 'custom':
      return 'books' // デフォルト
    default:
      return 'books'
  }
}

function getGoalDisplayName(type: ReadingGoal['type']): string {
  switch (type) {
    case 'books_per_year':
      return '年間読書目標'
    case 'books_per_month':
      return '月間読書目標'
    case 'pages_per_month':
      return '月間ページ目標'
    case 'pages_per_year':
      return '年間ページ目標'
    case 'reading_time_per_day':
      return '日間読書時間目標'
    case 'minutes_per_week':
      return '週間読書時間目標'
    case 'minutes_per_month':
      return '月間読書時間目標'
    case 'sessions_per_week':
      return '週間セッション目標'
    case 'custom':
      return 'カスタム読書目標'
    default:
      return '読書目標'
  }
}

function getProgressColor(percentage: number, isOnTrack: boolean): string {
  if (percentage >= 100) return 'bg-green-500'
  if (isOnTrack) return 'bg-blue-500'
  return 'bg-red-500'
}

function getProgressTextColor(percentage: number, isOnTrack: boolean): string {
  if (percentage >= 100) return 'text-green-600'
  if (isOnTrack) return 'text-blue-600'
  return 'text-red-600'
}

// React.memoでコンポーネントをラップしてパフォーマンス最適化
export const GoalProgressCard = memo(GoalProgressCardComponent, (prevProps, nextProps) => {
  // 深い比較で精密なメモ化制御
  return (
    prevProps.className === nextProps.className &&
    JSON.stringify(prevProps.goal) === JSON.stringify(nextProps.goal) &&
    JSON.stringify(prevProps.progress) === JSON.stringify(nextProps.progress) &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete
  )
})

GoalProgressCard.displayName = 'GoalProgressCard'