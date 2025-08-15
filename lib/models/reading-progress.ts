/**
 * 読書進捗管理に関する型定義
 */

export interface UpdateProgressInput {
  userBookId: string
  currentPage: number
  sessionNotes?: string
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