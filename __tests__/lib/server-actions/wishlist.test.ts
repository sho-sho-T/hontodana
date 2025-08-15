/**
 * ウィッシュリスト Server Actions のテスト
 */

import {
  addToWishlist,
  removeFromWishlist,
  updateWishlistPriority,
  moveToLibrary,
  getUserWishlist
} from '@/lib/server-actions/wishlist'
import { prisma } from '@/lib/generated/prisma'
import { createTestBook, createTestUser, createTestUserBook, createTestWishlistItem } from '@/__tests__/fixtures/bookData'

// モック設定
jest.mock('@/lib/supabase/server')
jest.mock('next/cache')

const mockCreateClient = {
  auth: {
    getUser: jest.fn()
  }
}

const { createClient } = require('@/lib/supabase/server')
createClient.mockResolvedValue(mockCreateClient)

const { revalidatePath } = require('next/cache')
revalidatePath.mockImplementation(() => {})

describe('ウィッシュリスト Server Actions', () => {
  const testUserId = 'test-user-id'
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.auth.getUser.mockResolvedValue({
      data: { user: { id: testUserId } }
    })
  })

  afterEach(async () => {
    // テストデータのクリーンアップ
    await prisma.wishlistItem.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.userBook.deleteMany({
      where: { userId: testUserId }
    })
    await prisma.book.deleteMany({
      where: { userBooks: { none: {} }, wishlistItems: { none: {} } }
    })
  })

  describe('addToWishlist', () => {
    test('新しい書籍がウィッシュリストに追加される', async () => {
      // 準備
      const book = await createTestBook()
      
      // 実行
      const result = await addToWishlist({
        bookId: book.id,
        priority: 'high',
        reason: 'レビューが良かった'
      })
      
      // 検証
      expect(result.success).toBe(true)
      expect(result.data.bookId).toBe(book.id)
      expect(result.data.priority).toBe('high')
      expect(result.data.reason).toBe('レビューが良かった')
    })

    test('デフォルト優先度で追加される', async () => {
      const book = await createTestBook()
      
      const result = await addToWishlist({
        bookId: book.id
      })
      
      expect(result.success).toBe(true)
      expect(result.data.priority).toBe('medium')
    })

    test('目標日付きで追加される', async () => {
      const book = await createTestBook()
      const targetDate = new Date('2024-12-31')
      
      const result = await addToWishlist({
        bookId: book.id,
        targetDate
      })
      
      expect(result.success).toBe(true)
      expect(result.data.targetDate).toEqual(targetDate)
    })

    test('認証なしでエラー', async () => {
      mockCreateClient.auth.getUser.mockResolvedValue({
        data: { user: null }
      })
      
      const result = await addToWishlist({
        bookId: 'some-book-id'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('認証が必要です')
    })

    test('存在しない書籍でエラー', async () => {
      const result = await addToWishlist({
        bookId: 'non-existent-book-id'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('指定された書籍が見つかりません')
    })

    test('既に本棚にある書籍でエラー', async () => {
      const book = await createTestBook()
      await createTestUserBook({ 
        userId: testUserId,
        bookId: book.id 
      })
      
      const result = await addToWishlist({
        bookId: book.id
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('この書籍は既に本棚に登録されています')
    })

    test('既にウィッシュリストにある書籍でエラー', async () => {
      const book = await createTestBook()
      await createTestWishlistItem({ 
        userId: testUserId,
        bookId: book.id 
      })
      
      const result = await addToWishlist({
        bookId: book.id
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('この書籍は既にウィッシュリストに登録されています')
    })
  })

  describe('updateWishlistPriority', () => {
    test('優先度が正しく更新される', async () => {
      const wishlistItem = await createTestWishlistItem({
        userId: testUserId,
        priority: 'medium'
      })
      
      const result = await updateWishlistPriority({
        wishlistItemId: wishlistItem.id,
        priority: 'urgent'
      })
      
      expect(result.success).toBe(true)
      expect(result.data.priority).toBe('urgent')
    })

    test('他のユーザーのアイテム更新でエラー', async () => {
      const otherUserItem = await createTestWishlistItem({
        userId: 'other-user-id'
      })
      
      const result = await updateWishlistPriority({
        wishlistItemId: otherUserItem.id,
        priority: 'high'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('アクセス権限がありません')
    })

    test('存在しないアイテムでエラー', async () => {
      const result = await updateWishlistPriority({
        wishlistItemId: 'non-existent-id',
        priority: 'high'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('指定されたアイテムが見つかりません')
    })
  })

  describe('moveToLibrary', () => {
    test('ウィッシュリストから本棚に移動される', async () => {
      const wishlistItem = await createTestWishlistItem({
        userId: testUserId
      })
      
      const result = await moveToLibrary({
        wishlistItemId: wishlistItem.id,
        bookType: 'physical',
        status: 'want_to_read'
      })
      
      expect(result.success).toBe(true)
      expect(result.data.userBook.bookId).toBe(wishlistItem.bookId)
      expect(result.data.userBook.bookType).toBe('physical')
      expect(result.data.userBook.status).toBe('want_to_read')
      
      // ウィッシュリストから削除されていることを確認
      const deletedItem = await prisma.wishlistItem.findUnique({
        where: { id: wishlistItem.id }
      })
      expect(deletedItem).toBeNull()
    })

    test('デフォルト値で本棚に移動される', async () => {
      const wishlistItem = await createTestWishlistItem({
        userId: testUserId
      })
      
      const result = await moveToLibrary({
        wishlistItemId: wishlistItem.id
      })
      
      expect(result.success).toBe(true)
      expect(result.data.userBook.bookType).toBe('physical')
      expect(result.data.userBook.status).toBe('want_to_read')
    })
  })

  describe('removeFromWishlist', () => {
    test('ウィッシュリストから削除される', async () => {
      const wishlistItem = await createTestWishlistItem({
        userId: testUserId
      })
      
      const result = await removeFromWishlist({
        wishlistItemId: wishlistItem.id
      })
      
      expect(result.success).toBe(true)
      
      // 削除されていることを確認
      const deletedItem = await prisma.wishlistItem.findUnique({
        where: { id: wishlistItem.id }
      })
      expect(deletedItem).toBeNull()
    })

    test('他のユーザーのアイテム削除でエラー', async () => {
      const otherUserItem = await createTestWishlistItem({
        userId: 'other-user-id'
      })
      
      const result = await removeFromWishlist({
        wishlistItemId: otherUserItem.id
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('アクセス権限がありません')
    })
  })

  describe('getUserWishlist', () => {
    test('ユーザーのウィッシュリストが取得される', async () => {
      await createTestWishlistItem({ 
        userId: testUserId,
        priority: 'urgent' 
      })
      await createTestWishlistItem({ 
        userId: testUserId,
        priority: 'medium' 
      })
      await createTestWishlistItem({ 
        userId: testUserId,
        priority: 'low' 
      })
      
      const result = await getUserWishlist()
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      // デフォルトは優先度順
      expect(result.data[0].priority).toBe('urgent')
      expect(result.data[1].priority).toBe('medium')
      expect(result.data[2].priority).toBe('low')
    })

    test('優先度フィルタが動作する', async () => {
      await createTestWishlistItem({ 
        userId: testUserId,
        priority: 'urgent' 
      })
      await createTestWishlistItem({ 
        userId: testUserId,
        priority: 'medium' 
      })
      await createTestWishlistItem({ 
        userId: testUserId,
        priority: 'low' 
      })
      
      const result = await getUserWishlist({
        priority: 'urgent'
      })
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].priority).toBe('urgent')
    })

    test('ページネーションが動作する', async () => {
      // 5件のアイテムを作成
      for (let i = 0; i < 5; i++) {
        await createTestWishlistItem({ userId: testUserId })
      }
      
      const result = await getUserWishlist({
        limit: 3,
        offset: 2
      })
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
    })

    test('他のユーザーのアイテムは取得されない', async () => {
      await createTestWishlistItem({ userId: testUserId })
      await createTestWishlistItem({ userId: 'other-user-id' })
      
      const result = await getUserWishlist()
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].userId).toBe(testUserId)
    })
  })
})