/**
 * 統計API エンドポイント テスト - TDD Red フェーズ
 * P1優先度テストケース: ダッシュボード統計API、読書目標API
 */

import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { GET as dashboardHandler } from '@/app/api/statistics/dashboard/route'
import { GET as goalsHandler, POST as createGoalHandler, PUT as updateGoalHandler } from '@/app/api/statistics/goals/route'
import { prisma } from '@/lib/prisma'
import { createTestUser, createTestUserBook, createTestReadingSession } from '@/__tests__/fixtures/bookData'

// テスト用JWT生成関数
const generateTestJWT = (userId: string) => {
  // 実際のJWT実装は後でGreenフェーズで作成
  return `test-jwt-token-${userId}`
}

const generateExpiredJWT = () => {
  return 'expired-jwt-token'
}

describe('/api/statistics/dashboard', () => {
  const testUserId = 'test-user-api'
  let validToken: string

  beforeEach(async () => {
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
    await prisma.userProfile.deleteMany({
      where: { id: testUserId }
    })

    // テストユーザー作成
    await createTestUser({ id: testUserId })
    validToken = generateTestJWT(testUserId)
  })

  afterEach(async () => {
    await prisma.readingSession.deleteMany({
      where: { userBook: { userId: testUserId } }
    })
    await prisma.userBook.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.book.deleteMany({
      where: { userBooks: { none: {} } }
    })
    await prisma.userProfile.deleteMany({
      where: { id: testUserId }
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - ダッシュボード統計API
  describe('P1: ダッシュボード統計API テスト', () => {
    test('認証済みユーザーの統計データを返す', async () => {
      // 準備: テストデータ作成
      const userBook = await createTestUserBook({ userId: testUserId })
      await createTestReadingSession({
        userBookId: userBook.id,
        startPage: 1,
        endPage: 50,
        durationMinutes: 60
      })

      const request = new NextRequest('http://localhost:3000/api/statistics/dashboard', {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const response = await dashboardHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('totalReadingTime')
      expect(data).toHaveProperty('totalPagesRead')
      expect(data).toHaveProperty('booksCompleted')
      expect(data).toHaveProperty('dailyStats')
      expect(data).toHaveProperty('readingPace')
    })

    test('期間指定パラメータが正常に動作する', async () => {
      const userBook = await createTestUserBook({ userId: testUserId })
      
      // 過去30日のセッションデータ作成
      for (let i = 0; i < 30; i++) {
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

      const request = new NextRequest('http://localhost:3000/api/statistics/dashboard?timeRange=month&days=30', {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const response = await dashboardHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.dailyStats).toHaveLength(30)
    })

    test('データが存在しない新規ユーザーへの対応', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics/dashboard', {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const response = await dashboardHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.totalReadingTime).toBe(0)
      expect(data.totalPagesRead).toBe(0)
      expect(data.booksCompleted).toBe(0)
      expect(data.dailyStats).toEqual([])
    })

    test('不正なパラメータでバリデーションエラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics/dashboard?days=-1&timeRange=invalid', {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const response = await dashboardHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
      expect(data.error.details).toContain('days must be positive')
    })

    test('未認証ユーザーは401エラー', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics/dashboard')

      const response = await dashboardHandler(request)

      expect(response.status).toBe(401)
    })

    test('無効なトークンで401エラー', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics/dashboard', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })

      const response = await dashboardHandler(request)

      expect(response.status).toBe(401)
    })

    test('期限切れトークンで401エラー', async () => {
      const expiredToken = generateExpiredJWT()
      const request = new NextRequest('http://localhost:3000/api/statistics/dashboard', {
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      })

      const response = await dashboardHandler(request)

      expect(response.status).toBe(401)
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - エラーハンドリング
  describe('P1: APIエラーハンドリングテスト', () => {
    test('データベース接続エラーの処理', async () => {
      // データベース接続を切断
      await prisma.$disconnect()

      const request = new NextRequest('http://localhost:3000/api/statistics/dashboard', {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const response = await dashboardHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
      expect(data.error.code).toBe('DATABASE_CONNECTION_ERROR')
      expect(data.error.message).toContain('データベースに接続できません')

      // データベース接続を復元
      await prisma.$connect()
    })

    test('SQLインジェクション対策', async () => {
      const maliciousInput = "'; DROP TABLE user_books; --"
      
      const request = new NextRequest(`http://localhost:3000/api/statistics/dashboard?filter=${encodeURIComponent(maliciousInput)}`, {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const response = await dashboardHandler(request)

      expect(response.status).toBe(200) // エラーではなく、安全に処理される

      // テーブルが削除されていないことを確認
      const userBooks = await prisma.userBook.findMany()
      expect(userBooks).toBeDefined()
    })

    test('大きなリクエストデータでの処理', async () => {
      // 非常に大きな days パラメータ
      const request = new NextRequest('http://localhost:3000/api/statistics/dashboard?days=10000', {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const response = await dashboardHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.details).toContain('days parameter too large')
    })

    test('レート制限の適用', async () => {
      // 100回の連続リクエストをシミュレート
      const requests = []
      for (let i = 0; i < 100; i++) {
        const request = new NextRequest('http://localhost:3000/api/statistics/dashboard', {
          headers: {
            'Authorization': `Bearer ${validToken}`,
            'X-Real-IP': '127.0.0.1'
          }
        })
        requests.push(dashboardHandler(request))
      }

      const responses = await Promise.all(requests)
      
      // 一部のリクエストが429エラーになることを確認
      const tooManyRequests = responses.filter(response => response.status === 429)
      expect(tooManyRequests.length).toBeGreaterThan(0)
    })
  })
})

describe('/api/statistics/goals', () => {
  const testUserId = 'test-user-goals-api'
  let validToken: string

  beforeEach(async () => {
    await prisma.readingGoal.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.userProfile.deleteMany({
      where: { id: testUserId }
    })

    await createTestUser({ id: testUserId })
    validToken = generateTestJWT(testUserId)
  })

  afterEach(async () => {
    await prisma.readingGoal.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.userProfile.deleteMany({
      where: { id: testUserId }
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - 読書目標API
  describe('P1: 読書目標API テスト', () => {
    test('読書目標の作成', async () => {
      const goalData = {
        type: 'books_per_year',
        targetValue: 50,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }

      const request = new NextRequest('http://localhost:3000/api/statistics/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(goalData)
      })

      const response = await createGoalHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.goal.id).toBeDefined()
      expect(data.goal.targetValue).toBe(50)
      expect(data.goal.isActive).toBe(true)
    })

    test('目標の更新', async () => {
      // 準備: 目標を作成
      const goal = await createTestReadingGoal({ userId: testUserId })

      const updateData = { targetValue: 60 }

      const request = new NextRequest(`http://localhost:3000/api/statistics/goals/${goal.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const response = await updateGoalHandler(request, { params: { id: goal.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.goal.targetValue).toBe(60)
    })

    test('目標進捗の取得', async () => {
      // 準備: 目標と進捗データ作成
      const goal = await createTestReadingGoal({ userId: testUserId })
      await createTestUserBook({
        userId: testUserId,
        status: 'completed'
      })

      const request = new NextRequest(`http://localhost:3000/api/statistics/goals/${goal.id}/progress`, {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const response = await goalsHandler(request, { params: { id: goal.id, action: 'progress' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.progress.currentValue).toBeGreaterThan(0)
      expect(data.progress.progressPercentage).toBeGreaterThan(0)
    })

    test('他ユーザーの目標へのアクセス拒否', async () => {
      // 他のユーザーの目標を作成
      const otherUserId = 'other-user-id'
      await createTestUser({ id: otherUserId })
      const otherUserGoal = await createTestReadingGoal({ userId: otherUserId })

      const request = new NextRequest(`http://localhost:3000/api/statistics/goals/${otherUserGoal.id}`, {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const response = await goalsHandler(request, { params: { id: otherUserGoal.id } })

      expect(response.status).toBe(403)
    })

    test('存在しない目標へのアクセス', async () => {
      const nonexistentId = 'nonexistent-goal-id'

      const request = new NextRequest(`http://localhost:3000/api/statistics/goals/${nonexistentId}`, {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const response = await goalsHandler(request, { params: { id: nonexistentId } })

      expect(response.status).toBe(404)
    })

    test('無効な目標データでのバリデーションエラー', async () => {
      const invalidGoalData = {
        type: 'invalid_type',
        targetValue: -10, // 負の値
        startDate: '2024-12-31',
        endDate: '2024-01-01' // 開始日より前の終了日
      }

      const request = new NextRequest('http://localhost:3000/api/statistics/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidGoalData)
      })

      const response = await createGoalHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
      expect(data.error.details).toBeDefined()
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - セキュリティ対策
  describe('P1: セキュリティ対策テスト', () => {
    test('XSS攻撃対策', async () => {
      const xssInput = '<script>alert("xss")</script>'
      
      const goal = await createTestReadingGoal({ userId: testUserId })

      const request = new NextRequest(`http://localhost:3000/api/statistics/goals/${goal.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: xssInput })
      })

      const response = await updateGoalHandler(request, { params: { id: goal.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      // レスポンスでスクリプトタグがエスケープされていること
      expect(data.goal.notes).not.toContain('<script>')
      expect(data.goal.notes).toContain('&lt;script&gt;')
    })

    test('CSRF攻撃対策', async () => {
      const goalData = {
        type: 'books_per_year',
        targetValue: 50,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }

      // CSRFトークンなしでのリクエスト
      const request = new NextRequest('http://localhost:3000/api/statistics/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json',
          'Origin': 'https://malicious-site.com' // 異なるオリジン
        },
        body: JSON.stringify(goalData)
      })

      const response = await createGoalHandler(request)

      expect(response.status).toBe(403) // CSRF攻撃として拒否
    })

    test('認可の確認', async () => {
      // 権限のないユーザーでの操作
      const unauthorizedToken = generateTestJWT('unauthorized-user-id')
      const goal = await createTestReadingGoal({ userId: testUserId })

      const request = new NextRequest(`http://localhost:3000/api/statistics/goals/${goal.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${unauthorizedToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetValue: 100 })
      })

      const response = await updateGoalHandler(request, { params: { id: goal.id } })

      expect(response.status).toBe(403)
    })
  })
})

// テスト用読書目標作成ヘルパー関数
const createTestReadingGoal = async (overrides = {}) => {
  return await prisma.readingGoal.create({
    data: {
      userId: 'test-user-id',
      type: 'books_per_year',
      targetValue: 50,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      isActive: true,
      ...overrides
    }
  })
}