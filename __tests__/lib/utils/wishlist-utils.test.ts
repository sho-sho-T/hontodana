/**
 * ウィッシュリスト管理ユーティリティのテスト
 */

import {
  sortByPriority,
  getPriorityDisplay,
  validateWishlistInput
} from '@/lib/utils/wishlist-utils'

describe('wishlist-utils', () => {
  describe('sortByPriority', () => {
    test('優先度順で正しくソートされる', () => {
      const items = [
        { priority: 'medium', title: 'Book B' },
        { priority: 'urgent', title: 'Book A' },
        { priority: 'low', title: 'Book D' },
        { priority: 'high', title: 'Book C' }
      ]
      
      const sorted = sortByPriority(items)
      
      expect(sorted[0].priority).toBe('urgent')
      expect(sorted[1].priority).toBe('high')
      expect(sorted[2].priority).toBe('medium')
      expect(sorted[3].priority).toBe('low')
    })

    test('同じ優先度の場合はタイトル順', () => {
      const items = [
        { priority: 'medium', title: 'Book C' },
        { priority: 'medium', title: 'Book A' },
        { priority: 'medium', title: 'Book B' }
      ]
      
      const sorted = sortByPriority(items, { secondarySort: 'title' })
      
      expect(sorted[0].title).toBe('Book A')
      expect(sorted[1].title).toBe('Book B')
      expect(sorted[2].title).toBe('Book C')
    })

    test('空配列の場合は空配列を返す', () => {
      const result = sortByPriority([])
      expect(result).toEqual([])
    })
  })

  describe('getPriorityDisplay', () => {
    test('urgent優先度の表示情報が正しい', () => {
      const display = getPriorityDisplay('urgent')
      
      expect(display).toEqual({
        label: '緊急',
        color: 'red',
        icon: '🔴',
        weight: 4
      })
    })

    test('high優先度の表示情報が正しい', () => {
      const display = getPriorityDisplay('high')
      
      expect(display).toEqual({
        label: '高',
        color: 'orange', 
        icon: '🟡',
        weight: 3
      })
    })
    
    test('medium優先度の表示情報が正しい', () => {
      const display = getPriorityDisplay('medium')
      
      expect(display).toEqual({
        label: '中',
        color: 'green',
        icon: '🟢', 
        weight: 2
      })
    })
    
    test('low優先度の表示情報が正しい', () => {
      const display = getPriorityDisplay('low')
      
      expect(display).toEqual({
        label: '低',
        color: 'gray',
        icon: '⚪',
        weight: 1
      })
    })

    test('無効な優先度の場合はデフォルト値を返す', () => {
      const display = getPriorityDisplay('invalid')
      
      expect(display).toEqual({
        label: '中',
        color: 'green',
        icon: '🟢', 
        weight: 2
      })
    })
  })

  describe('validateWishlistInput', () => {
    test('有効な入力データが通る', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30) // 30日後
      
      const input = {
        bookId: 'valid-book-id',
        priority: 'medium',
        reason: '面白そうだから',
        targetDate: futureDate
      }
      
      const result = validateWishlistInput(input)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('最小限の入力データが通る', () => {
      const input = {
        bookId: 'valid-book-id'
      }
      
      const result = validateWishlistInput(input)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('空のbookIdでエラー', () => {
      const input = { bookId: '' }
      
      const result = validateWishlistInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('書籍IDが必要です')
    })

    test('nullのbookIdでエラー', () => {
      const input = { bookId: null }
      
      const result = validateWishlistInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('書籍IDが必要です')
    })

    test('無効な優先度でエラー', () => {
      const input = {
        bookId: 'valid-book-id',
        priority: 'invalid-priority'
      }
      
      const result = validateWishlistInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('無効な優先度です')
    })

    test('過去の目標日でエラー', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      
      const input = {
        bookId: 'valid-book-id',
        targetDate: pastDate
      }
      
      const result = validateWishlistInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('目標日は未来の日付である必要があります')
    })

    test('負の価格アラートでエラー', () => {
      const input = {
        bookId: 'valid-book-id',
        priceAlert: -100
      }
      
      const result = validateWishlistInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('価格アラートは0以上である必要があります')
    })

    test('理由が長すぎる場合エラー', () => {
      const longReason = 'a'.repeat(501) // 500文字を超える
      
      const input = {
        bookId: 'valid-book-id',
        reason: longReason
      }
      
      const result = validateWishlistInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('理由は500文字以下である必要があります')
    })
  })
})