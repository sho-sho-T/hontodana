/**
 * 読書進捗管理ユーティリティ関数のテスト
 */

import {
  calculateProgressPercentage,
  validateProgressInput,
  calculateSessionDuration
} from '@/lib/utils/reading-progress'

describe('読書進捗管理ユーティリティ', () => {
  describe('calculateProgressPercentage', () => {
    test('半分読了の場合、50.0%を返す', () => {
      const result = calculateProgressPercentage(150, 300)
      expect(result).toBe(50.0)
    })

    test('全て読了の場合、100.0%を返す', () => {
      const result = calculateProgressPercentage(300, 300)
      expect(result).toBe(100.0)
    })

    test('開始前の場合、0.0%を返す', () => {
      const result = calculateProgressPercentage(0, 300)
      expect(result).toBe(0.0)
    })

    test('小数点以下1桁で正確に計算される', () => {
      const result = calculateProgressPercentage(100, 300)
      expect(result).toBe(33.3)
    })

    test('総ページ数が0の場合、0.0%を返す', () => {
      const result = calculateProgressPercentage(50, 0)
      expect(result).toBe(0.0)
    })

    test('総ページ数がnullの場合、0.0%を返す', () => {
      const result = calculateProgressPercentage(50, null)
      expect(result).toBe(0.0)
    })

    test('現在ページが総ページ数を超える場合、100.0%を返す', () => {
      const result = calculateProgressPercentage(350, 300)
      expect(result).toBe(100.0)
    })
  })

  describe('validateProgressInput', () => {
    test('有効な進捗データが通る', async () => {
      const input = {
        userBookId: 'valid-uuid',
        currentPage: 150,
        sessionNotes: 'chapter 3まで読了'
      }
      const result = await validateProgressInput(input)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('無効なuserBookIdでエラー', async () => {
      const input = {
        userBookId: '',
        currentPage: 150
      }
      const result = await validateProgressInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('userBookIdが無効です')
    })

    test('負のページ数でエラー', async () => {
      const input = {
        userBookId: 'valid-uuid',
        currentPage: -10
      }
      const result = await validateProgressInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ページ数は1以上である必要があります')
    })

    test('0ページでエラー', async () => {
      const input = {
        userBookId: 'valid-uuid',
        currentPage: 0
      }
      const result = await validateProgressInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ページ数は1以上である必要があります')
    })

    test('非整数ページ数でエラー', async () => {
      const input = {
        userBookId: 'valid-uuid',
        currentPage: 150.5
      }
      const result = await validateProgressInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ページ数は整数である必要があります')
    })
  })

  describe('calculateSessionDuration', () => {
    test('1時間のセッション', () => {
      const startTime = new Date('2024-01-01T10:00:00Z')
      const endTime = new Date('2024-01-01T11:00:00Z')
      const duration = calculateSessionDuration(startTime, endTime)
      expect(duration).toBe(60)
    })

    test('30分のセッション', () => {
      const startTime = new Date('2024-01-01T10:00:00Z')
      const endTime = new Date('2024-01-01T10:30:00Z')
      const duration = calculateSessionDuration(startTime, endTime)
      expect(duration).toBe(30)
    })

    test('同じ時刻の場合、0分', () => {
      const time = new Date('2024-01-01T10:00:00Z')
      const duration = calculateSessionDuration(time, time)
      expect(duration).toBe(0)
    })

    test('終了時刻が開始時刻より前の場合、0分を返す', () => {
      const startTime = new Date('2024-01-01T11:00:00Z')
      const endTime = new Date('2024-01-01T10:00:00Z')
      const duration = calculateSessionDuration(startTime, endTime)
      expect(duration).toBe(0)
    })
  })
})