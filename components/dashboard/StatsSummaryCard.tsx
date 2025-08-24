/**
 * 統計サマリーカードコンポーネント
 * パフォーマンス最適化: React.memoで不要な再レンダリングを防止
 */

import { ReactNode, memo, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { formatStatValue } from '@/lib/utils/stats-formatters'

export interface StatsSummaryCardProps {
  title: string
  value: number
  unit: 'minutes' | 'pages' | 'percentage' | 'books' | 'speed' | 'days'
  icon?: ReactNode
  trend?: {
    direction: 'up' | 'down' | 'stable'
    value: number
    period: string
  }
  className?: string
}

const StatsSummaryCardComponent = ({
  title,
  value,
  unit,
  icon,
  trend,
  className = ''
}: StatsSummaryCardProps) => {
  // メモ化したフォーマット済みの値
  const formattedValue = useMemo(() => formatStatValue(value, unit), [value, unit])
  
  // メモ化したトレンド情報
  const trendInfo = useMemo(() => {
    if (!trend) return null
    
    return {
      icon: getTrendIcon(trend.direction),
      color: getTrendColor(trend.direction),
      formattedValue: formatStatValue(trend.value, unit)
    }
  }, [trend, unit])

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="p-2 bg-gray-100 rounded-lg">
              {icon}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
          </div>
        </div>
        
        {trendInfo && (
          <div className={`flex items-center space-x-1 ${trendInfo.color}`}>
            {trendInfo.icon}
            <span className="text-sm font-medium">
              {trendInfo.formattedValue}
            </span>
            <span className="text-xs text-gray-500">vs {trend?.period}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

// ヘルパー関数をコンポーネント外で定義してパフォーマンス最適化
function getTrendIcon(direction: string): React.ReactElement | null {
  switch (direction) {
    case 'up':
      return (
        <span className="text-green-500" aria-label="上昇トレンド">
          ↗
        </span>
      )
    case 'down':
      return (
        <span className="text-red-500" aria-label="下降トレンド">
          ↘
        </span>
      )
    case 'stable':
      return (
        <span className="text-gray-500" aria-label="安定トレンド">
          →
        </span>
      )
    default:
      return null
  }
}

function getTrendColor(direction: string): string {
  switch (direction) {
    case 'up':
      return 'text-green-600'
    case 'down':
      return 'text-red-600'
    case 'stable':
      return 'text-gray-600'
    default:
      return 'text-gray-600'
  }
}

// React.memoでコンポーネントをラップしてパフォーマンス最適化
export const StatsSummaryCard = memo(StatsSummaryCardComponent, (prevProps, nextProps) => {
  // 深い比較で精密なメモ化制御
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.unit === nextProps.unit &&
    prevProps.className === nextProps.className &&
    JSON.stringify(prevProps.trend) === JSON.stringify(nextProps.trend)
  )
})

StatsSummaryCard.displayName = 'StatsSummaryCard'