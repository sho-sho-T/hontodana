/**
 * 読書進捗管理に関する型定義
 * TDD Refactor: 型安全性の向上とランタイム型チェック対応
 */

// 基本的なブランドタイプで型安全性向上
export type UserId = string & { readonly brand: unique symbol }
export type BookId = string & { readonly brand: unique symbol }
export type UserBookId = string & { readonly brand: unique symbol }
export type SessionId = string & { readonly brand: unique symbol }

// 読書状況の厳密な型定義
export const READING_STATUS = {
  WISH_TO_READ: 'wish_to_read',
  READING: 'reading', 
  COMPLETED: 'completed',
  DNF: 'dnf' // Did Not Finish
} as const

export type ReadingStatus = typeof READING_STATUS[keyof typeof READING_STATUS]

// 統計単位の厳密な型定義
export const STAT_UNITS = {
  MINUTES: 'minutes',
  PAGES: 'pages', 
  PERCENTAGE: 'percentage',
  BOOKS: 'books',
  SPEED: 'speed',
  DAYS: 'days'
} as const

export type StatUnit = typeof STAT_UNITS[keyof typeof STAT_UNITS]

// 時間範囲の厳密な型定義
export const TIME_RANGES = {
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year'
} as const

export type TimeRange = typeof TIME_RANGES[keyof typeof TIME_RANGES]

// 入力データの型定義（厳密化）
export interface UpdateProgressInput {
  readonly userBookId: UserBookId
  readonly currentPage: number
  readonly sessionNotes?: string
}

// 型安全性向上のためのValidation関数
export const validateUpdateProgressInput = (input: unknown): input is UpdateProgressInput => {
  if (typeof input !== 'object' || input === null) return false
  
  const obj = input as Record<string, unknown>
  
  return (
    typeof obj.userBookId === 'string' &&
    obj.userBookId.length > 0 &&
    typeof obj.currentPage === 'number' &&
    obj.currentPage >= 0 &&
    Number.isInteger(obj.currentPage) &&
    (obj.sessionNotes === undefined || typeof obj.sessionNotes === 'string')
  )
}

// ランタイム型チェック用のResult型
export type Result<T, E = Error> = {
  readonly success: true
  readonly data: T
} | {
  readonly success: false
  readonly error: E
}

// より厳密な範囲チェック
export const validatePageRange = (startPage: number, endPage: number, maxPages?: number): Result<boolean, string> => {
  if (!Number.isInteger(startPage) || !Number.isInteger(endPage)) {
    return { success: false, error: 'ページ番号は整数である必要があります' }
  }
  
  if (startPage < 1) {
    return { success: false, error: '開始ページは1以上である必要があります' }
  }
  
  if (endPage < startPage) {
    return { success: false, error: '終了ページは開始ページ以上である必要があります' }
  }
  
  if (maxPages && endPage > maxPages) {
    return { success: false, error: `ページ番号は最大${maxPages}ページまでです` }
  }
  
  const pagesRead = endPage - startPage + 1
  if (pagesRead > 1000) {
    return { success: false, error: '1セッションで1000ページを超える読書は異常値です' }
  }
  
  return { success: true, data: true }
}

export interface ReadingSession {
  id: string
  userBookId: string
  startPage: number
  endPage: number
  pagesRead: number
  sessionDate: Date
  durationMinutes: number | null
  notes: string | null
  createdAt: Date
}

export interface UserBookProgress {
  id: string
  currentPage: number
  status: string
  startDate: Date | null
  finishDate: Date | null
  book: {
    id: string
    title: string
    pageCount: number | null
  }
}

export interface UpdateProgressResult {
  success: boolean
  data?: {
    updatedUserBook: UserBookProgress
    newSession: ReadingSession
    isCompleted: boolean
    progressPercentage: number
  }
  error?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ReadingStats {
  totalReadingTime: number      // 総読書時間（分）
  averageSessionTime: number    // 平均セッション時間（分）
  totalPagesRead: number        // 総読書ページ数
  averagePagesPerSession: number // 平均ページ/セッション
  averagePagesPerDay: number    // 平均ページ/日
  booksCompleted: number        // 完読書籍数
  totalCompletedPages: number   // 完読総ページ数
  averageBookLength: number     // 平均書籍ページ数
  booksInProgress: number       // 読書中書籍数
  dailyStats: DailyStats[]      // 日別統計
  weeklyStats: WeeklyStats[]    // 週別統計
  readingPace: {
    last7Days: number
    last30Days: number
  }
  readingConsistency: number    // 読書の一貫性（0-1）
}

export interface DailyStats {
  date: string
  pagesRead: number
  readingTime: number
  sessionsCount: number
}

export interface WeeklyStats {
  weekStart: string
  pagesRead: number
  readingTime: number
  sessionsCount: number
  booksCompleted: number
}

export interface ReadingStatsOptions {
  days?: number
  weeks?: number
}

export interface ReadingSpeed {
  averageSpeed: number      // 平均読書速度（ページ/分）
  minSpeed: number          // 最低速度
  maxSpeed: number          // 最高速度
  validSessions: number     // 有効セッション数
  outliers: number[]        // 異常値配列
}

export interface MonthlyStats {
  month: string             // YYYY-MM 形式
  pagesRead: number
  readingTime: number
  sessionsCount: number
  booksCompleted: number
}