/**
 * 読書統計サービス
 */

import { prisma } from '@/lib/prisma'
import type { ReadingStats, ReadingStatsOptions, DailyStats, WeeklyStats } from '@/lib/models/reading-progress'

/**
 * 読書統計を生成
 */
export async function generateReadingStats(
  userId: string,
  options: ReadingStatsOptions = {}
): Promise<ReadingStats> {
  try {
    // 効率的なデータ取得
    const [
      sessionsData,
      completedBooks,
      booksInProgress,
      // 統計用集計データ
      sessionStats
    ] = await Promise.all([
      // 全セッションデータ（最新順）
      prisma.readingSession.findMany({
        where: {
          userBook: { userId }
        },
        select: {
          id: true,
          startPage: true,
          endPage: true,
          pagesRead: true,
          sessionDate: true,
          durationMinutes: true,
          userBook: {
            select: {
              book: {
                select: {
                  pageCount: true
                }
              }
            }
          }
        },
        orderBy: {
          sessionDate: 'desc'
        }
      }),
      
      // 完読書籍
      prisma.userBook.findMany({
        where: {
          userId,
          status: 'completed'
        },
        select: {
          book: {
            select: {
              pageCount: true
            }
          }
        }
      }),
      
      // 読書中書籍数
      prisma.userBook.count({
        where: {
          userId,
          status: 'reading'
        }
      }),
      
      // 統計集計
      prisma.readingSession.groupBy({
        by: ['userBookId'],
        where: {
          userBook: { userId }
        },
        _sum: {
          durationMinutes: true,
          pagesRead: true
        },
        _count: {
          id: true
        }
      })
    ])

    // 基本統計計算
    const totalReadingTime = sessionsData.reduce((sum, session) => 
      sum + (session.durationMinutes || 0), 0
    )
    
    const averageSessionTime = sessionsData.length > 0 
      ? Math.round(totalReadingTime / sessionsData.length)
      : 0

    const totalPagesRead = sessionsData.reduce((sum, session) => 
      sum + (session.pagesRead || 0), 0
    )
    
    const averagePagesPerSession = sessionsData.length > 0
      ? Math.round((totalPagesRead / sessionsData.length) * 10) / 10
      : 0

    // 完読書籍統計
    const totalCompletedPages = completedBooks.reduce((sum, book) => 
      sum + (book.book.pageCount || 0), 0
    )
    
    const averageBookLength = completedBooks.length > 0
      ? Math.round(totalCompletedPages / completedBooks.length)
      : 0

    // 日別統計生成
    const dailyStats = generateDailyStats(sessionsData, options.days || 7)
    
    // 週別統計生成
    const weeklyStats = generateWeeklyStats(sessionsData, options.weeks || 4)

    // 読書ペース計算
    const last7DaysPages = dailyStats.slice(0, 7).reduce((sum, day) => sum + day.pagesRead, 0)
    const last30DaysStats = generateDailyStats(sessionsData, 30)
    const last30DaysPages = last30DaysStats.reduce((sum, day) => sum + day.pagesRead, 0)

    const readingPace = {
      last7Days: Math.round((last7DaysPages / 7) * 10) / 10,
      last30Days: Math.round((last30DaysPages / 30) * 10) / 10
    }

    // 読書の一貫性計算（簡易版）
    const readingConsistency = calculateReadingConsistency(dailyStats)

    return {
      totalReadingTime,
      averageSessionTime,
      totalPagesRead,
      averagePagesPerSession,
      averagePagesPerDay: readingPace.last7Days,
      booksCompleted: completedBooks.length,
      totalCompletedPages,
      averageBookLength,
      booksInProgress,
      dailyStats,
      weeklyStats,
      readingPace,
      readingConsistency
    }

  } catch (error) {
    // エラー時はデフォルト値を返す
    return {
      totalReadingTime: 0,
      averageSessionTime: 0,
      totalPagesRead: 0,
      averagePagesPerSession: 0,
      averagePagesPerDay: 0,
      booksCompleted: 0,
      totalCompletedPages: 0,
      averageBookLength: 0,
      booksInProgress: 0,
      dailyStats: [],
      weeklyStats: [],
      readingPace: {
        last7Days: 0,
        last30Days: 0
      },
      readingConsistency: 0
    }
  }
}

/**
 * 日別統計を生成
 */
function generateDailyStats(sessionsData: any[], days: number): DailyStats[] {
  const stats: DailyStats[] = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const daySessions = sessionsData.filter(session => 
      session.sessionDate.toISOString().split('T')[0] === dateStr
    )
    
    stats.push({
      date: dateStr,
      pagesRead: daySessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0),
      readingTime: daySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
      sessionsCount: daySessions.length
    })
  }
  
  return stats
}

/**
 * 週別統計を生成
 */
function generateWeeklyStats(sessionsData: any[], weeks: number): WeeklyStats[] {
  const stats: WeeklyStats[] = []
  
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (i * 7))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    const weekSessions = sessionsData.filter(session => {
      const sessionDate = session.sessionDate
      return sessionDate >= weekStart && sessionDate <= weekEnd
    })
    
    stats.push({
      weekStart: weekStart.toISOString().split('T')[0],
      pagesRead: weekSessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0),
      readingTime: weekSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
      sessionsCount: weekSessions.length,
      booksCompleted: 0 // 簡易版では0
    })
  }
  
  return stats
}

/**
 * 読書の一貫性を計算（0-1）
 */
function calculateReadingConsistency(dailyStats: DailyStats[]): number {
  if (dailyStats.length === 0) return 0
  
  const activeDays = dailyStats.filter(day => day.pagesRead > 0).length
  return Math.round((activeDays / dailyStats.length) * 100) / 100
}