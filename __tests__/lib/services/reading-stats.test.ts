/**
 * 読書統計サービスのテスト - TDD Red フェーズ
 * P1優先度テストケース: 基本統計計算、期間別統計、読書速度計算
 */

import { generateReadingStats, calculateReadingSpeed, generateDailyStats, generateMonthlyStats } from '@/lib/services/reading-stats'
import { prisma } from '@/lib/prisma'
import { createTestUserBook, createTestReadingSession } from '@/__tests__/fixtures/bookData'

describe('generateReadingStats', () => {
  const testUserId = 'test-user-id'

  afterEach(async () => {
    // テストデータのクリーンアップ
    await prisma.readingSession.deleteMany({
      where: { userBook: { userId: testUserId } }
    })
    await prisma.userBook.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.book.deleteMany({
      where: { userBooks: { none: {} } }
    })
  })

  describe('基本統計', () => {
    test('基本統計が正しく計算される', async () => {
      // 準備：複数のセッションデータを作成
      const userBook1 = await createTestUserBook({ userId: testUserId })
      const userBook2 = await createTestUserBook({ userId: testUserId })
      
      await createTestReadingSession({
        userBookId: userBook1.id,
        startPage: 1,
        endPage: 20,
        durationMinutes: 30
      })
      
      await createTestReadingSession({
        userBookId: userBook1.id,
        startPage: 21,
        endPage: 50,
        durationMinutes: 45
      })
      
      await createTestReadingSession({
        userBookId: userBook2.id,
        startPage: 1,
        endPage: 25,
        durationMinutes: 60
      })

      // 実行
      const stats = await generateReadingStats(testUserId)

      // 検証
      expect(stats.totalReadingTime).toBe(135) // 30+45+60
      expect(stats.averageSessionTime).toBe(45) // 135/3
      expect(stats.totalPagesRead).toBe(75) // 20+30+25
      expect(stats.averagePagesPerSession).toBe(25) // 75/3
    })

    test('データがない場合の統計', async () => {
      const stats = await generateReadingStats('user-with-no-data')

      expect(stats.totalReadingTime).toBe(0)
      expect(stats.averageSessionTime).toBe(0)
      expect(stats.totalPagesRead).toBe(0)
      expect(stats.averagePagesPerSession).toBe(0)
      expect(stats.dailyStats).toEqual([])
      expect(stats.weeklyStats).toEqual([])
    })
  })

  describe('期間別統計', () => {
    test('日別統計が正しく計算される', async () => {
      const userBook = await createTestUserBook({ userId: testUserId })
      
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      // 今日のセッション
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 1,
        endPage: 30,
        durationMinutes: 45,
        sessionDate: today
      })
      
      // 昨日のセッション
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 31,
        endPage: 50,
        durationMinutes: 30,
        sessionDate: yesterday
      })

      const stats = await generateReadingStats(testUserId, { days: 7 })

      expect(stats.dailyStats).toHaveLength(7)
      expect(stats.dailyStats[0].pagesRead).toBe(30) // 今日
      expect(stats.dailyStats[1].pagesRead).toBe(20) // 昨日
    })

    test('週別統計が正しく計算される', async () => {
      const userBook = await createTestUserBook({ userId: testUserId })
      
      const thisWeek = new Date()
      const lastWeek = new Date(thisWeek)
      lastWeek.setDate(lastWeek.getDate() - 7)
      
      // 今週のセッション
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 1,
        endPage: 50,
        durationMinutes: 60,
        sessionDate: thisWeek
      })
      
      // 先週のセッション
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 51,
        endPage: 80,
        durationMinutes: 45,
        sessionDate: lastWeek
      })

      const stats = await generateReadingStats(testUserId, { weeks: 4 })

      expect(stats.weeklyStats).toHaveLength(4)
      expect(stats.weeklyStats[0].pagesRead).toBe(50) // 今週
      expect(stats.weeklyStats[1].pagesRead).toBe(30) // 先週
    })
  })

  describe('読書ペース計算', () => {
    test('読書ペースが正しく計算される', async () => {
      const userBook = await createTestUserBook({ userId: testUserId })
      
      // 過去7日間のセッションを作成
      for (let i = 0; i < 7; i++) {
        const sessionDate = new Date()
        sessionDate.setDate(sessionDate.getDate() - i)
        
        await createTestReadingSession({
          userBookId: userBook.id,
          startPage: i * 10 + 1,
          endPage: (i + 1) * 10,
          durationMinutes: 30,
          sessionDate
        })
      }

      const stats = await generateReadingStats(testUserId)

      expect(stats.averagePagesPerDay).toBe(10) // 70ページ ÷ 7日
      expect(stats.readingPace.last7Days).toBe(10)
      expect(stats.readingPace.last30Days).toBeLessThanOrEqual(10)
    })

    test('不規則な読書パターンのペース計算', async () => {
      const userBook = await createTestUserBook({ userId: testUserId })
      
      const today = new Date()
      
      // 集中的に読書した日
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 1,
        endPage: 100,
        durationMinutes: 120,
        sessionDate: today
      })
      
      // 3日前に少し読書
      const threeDaysAgo = new Date(today)
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 101,
        endPage: 110,
        durationMinutes: 15,
        sessionDate: threeDaysAgo
      })

      const stats = await generateReadingStats(testUserId)

      expect(stats.totalPagesRead).toBe(109)
      expect(stats.averagePagesPerSession).toBe(54.5)
      expect(stats.readingConsistency).toBeLessThan(1) // 不規則なパターン
    })
  })

  describe('書籍完読統計', () => {
    test('完読書籍の統計が正しく計算される', async () => {
      // 完読した書籍
      const completedBook1 = await createTestUserBook({
        userId: testUserId,
        status: 'completed',
        finishDate: new Date(),
        book: { pageCount: 300 }
      })
      
      const completedBook2 = await createTestUserBook({
        userId: testUserId,
        status: 'completed',
        finishDate: new Date(),
        book: { pageCount: 200 }
      })
      
      // 読書中の書籍
      await createTestUserBook({
        userId: testUserId,
        status: 'reading',
        currentPage: 150,
        book: { pageCount: 400 }
      })

      const stats = await generateReadingStats(testUserId)

      expect(stats.booksCompleted).toBe(2)
      expect(stats.totalCompletedPages).toBe(500)
      expect(stats.averageBookLength).toBe(250)
      expect(stats.booksInProgress).toBe(1)
    })
  })

  describe('パフォーマンステスト', () => {
    test('大量データでの統計処理が3秒以内', async () => {
      // 大量のテストデータを作成
      const userBook = await createTestUserBook({ userId: testUserId })
      
      const sessions = []
      for (let i = 0; i < 100; i++) {
        sessions.push({
          userBookId: userBook.id,
          startPage: i * 5 + 1,
          endPage: (i + 1) * 5,
          durationMinutes: 30,
          sessionDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        })
      }
      
      await Promise.all(sessions.map(session => createTestReadingSession(session)))

      const startTime = Date.now()
      const stats = await generateReadingStats(testUserId)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(3000)
      expect(stats.totalReadingTime).toBe(3000) // 100 sessions * 30 minutes
      expect(stats.totalPagesRead).toBe(500) // 100 sessions * 5 pages
    }, 10000)
  })

  // TDD Red フェーズ: P1優先度テストケース - 複数書籍の統計集計
  describe('P1: 複数書籍の統計計算テスト', () => {
    test('複数書籍の統計が正確に集計される', async () => {
      // 準備: 複数の書籍データ
      const book1 = await createTestUserBook({
        userId: testUserId,
        status: 'completed',
        currentPage: 200,
        book: { pageCount: 200 }
      })
      
      const book2 = await createTestUserBook({
        userId: testUserId,
        status: 'reading',
        currentPage: 100,
        book: { pageCount: 300 }
      })

      await createTestReadingSession({
        userBookId: book1.id,
        startPage: 1,
        endPage: 200,
        durationMinutes: 300
      })
      
      await createTestReadingSession({
        userBookId: book2.id,
        startPage: 1,
        endPage: 100,
        durationMinutes: 150
      })

      // 実行
      const stats = await generateReadingStats(testUserId)

      // 検証
      expect(stats.booksCompleted).toBe(1)
      expect(stats.booksInProgress).toBe(1)
      expect(stats.totalCompletedPages).toBe(200)
      expect(stats.averageBookLength).toBe(200)
      expect(stats.totalReadingTime).toBe(450)
    })

    test('無効なセッションデータは除外される', async () => {
      const userBook = await createTestUserBook({ userId: testUserId })
      
      // 有効なセッション
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 1,
        endPage: 50,
        durationMinutes: 60
      })
      
      // 無効なセッション (endPage < startPage)
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 100,
        endPage: 50, // 無効
        durationMinutes: -10 // 無効
      })

      const stats = await generateReadingStats(testUserId)

      expect(stats.totalPagesRead).toBe(49) // 有効なセッションのみ
      expect(stats.totalReadingTime).toBe(60) // 有効なセッションのみ
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - 読書速度計算
  describe('P1: 読書速度計算テスト', () => {
    test('平均読書速度が正確に計算される', async () => {
      const userBook = await createTestUserBook({ userId: testUserId })
      
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 1,
        endPage: 60,
        durationMinutes: 60 // 1ページ/分
      })
      
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 61,
        endPage: 120,
        durationMinutes: 30 // 2ページ/分
      })

      const speed = await calculateReadingSpeed(testUserId)

      expect(speed.averageSpeed).toBeCloseTo(1.5) // (1+2)/2
      expect(speed.minSpeed).toBe(1)
      expect(speed.maxSpeed).toBe(2)
    })

    test('異常値は除外して計算される', async () => {
      const userBook = await createTestUserBook({ userId: testUserId })
      
      // 通常のセッション
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 1,
        endPage: 30,
        durationMinutes: 30
      })
      
      // 異常に高速なセッション（誤入力想定）
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 31,
        endPage: 1000,
        durationMinutes: 1 // 969ページ/分 - 異常値
      })

      const speed = await calculateReadingSpeed(testUserId)

      // 異常値は除外されること
      expect(speed.averageSpeed).toBeCloseTo(1) // 29/30 ≈ 1
      expect(speed.outliers).toHaveLength(1)
    })

    test('0除算エラーが適切に処理される', async () => {
      const userBook = await createTestUserBook({ userId: testUserId })
      
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 1,
        endPage: 50,
        durationMinutes: 0 // 0除算ケース
      })

      const speed = await calculateReadingSpeed(testUserId)

      expect(speed.averageSpeed).toBe(0)
      expect(speed.validSessions).toBe(0)
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - 月別統計計算
  describe('P1: 月別統計計算テスト', () => {
    test('月別統計が正確に生成される', async () => {
      const userBook = await createTestUserBook({ userId: testUserId })
      
      const thisMonth = new Date()
      const lastMonth = new Date(thisMonth)
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 1,
        endPage: 200,
        durationMinutes: 300,
        sessionDate: thisMonth
      })
      
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 201,
        endPage: 300,
        durationMinutes: 180,
        sessionDate: lastMonth
      })

      const monthlyStats = await generateMonthlyStats(testUserId, 3)

      expect(monthlyStats).toHaveLength(3)
      expect(monthlyStats[0].pagesRead).toBe(199) // 今月
      expect(monthlyStats[1].pagesRead).toBe(99) // 先月
    })
  })
})