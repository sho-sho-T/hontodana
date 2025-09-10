/**
 * 統計データの変換・フォーマッター
 * Chart.jsのデータ形式への変換とUI表示用のフォーマットを提供
 * 
 * パフォーマンス最適化:
 * - メモ化による重複計算の防止
 * - 型安全性の向上
 * - エラーハンドリングの強化
 */

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export interface DailyStats {
  date: string
  pagesRead: number
  readingTime: number
  sessionsCount: number
}

export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    type?: string
    borderDash?: number[]
    fill?: boolean
  }>
}

export interface ChartOptions {
  colorScheme?: 'default' | 'accessible'
  fillGaps?: boolean
  includeMultiple?: Array<'pages' | 'minutes' | 'sessions'>
  includeTrend?: boolean
}

export interface FormatOptions {
  precision?: number
  compact?: boolean
}

// 計算結果のメモ化用
const memoizedResults = new Map<string, any>()
const MEMO_TTL = 60000 // 1分間
const memoizedTimestamps = new Map<string, number>()

export interface TrendResult {
  direction: 'up' | 'down' | 'stable' | 'variable' | 'insufficient_data' | 'no_data'
  slope: number
  correlation: number
  prediction?: number
  volatility?: number
  outliers?: number[]
  smoothedData?: number[]
}

export interface TrendOptions {
  removeOutliers?: boolean
  useMovingAverage?: boolean
  window?: number
}

/**
 * メモ化ヘルパー関数
 */
function getMemoKey(stats: DailyStats[], type: string, options: ChartOptions): string {
  return JSON.stringify({ stats, type, options })
}

function getMemoizedResult<T>(key: string): T | null {
  const timestamp = memoizedTimestamps.get(key)
  if (!timestamp || Date.now() - timestamp > MEMO_TTL) {
    memoizedResults.delete(key)
    memoizedTimestamps.delete(key)
    return null
  }
  return memoizedResults.get(key) || null
}

function setMemoizedResult<T>(key: string, result: T): void {
  memoizedResults.set(key, result)
  memoizedTimestamps.set(key, Date.now())
}

/**
 * 統計データをChart.js形式に変換（メモ化対応）
 */
export function transformStatsForChart(
  stats: DailyStats[],
  type: 'pages' | 'minutes' | 'sessions' | 'combined',
  options: ChartOptions = {}
): ChartData {
  // メモ化チェック
  const memoKey = getMemoKey(stats, type, options)
  const cachedResult = getMemoizedResult<ChartData>(memoKey)
  if (cachedResult) {
    return cachedResult
  }

  try {
    if (stats.length === 0) {
      const emptyResult: ChartData = {
        labels: [],
        datasets: [{
          label: getDatasetLabel(type),
          data: [],
          ...getDatasetStyles(options.colorScheme)
        }]
      }
      setMemoizedResult(memoKey, emptyResult)
      return emptyResult
    }

    // データを日付順にソート
    const sortedStats = [...stats].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // 欠損データの補間
    let processedStats = sortedStats
    if (options.fillGaps) {
      processedStats = fillDataGaps(sortedStats)
    }

    // ラベル生成
    const labels = generateChartLabels(
      processedStats.map(s => s.date),
      'daily'
    )

    // データセット生成
    const datasets = []

    if (type === 'combined' && options.includeMultiple) {
      for (const dataType of options.includeMultiple) {
        datasets.push({
          label: getDatasetLabel(dataType as any),
          data: processedStats.map(s => getDataValue(s, dataType as any)),
          ...getDatasetStyles(options.colorScheme, dataType as any)
        })
      }
    } else {
      datasets.push({
        label: getDatasetLabel(type),
        data: processedStats.map(s => getDataValue(s, type)),
        ...getDatasetStyles(options.colorScheme, type)
      })
    }

    // トレンドライン追加
    if (options.includeTrend && datasets.length > 0) {
      const trendData = calculateTrendLine(datasets[0].data as number[])
      datasets.push({
        label: 'トレンド',
        data: trendData,
        type: 'line',
        borderDash: [5, 5],
        borderColor: '#6B7280',
        backgroundColor: 'transparent',
        fill: false
      })
    }

    const result: ChartData = {
      labels,
      datasets
    }
    
    // 結果をメモ化
    setMemoizedResult(memoKey, result)
    return result
  } catch (error) {
    console.warn('Chart data transformation failed:', error)
    // エラー時のフォールバック
    const fallbackResult: ChartData = {
      labels: [],
      datasets: [{
        label: getDatasetLabel(type),
        data: [],
        ...getDatasetStyles(options.colorScheme)
      }]
    }
    setMemoizedResult(memoKey, fallbackResult)
    return fallbackResult
  }
}

/**
 * 統計値をフォーマットして表示
 */
/**
 * 統計値をフォーマットして表示（型安全性向上）
 */
export function formatStatValue(
  value: number | null | undefined,
  type: 'minutes' | 'pages' | 'percentage' | 'books' | 'speed' | 'days' | 'sessions',
  options: FormatOptions = {}
): string {
  // メモ化キーで簡単なケースはスキップ
  const simpleKey = `format_${value}_${type}_${JSON.stringify(options)}`
  const cached = getMemoizedResult<string>(simpleKey)
  if (cached) return cached

  try {
    // 型安全性とnullチェックを強化
    const safeValue = validateAndSanitizeNumber(value)

    const precision = options.precision ?? 0

    let result: string
    
    switch (type) {
      case 'minutes':
        result = options.compact ? formatMinutesCompact(safeValue) : formatMinutes(safeValue)
        break
      case 'pages':
        result = `${formatNumber(safeValue, precision)}ページ`
        break
      case 'percentage':
        result = formatPercentage(safeValue, precision)
        break
      case 'books':
        result = `${formatNumber(safeValue, 0)}冊`
        break
      case 'speed':
        result = formatSpeed(safeValue, precision)
        break
      case 'days':
        result = `${formatNumber(safeValue, 0)}日`
        break
      case 'sessions':
        result = `${formatNumber(safeValue, 0)}セッション`
        break
      default:
        result = `${formatNumber(safeValue, precision)}`
    }
    
    // 結果をメモ化
    setMemoizedResult(simpleKey, result)
    return result
  } catch (error) {
    console.warn('Stat formatting failed:', error, { value, type, options })
    const fallback = `0${getUnitSuffix(type)}`
    setMemoizedResult(simpleKey, fallback)
    return fallback
  }
}

/**
 * チャートラベルを生成
 */
export function generateChartLabels(
  dates: string[],
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
): string[] {
  try {
    return dates.map(dateStr => {
      try {
        const date = new Date(dateStr)
        
        if (Number.isNaN(date.getTime())) {
          return '無効'
        }

        switch (period) {
          case 'daily':
            return format(date, 'M/d', { locale: ja })
          case 'weekly':
            return format(date, 'M/d', { locale: ja }) + '週'
          case 'monthly':
            return format(date, 'M月', { locale: ja })
          case 'yearly':
            return format(date, 'yyyy年', { locale: ja })
          default:
            return format(date, 'M/d', { locale: ja })
        }
      } catch {
        return '無効'
      }
    })
  } catch (error) {
    return []
  }
}

/**
 * トレンドを計算
 */
export function calculateTrend(
  data: number[],
  options: TrendOptions = {}
): TrendResult {
  try {
    if (data.length === 0) {
      return {
        direction: 'no_data',
        slope: 0,
        correlation: 0
      }
    }

    if (data.length === 1) {
      return {
        direction: 'insufficient_data',
        slope: 0,
        correlation: 0
      }
    }

    let processedData = [...data]
    let outliers: number[] = []

    // 外れ値除去
    if (options.removeOutliers) {
      const result = removeOutliers(processedData)
      processedData = result.clean
      outliers = result.outliers
    }

    // 移動平均
    let smoothedData: number[] | undefined
    if (options.useMovingAverage && options.window) {
      smoothedData = calculateMovingAverage(processedData, options.window)
      processedData = smoothedData
    }

    if (processedData.length < 2) {
      return {
        direction: 'insufficient_data',
        slope: 0,
        correlation: 0,
        outliers,
        smoothedData
      }
    }

    // 線形回帰計算
    const n = processedData.length
    const xValues = Array.from({ length: n }, (_, i) => i)
    const yValues = processedData

    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n

    let numerator = 0
    let xDenominator = 0
    let yDenominator = 0

    for (let i = 0; i < n; i++) {
      const xDiff = xValues[i] - xMean
      const yDiff = yValues[i] - yMean
      numerator += xDiff * yDiff
      xDenominator += xDiff * xDiff
      yDenominator += yDiff * yDiff
    }

    const correlation = numerator / Math.sqrt(xDenominator * yDenominator)
    const slope = numerator / xDenominator

    // ボラティリティ計算
    const volatility = calculateVolatility(yValues)

    // トレンド判定 - より精密な判定
    let direction: TrendResult['direction']
    const allSame = yValues.every(val => val === yValues[0])
    
    if (allSame || (Math.abs(slope) < 0.001 && Math.abs(correlation) < 0.1)) {
      direction = 'stable'
    } else if (Math.abs(correlation) < 0.3) {
      direction = volatility > 0.5 ? 'variable' : 'stable'
    } else if (correlation > 0.3) {
      direction = 'up'
    } else {
      direction = 'down'
    }

    // 予測値計算
    const prediction = yMean + slope * n

    return {
      direction,
      slope: Number.isNaN(slope) ? 0 : slope,
      correlation: Number.isNaN(correlation) ? 0 : correlation,
      prediction: Number.isNaN(prediction) ? undefined : prediction,
      volatility,
      outliers,
      smoothedData
    }
  } catch (error) {
    return {
      direction: 'no_data',
      slope: 0,
      correlation: 0
    }
  }
}

// ヘルパー関数

/**
 * 数値の検証と無害化
 */
function validateAndSanitizeNumber(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value) || value < 0) {
    return 0
  }
  return value
}

/**
 * コンパクトな時間フォーマット
 */
function formatMinutesCompact(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.floor(minutes % 60)
  
  if (hours > 0) {
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`
  }
  return `${remainingMinutes}m`
}

/**
 * パーセンテージのフォーマット
 */
function formatPercentage(value: number, precision?: number): string {
  const percentage = value * 100
  
  if (precision !== undefined) {
    return `${formatNumber(percentage, precision)}%`
  }
  
  // 動的精度判定
  return Math.round(percentage) === percentage 
    ? `${percentage}%` 
    : `${Math.round(percentage * 10) / 10}%`
}

/**
 * 速度のフォーマット
 */
function formatSpeed(value: number, precision?: number): string {
  if (precision !== undefined) {
    return `${formatNumber(value, precision)}ページ/分`
  }
  
  // 動的精度判定
  return Math.round(value) === value
    ? `${value}ページ/分`
    : `${Math.round(value * 10) / 10}ページ/分`
}

function getDatasetLabel(type: string): string {
  switch (type) {
    case 'pages':
      return '読書ページ数'
    case 'minutes':
      return '読書時間（分）'
    case 'sessions':
      return '読書セッション数'
    default:
      return '読書データ'
  }
}

function getDataValue(stats: DailyStats, type: string): number {
  switch (type) {
    case 'pages':
      return validateAndSanitizeNumber(stats.pagesRead)
    case 'minutes':
      return validateAndSanitizeNumber(stats.readingTime)
    case 'sessions':
      return validateAndSanitizeNumber(stats.sessionsCount)
    default:
      return 0
  }
}

function getDatasetStyles(colorScheme?: string, type?: string) {
  const colors = colorScheme === 'accessible' ? {
    pages: '#3B82F6',
    minutes: '#10B981',
    sessions: '#F59E0B'
  } : {
    pages: '#6366F1',
    minutes: '#06B6D4',
    sessions: '#84CC16'
  }

  const color = colors[type as keyof typeof colors] || colors.pages

  // HEXカラーをRGBAに変換
  const hexToRgba = (hex: string, alpha: number) => {
    const r = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return {
    borderColor: color,
    backgroundColor: hexToRgba(color, 0.1),
    fill: false
  }
}

function fillDataGaps(stats: DailyStats[]): DailyStats[] {
  if (stats.length <= 1) return stats

  const result: DailyStats[] = []
  const sortedStats = [...stats].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let current = new Date(sortedStats[0].date)
  const end = new Date(sortedStats[sortedStats.length - 1].date)
  let dataIndex = 0

  while (current <= end) {
    const currentDateStr = current.toISOString().split('T')[0]
    const existingData = sortedStats.find(s => s.date === currentDateStr)

    if (existingData) {
      result.push(existingData)
    } else {
      result.push({
        date: currentDateStr,
        pagesRead: 0,
        readingTime: 0,
        sessionsCount: 0
      })
    }

    current.setDate(current.getDate() + 1)
  }

  return result
}

function calculateTrendLine(data: number[]): number[] {
  if (data.length < 2) return data

  const n = data.length
  const x = Array.from({ length: n }, (_, i) => i)
  const y = data

  const xMean = x.reduce((sum, val) => sum + val, 0) / n
  const yMean = y.reduce((sum, val) => sum + val, 0) / n

  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    numerator += (x[i] - xMean) * (y[i] - yMean)
    denominator += (x[i] - xMean) ** 2
  }

  const slope = denominator === 0 ? 0 : numerator / denominator
  const intercept = yMean - slope * xMean

  return x.map(xi => slope * xi + intercept)
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.floor(minutes % 60)

  if (hours === 0) return `${remainingMinutes}分`
  if (remainingMinutes === 0) return `${hours}時間`
  return `${hours}時間${remainingMinutes}分`
}

function formatNumber(value: number, precision: number): string {
  return value.toLocaleString('ja-JP', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  })
}

function getUnitSuffix(type: string): string {
  switch (type) {
    case 'minutes': return '分'
    case 'pages': return 'ページ'
    case 'percentage': return '%'
    case 'books': return '冊'
    case 'speed': return 'ページ/分'
    case 'days': return '日'
    case 'sessions': return 'セッション'
    default: return ''
  }
}

function removeOutliers(data: number[]): { clean: number[], outliers: number[] } {
  if (data.length <= 2) {
    return { clean: [...data], outliers: [] }
  }

  const sorted = [...data].sort((a, b) => a - b)
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]
  const iqr = q3 - q1
  
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr
  
  const outliers: number[] = []
  const clean: number[] = []

  data.forEach(val => {
    if (val < lowerBound || val > upperBound) {
      outliers.push(val)
    } else {
      clean.push(val)
    }
  })

  // すべてが外れ値と判定された場合は、元のデータを返す
  if (clean.length === 0) {
    return { clean: [...data], outliers: [] }
  }

  return { clean, outliers }
}

function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = []

  for (let i = window - 1; i < data.length; i++) {
    const sum = data.slice(i - window + 1, i + 1).reduce((acc, val) => acc + val, 0)
    result.push(sum / window)
  }

  return result
}

function calculateVolatility(data: number[]): number {
  if (data.length <= 1) return 0

  const mean = data.reduce((sum, val) => sum + val, 0) / data.length
  const variance = data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length
  const stdDev = Math.sqrt(variance)

  return mean === 0 ? 0 : stdDev / mean
}