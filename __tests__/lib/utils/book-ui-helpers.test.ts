/**
 * book-ui-helpers.test.ts - 書籍UI共通ユーティリティのテスト
 */

import { BookStatus } from '@/lib/models/book'
import {
  getStatusLabel,
  getStatusColor,
  formatDate,
  calculateProgress
} from '@/lib/utils/book-ui-helpers'

describe('getStatusLabel', () => {
  test('各ステータスの正しいラベルを返す', () => {
    expect(getStatusLabel(BookStatus.WANT_TO_READ)).toBe('読みたい')
    expect(getStatusLabel(BookStatus.READING)).toBe('読書中')
    expect(getStatusLabel(BookStatus.READ)).toBe('読了')
  })

  test('不明なステータスはそのまま返す', () => {
    expect(getStatusLabel('unknown' as BookStatus)).toBe('unknown')
  })
})

describe('getStatusColor', () => {
  test('各ステータスの正しいCSSクラスを返す', () => {
    expect(getStatusColor(BookStatus.WANT_TO_READ)).toBe('bg-yellow-100 text-yellow-800')
    expect(getStatusColor(BookStatus.READING)).toBe('bg-blue-100 text-blue-800')
    expect(getStatusColor(BookStatus.READ)).toBe('bg-green-100 text-green-800')
  })

  test('不明なステータスはデフォルトクラスを返す', () => {
    expect(getStatusColor('unknown' as BookStatus)).toBe('bg-gray-100 text-gray-800')
  })
})

describe('formatDate', () => {
  test('日付を正しくフォーマットする', () => {
    const date = new Date('2023-12-25T10:30:00Z')
    expect(formatDate(date)).toBe('2023-12-25')
  })

  test('nullの場合はダッシュを返す', () => {
    expect(formatDate(null)).toBe('-')
  })
})

describe('calculateProgress', () => {
  test('正常な進捗率を計算する', () => {
    expect(calculateProgress(50, 100)).toBe(50)
    expect(calculateProgress(1, 3)).toBe(33)
    expect(calculateProgress(2, 3)).toBe(67)
  })

  test('境界値を正しく処理する', () => {
    expect(calculateProgress(0, 100)).toBe(0)
    expect(calculateProgress(100, 100)).toBe(100)
    expect(calculateProgress(-10, 100)).toBe(0)
    expect(calculateProgress(110, 100)).toBe(100)
  })

  test('無効な値の場合は0を返す', () => {
    expect(calculateProgress(50, 0)).toBe(0)
    expect(calculateProgress(50, -10)).toBe(0)
  })
})