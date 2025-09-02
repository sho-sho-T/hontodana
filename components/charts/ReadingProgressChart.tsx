/**
 * 読書進捗チャートコンポーネント
 */

'use client'

import React, { useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { DailyStats } from '@/lib/utils/stats-formatters'
import { transformStatsForChart } from '@/lib/utils/stats-formatters'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Chart.js の設定
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export interface ReadingProgressChartProps {
  data: DailyStats[]
  type: 'pages' | 'minutes' | 'sessions'
  title?: string
  height?: number
  showTrend?: boolean
  className?: string
}

export const ReadingProgressChart = React.memo<ReadingProgressChartProps>(function ReadingProgressChart({
  data,
  type,
  title,
  height = 300,
  showTrend = false,
  className = ''
}) {
  const chartRef = useRef<ChartJS<'line'> | null>(null)

  // チャートデータの変換（メモ化最適化）
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null
    
    return transformStatsForChart(data, type, {
      includeTrend: showTrend,
      colorScheme: 'accessible'
    })
  }, [data, type, showTrend])
  
  // データハッシュの計算（深い比較の代替）
  const dataHash = useMemo(() => {
    if (!data) return ''
    return JSON.stringify({ data: data.slice(0, 5), length: data.length, type, showTrend })
  }, [data, type, showTrend])

  // チャートオプション
  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: useCallback((context: any) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            
            if (type === 'minutes') {
              const hours = Math.floor(value / 60)
              const minutes = Math.floor(value % 60)
              return `${label}: ${hours > 0 ? `${hours}時間` : ''}${minutes}分`
            }
            
            const unit = type === 'pages' ? 'ページ' : 
                        type === 'sessions' ? 'セッション' : ''
            return `${label}: ${value}${unit}`
          }, [type])
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '日付'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: type === 'pages' ? 'ページ数' : 
                type === 'minutes' ? '時間（分）' : 
                'セッション数'
        },
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    elements: {
      line: {
        tension: 0.3,
        borderWidth: 2
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  }), [title, type, dataHash]) // dataHashを依存関係に追加

  // アクセシビリティ対応（改善版）
  const updateAccessibility = useCallback(() => {
    const chart = chartRef.current
    if (chart?.canvas && data) {
      chart.canvas.setAttribute('role', 'img')
      chart.canvas.setAttribute('aria-label', `読書進捗チャート: ${title || ''} - ${type}データの時系列グラフ`)
      
      // スクリーンリーダー用の詳細情報
      const latestValue = data[0] // 最新のデータ
      if (latestValue) {
        const unit = type === 'pages' ? 'ページ' : type === 'minutes' ? '分' : 'セッション'
        const value = type === 'pages' ? latestValue.pagesRead : 
                     type === 'minutes' ? latestValue.readingTime : 
                     latestValue.sessionsCount
        
        chart.canvas.setAttribute('aria-describedby', 
          `chart-summary-${chart.canvas.id || 'chart'}`)
        
        // サマリ情報をDOMに追加（スクリーンリーダー用）
        const summaryId = `chart-summary-${chart.canvas.id || 'chart'}`
        let summaryElement = document.getElementById(summaryId)
        
        if (!summaryElement) {
          summaryElement = document.createElement('div')
          summaryElement.id = summaryId
          summaryElement.className = 'sr-only'
          chart.canvas.parentElement?.appendChild(summaryElement)
        }
        
        summaryElement.textContent = 
          `最新のデータ: ${value}${unit}. 全${data.length}日間のデータを表示しています。`
      }
    }
  }, [title, type, data])
  
  useEffect(() => {
    updateAccessibility()
  }, [updateAccessibility])

  // 空データコンポーネント（メモ化）
  const EmptyState = useMemo(() => (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm font-medium">表示するデータがありません</p>
        <p className="text-xs mt-1">読書記録を追加すると進捗が表示されます</p>
      </div>
    </Card>
  ), [className])
  
  // データが空の場合
  if (!data || data.length === 0 || !chartData) {
    return EmptyState
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div style={{ height: `${height}px` }}>
        <Line
          ref={chartRef}
          data={chartData as any}
          options={options as any}
        />
      </div>
    </Card>
  )
})