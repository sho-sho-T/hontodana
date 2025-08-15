/**
 * 読書進捗Server Actionsのテスト
 */

import { updateReadingProgress } from '@/lib/server-actions/reading-progress'
import { prisma } from '@/lib/prisma'
import { createTestUserBook, createTestUser, createTestBook } from '@/__tests__/fixtures/bookData'

// モック設定
jest.mock('@/lib/supabase/server')
jest.mock('next/cache')

const mockCreateClient = {
  auth: {
    getUser: jest.fn()
  }
}

// Supabaseクライアントのモック
const { createClient } = require('@/lib/supabase/server')
createClient.mockResolvedValue(mockCreateClient)

// revalidatePathのモック
const { revalidatePath } = require('next/cache')
revalidatePath.mockImplementation(() => {})

describe('updateReadingProgress Server Action', () => {
  const testUserId = 'test-user-id'
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.auth.getUser.mockResolvedValue({
      data: { user: { id: testUserId } }
    })
  })

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

  describe('正常系', () => {
    test('初回進捗更新が成功', async () => {
      // 準備
      const userBook = await createTestUserBook({
        userId: testUserId,
        currentPage: 0,
        status: 'want_to_read',
        book: { pageCount: 300 }
      })

      // 実行
      const result = await updateReadingProgress({
        userBookId: userBook.id,
        currentPage: 50,
        sessionNotes: 'chapter 3まで読了'
      })

      // 検証
      expect(result.success).toBe(true)
      expect(result.data?.updatedUserBook.currentPage).toBe(50)
      expect(result.data?.updatedUserBook.status).toBe('reading')
      expect(result.data?.newSession.startPage).toBe(1)
      expect(result.data?.newSession.endPage).toBe(50)
      expect(result.data?.progressPercentage).toBe(16.7)
      expect(result.data?.isCompleted).toBe(false)
    })

    test('継続的な進捗更新が成功', async () => {
      // 準備
      const userBook = await createTestUserBook({
        userId: testUserId,
        currentPage: 100,
        status: 'reading',
        book: { pageCount: 300 }
      })

      // 実行
      const result = await updateReadingProgress({
        userBookId: userBook.id,
        currentPage: 150,
        sessionNotes: 'chapter 5まで読了'
      })

      // 検証
      expect(result.success).toBe(true)
      expect(result.data?.updatedUserBook.currentPage).toBe(150)
      expect(result.data?.updatedUserBook.status).toBe('reading')
      expect(result.data?.newSession.startPage).toBe(101)
      expect(result.data?.newSession.endPage).toBe(150)
      expect(result.data?.progressPercentage).toBe(50.0)
      expect(result.data?.isCompleted).toBe(false)
    })

    test('読了完了時の処理', async () => {
      // 準備
      const userBook = await createTestUserBook({
        userId: testUserId,
        currentPage: 250,
        status: 'reading',
        book: { pageCount: 300 }
      })

      // 実行
      const result = await updateReadingProgress({
        userBookId: userBook.id,
        currentPage: 300,
        sessionNotes: '読了！'
      })

      // 検証
      expect(result.success).toBe(true)
      expect(result.data?.updatedUserBook.currentPage).toBe(300)
      expect(result.data?.updatedUserBook.status).toBe('completed')
      expect(result.data?.updatedUserBook.finishDate).toBeTruthy()
      expect(result.data?.isCompleted).toBe(true)
      expect(result.data?.progressPercentage).toBe(100.0)
    })

    test('ページ数不明な書籍の進捗更新', async () => {
      // 準備
      const userBook = await createTestUserBook({
        userId: testUserId,
        currentPage: 0,
        status: 'want_to_read',
        book: { pageCount: null }
      })

      // 実行
      const result = await updateReadingProgress({
        userBookId: userBook.id,
        currentPage: 50
      })

      // 検証
      expect(result.success).toBe(true)
      expect(result.data?.updatedUserBook.currentPage).toBe(50)
      expect(result.data?.updatedUserBook.status).toBe('reading')
      expect(result.data?.progressPercentage).toBe(0.0)
    })
  })

  describe('エラー系', () => {
    test('認証なしでエラー', async () => {
      mockCreateClient.auth.getUser.mockResolvedValue({
        data: { user: null }
      })

      const result = await updateReadingProgress({
        userBookId: 'some-id',
        currentPage: 50
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('認証が必要です')
    })

    test('存在しないuserBookIdでエラー', async () => {
      const result = await updateReadingProgress({
        userBookId: 'non-existent-id',
        currentPage: 50
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('指定された書籍が見つかりません')
    })

    test('進捗の逆行でエラー', async () => {
      // 準備
      const userBook = await createTestUserBook({
        userId: testUserId,
        currentPage: 100,
        status: 'reading',
        book: { pageCount: 300 }
      })

      // 実行
      const result = await updateReadingProgress({
        userBookId: userBook.id,
        currentPage: 50  // 逆行
      })

      // 検証
      expect(result.success).toBe(false)
      expect(result.error).toBe('進捗を逆行させることはできません')
    })

    test('総ページ数の超過でエラー', async () => {
      // 準備
      const userBook = await createTestUserBook({
        userId: testUserId,
        currentPage: 200,
        status: 'reading',
        book: { pageCount: 300 }
      })

      // 実行
      const result = await updateReadingProgress({
        userBookId: userBook.id,
        currentPage: 350  // 超過
      })

      // 検証
      expect(result.success).toBe(false)
      expect(result.error).toBe('総ページ数を超えています')
    })

    test('無効なページ数でエラー', async () => {
      const userBook = await createTestUserBook({
        userId: testUserId,
        currentPage: 0,
        status: 'want_to_read'
      })

      const result = await updateReadingProgress({
        userBookId: userBook.id,
        currentPage: -10
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('ページ数は1以上である必要があります')
    })

    test('他のユーザーの書籍更新でエラー', async () => {
      // 他のユーザーの書籍を作成
      const otherUserBook = await createTestUserBook({
        userId: 'other-user-id',
        currentPage: 0,
        status: 'want_to_read'
      })

      const result = await updateReadingProgress({
        userBookId: otherUserBook.id,
        currentPage: 50
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('指定された書籍が見つかりません')
    })
  })
})