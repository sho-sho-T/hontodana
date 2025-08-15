/**
 * 読書進捗管理ユーティリティ関数
 */

import type { ValidationResult } from '@/lib/models/reading-progress'

/**
 * 進捗率を計算
 */
export function calculateProgressPercentage(
  currentPage: number,
  totalPages: number | null
): number {
  if (!totalPages || totalPages <= 0) {
    return 0.0
  }
  
  if (currentPage >= totalPages) {
    return 100.0
  }
  
  if (currentPage <= 0) {
    return 0.0
  }
  
  const percentage = (currentPage / totalPages) * 100
  return Math.round(percentage * 10) / 10 // 小数点1桁で四捨五入
}

/**
 * 進捗入力データのバリデーション
 */
export async function validateProgressInput(input: {
  userBookId: string
  currentPage: number
  sessionNotes?: string
}): Promise<ValidationResult> {
  const errors: string[] = []

  // userBookId のチェック
  if (!input.userBookId || input.userBookId.trim() === '') {
    errors.push('userBookIdが無効です')
  }

  // currentPage のチェック
  if (!Number.isInteger(input.currentPage)) {
    errors.push('ページ数は整数である必要があります')
  } else if (input.currentPage < 1) {
    errors.push('ページ数は1以上である必要があります')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * セッション時間を計算（分）
 */
export function calculateSessionDuration(
  startTime: Date,
  endTime: Date
): number {
  const diffMs = endTime.getTime() - startTime.getTime()
  if (diffMs <= 0) {
    return 0
  }
  
  return Math.round(diffMs / (1000 * 60)) // ミリ秒を分に変換
}