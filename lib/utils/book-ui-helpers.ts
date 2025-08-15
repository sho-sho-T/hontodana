/**
 * 書籍UIで使用する共通ユーティリティ関数
 */

import { BookStatus } from '@/lib/models/book'

/**
 * BookStatusを日本語のラベルに変換
 */
export function getStatusLabel(status: BookStatus): string {
  switch (status) {
    case BookStatus.WANT_TO_READ:
      return '読みたい'
    case BookStatus.READING:
      return '読書中'
    case BookStatus.READ:
      return '読了'
    default:
      return status
  }
}

/**
 * BookStatusに応じたCSSクラスを取得
 */
export function getStatusColor(status: BookStatus): string {
  switch (status) {
    case BookStatus.WANT_TO_READ:
      return 'bg-yellow-100 text-yellow-800'
    case BookStatus.READING:
      return 'bg-blue-100 text-blue-800'
    case BookStatus.READ:
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * 日付をYYYY-MM-DD形式でフォーマット
 */
export function formatDate(date: Date | null): string {
  return date ? date.toISOString().split('T')[0] : '-'
}

/**
 * 進捗率を計算（境界値処理付き）
 */
export function calculateProgress(current: number, total: number): number {
  if (total <= 0) return 0
  if (current < 0) return 0
  if (current > total) return 100
  
  return Math.round((current / total) * 100)
}