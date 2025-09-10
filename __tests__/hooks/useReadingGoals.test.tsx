/**
 * 読書目標管理Hook テスト - TDD Red フェーズ
 * P1優先度テストケース: 読書目標CRUD操作、目標進捗計算
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useReadingGoals } from '@/hooks/useReadingGoals'
import { prisma } from '@/lib/prisma'
import { createTestUserBook, createTestUser } from '@/__tests__/fixtures/bookData'

describe('useReadingGoals', () => {
  const testUserId = '550e8400-e29b-41d4-a716-446655440001'

  beforeEach(async () => {
    // テストデータのクリーンアップ
    await prisma.readingGoal.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.userBook.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.book.deleteMany({
      where: { userBooks: { none: {} } }
    })
  })

  afterEach(async () => {
    await prisma.readingGoal.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.userBook.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.book.deleteMany({
      where: { userBooks: { none: {} } }
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - 読書目標CRUD操作
  describe('P1: 読書目標CRUD操作テスト', () => {
    test('読書目標の作成', async () => {
      const { result } = renderHook(() => useReadingGoals(testUserId))

      const goalData = {
        type: 'books_per_year' as const,
        targetValue: 50,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      }

      await act(async () => {
        await result.current.createGoal(goalData)
      })

      expect(result.current.goals).toHaveLength(1)
      expect(result.current.goals[0].targetValue).toBe(50)
      expect(result.current.goals[0].isActive).toBe(true)
    })

    test('目標進捗の計算', async () => {
      // 準備: 年間50冊の目標を作成
      const goal = await createTestReadingGoal(testUserId, {
        userId: testUserId,
        type: 'books_per_year',
        targetValue: 50,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      })

      // 完読書籍を10冊作成
      for (let i = 0; i < 10; i++) {
        await createTestUserBook({
          userId: testUserId,
          status: 'completed',
          finishDate: new Date()
        })
      }

      const { result } = renderHook(() => useReadingGoals(testUserId))

      await waitFor(() => {
        const progress = result.current.calculateProgress(goal)
        expect(progress.currentValue).toBe(10)
        expect(progress.progressPercentage).toBe(20) // 10/50 * 100
        expect(progress.isOnTrack).toBe(true) // 1月で20%なら順調
      })
    })

    test('複数目標の同時管理', async () => {
      const { result } = renderHook(() => useReadingGoals(testUserId))

      const booksGoal = {
        type: 'books_per_year' as const,
        targetValue: 50,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      }

      const pagesGoal = {
        type: 'pages_per_month' as const,
        targetValue: 1000,
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-31')
      }

      await act(async () => {
        await result.current.createGoal(booksGoal)
        await result.current.createGoal(pagesGoal)
      })

      expect(result.current.goals).toHaveLength(2)
      expect(result.current.activeGoals).toHaveLength(2)
      expect(result.current.goals.find(g => g.type === 'books_per_year')).toBeDefined()
      expect(result.current.goals.find(g => g.type === 'pages_per_month')).toBeDefined()
    })

    test('目標達成アラートの生成', async () => {
      const goal = await createTestReadingGoal(testUserId, {
        userId: testUserId,
        type: 'pages_per_month',
        targetValue: 1000,
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-31')
      })

      // 月末まで5日、進捗50%の状況を想定
      const { result } = renderHook(() => useReadingGoals(testUserId))

      const mockDate = new Date('2024-08-26')
      jest.useFakeTimers().setSystemTime(mockDate)

      const alerts = result.current.getGoalAlerts()

      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('behind_schedule')
      expect(alerts[0].message).toContain('目標達成が困難')

      jest.useRealTimers()
    })

    test('目標の更新', async () => {
      const goal = await createTestReadingGoal(testUserId, {
        userId: testUserId,
        type: 'books_per_year',
        targetValue: 50
      })

      const { result } = renderHook(() => useReadingGoals(testUserId))

      await act(async () => {
        await result.current.updateGoal(goal.id, { targetValue: 60 })
      })

      const updatedGoal = result.current.goals.find(g => g.id === goal.id)
      expect(updatedGoal?.targetValue).toBe(60)
    })

    test('目標の削除', async () => {
      const goal = await createTestReadingGoal(testUserId, {
        userId: testUserId,
        type: 'books_per_year',
        targetValue: 50
      })

      const { result } = renderHook(() => useReadingGoals(testUserId))

      await act(async () => {
        await result.current.deleteGoal(goal.id)
      })

      expect(result.current.goals).toHaveLength(0)
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - 目標進捗追跡
  describe('P1: 目標進捗追跡テスト', () => {
    test('年間書籍目標の進捗計算', async () => {
      const goal = await createTestReadingGoal(testUserId, {
        userId: testUserId,
        type: 'books_per_year',
        targetValue: 50,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      })

      // 25冊完読 (50%)
      for (let i = 0; i < 25; i++) {
        await createTestUserBook({
          userId: testUserId,
          status: 'completed',
          finishDate: new Date(`2024-06-${i + 1}`)
        })
      }

      const { result } = renderHook(() => useReadingGoals(testUserId))

      await waitFor(() => {
        const progress = result.current.calculateProgress(goal)
        expect(progress.currentValue).toBe(25)
        expect(progress.progressPercentage).toBe(50)
        expect(progress.remainingToTarget).toBe(25)
      })
    })

    test('月間ページ目標の進捗計算', async () => {
      const goal = await createTestReadingGoal(testUserId, {
        userId: testUserId,
        type: 'pages_per_month',
        targetValue: 1000,
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-31')
      })

      // 読書セッションを作成 (累計600ページ読了)
      const userBook = await createTestUserBook({ userId: testUserId })
      
      for (let i = 0; i < 6; i++) {
        await createTestReadingSession({
          userBookId: userBook.id,
          startPage: i * 100 + 1,
          endPage: (i + 1) * 100,
          sessionDate: new Date(`2024-08-${i + 1}`)
        })
      }

      const { result } = renderHook(() => useReadingGoals(testUserId))

      await waitFor(() => {
        const progress = result.current.calculateProgress(goal)
        expect(progress.currentValue).toBe(600) // 100 * 6 sessions
        expect(progress.progressPercentage).toBe(60)
        expect(progress.isOnTrack).toBe(true)
      })
    })

    test('目標期間終了後の処理', async () => {
      const expiredGoal = await createTestReadingGoal(testUserId, {
        userId: testUserId,
        type: 'books_per_year',
        targetValue: 50,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31') // 過去の期間
      })

      const { result } = renderHook(() => useReadingGoals(testUserId))

      await waitFor(() => {
        const activeGoals = result.current.activeGoals
        const allGoals = result.current.goals
        
        expect(allGoals).toHaveLength(1) // 全体には含まれる
        expect(activeGoals).toHaveLength(0) // アクティブからは除外される
        
        const progress = result.current.calculateProgress(expiredGoal)
        expect(progress.isExpired).toBe(true)
      })
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - エラーハンドリング
  describe('P1: エラーハンドリングテスト', () => {
    test('無効な目標データでのエラー処理', async () => {
      const { result } = renderHook(() => useReadingGoals(testUserId))

      const invalidGoalData = {
        type: 'invalid_type' as any,
        targetValue: -10, // 負の値
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01') // 開始日より前の終了日
      }

      await act(async () => {
        try {
          await result.current.createGoal(invalidGoalData)
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect(error.message).toContain('Invalid goal data')
        }
      })

      expect(result.current.goals).toHaveLength(0)
    })

    test('存在しない目標の更新エラー', async () => {
      const { result } = renderHook(() => useReadingGoals(testUserId))

      await act(async () => {
        try {
          await result.current.updateGoal('nonexistent-goal-id', { targetValue: 100 })
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect(error.message).toContain('Goal not found')
        }
      })
    })

    test('データベース接続エラーの処理', async () => {
      // データベース接続を一時的に切断
      await prisma.$disconnect()

      const { result } = renderHook(() => useReadingGoals(testUserId))

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
        expect(result.current.error?.message).toContain('データベース')
        expect(result.current.isLoading).toBe(false)
      })

      // データベース接続を復元
      await prisma.$connect()
    })
  })
})

// テスト用読書目標作成ヘルパー関数
const createTestReadingGoal = async (userId: string, overrides = {}) => {
  return await prisma.readingGoal.create({
    data: {
      userId,
      type: 'books_per_year',
      targetValue: 50,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      isActive: true,
      ...overrides
    }
  })
}

// テスト用読書セッション作成ヘルパー関数
const createTestReadingSession = async (overrides = {}) => {
  return await prisma.readingSession.create({
    data: {
      userBookId: 'test-userbook-id',
      startPage: 1,
      endPage: 100,
      pagesRead: 99,
      sessionDate: new Date(),
      durationMinutes: 60,
      ...overrides
    }
  })
}