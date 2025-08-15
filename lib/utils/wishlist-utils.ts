/**
 * ウィッシュリスト管理ユーティリティ関数
 */

import type { 
  WishlistPriority, 
  ValidationResult, 
  PriorityDisplay, 
  SortOptions 
} from '@/lib/models/wishlist'

/**
 * 優先度の重みを定義
 */
const PRIORITY_WEIGHTS: Record<WishlistPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
}

/**
 * 優先度の表示情報を取得
 */
export function getPriorityDisplay(priority: string): PriorityDisplay {
  const validPriority = priority as WishlistPriority
  
  switch (validPriority) {
    case 'urgent':
      return {
        label: '緊急',
        color: 'red',
        icon: '🔴',
        weight: 4
      }
    case 'high':
      return {
        label: '高',
        color: 'orange',
        icon: '🟡',
        weight: 3
      }
    case 'medium':
      return {
        label: '中',
        color: 'green',
        icon: '🟢',
        weight: 2
      }
    case 'low':
      return {
        label: '低',
        color: 'gray',
        icon: '⚪',
        weight: 1
      }
    default:
      // デフォルトはmedium
      return {
        label: '中',
        color: 'green',
        icon: '🟢',
        weight: 2
      }
  }
}

/**
 * 優先度順でソート
 */
export function sortByPriority<T extends { priority: string; title?: string }>(
  items: T[],
  options: SortOptions = {}
): T[] {
  if (items.length === 0) {
    return []
  }

  return [...items].sort((a, b) => {
    // 第一ソート: 優先度（高い順）
    const aWeight = PRIORITY_WEIGHTS[a.priority as WishlistPriority] || 2
    const bWeight = PRIORITY_WEIGHTS[b.priority as WishlistPriority] || 2
    
    if (aWeight !== bWeight) {
      return bWeight - aWeight // 高い優先度が先
    }

    // 第二ソート: タイトル順（オプション）
    if (options.secondarySort === 'title' && a.title && b.title) {
      return a.title.localeCompare(b.title, 'ja')
    }

    return 0
  })
}

/**
 * ウィッシュリスト入力データのバリデーション
 */
export function validateWishlistInput(input: {
  bookId: any
  priority?: any
  reason?: any
  targetDate?: any
  priceAlert?: any
}): ValidationResult {
  const errors: string[] = []

  // bookId のチェック
  if (!input.bookId || input.bookId === null || input.bookId.trim() === '') {
    errors.push('書籍IDが必要です')
  }

  // priority のチェック（指定されている場合）
  if (input.priority !== undefined) {
    const validPriorities: WishlistPriority[] = ['low', 'medium', 'high', 'urgent']
    if (!validPriorities.includes(input.priority)) {
      errors.push('無効な優先度です')
    }
  }

  // targetDate のチェック（指定されている場合）
  if (input.targetDate !== undefined && input.targetDate !== null) {
    const targetDate = new Date(input.targetDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // 時刻を00:00:00にリセット
    
    if (targetDate < today) {
      errors.push('目標日は未来の日付である必要があります')
    }
  }

  // priceAlert のチェック（指定されている場合）
  if (input.priceAlert !== undefined && input.priceAlert !== null) {
    if (typeof input.priceAlert !== 'number' || input.priceAlert < 0) {
      errors.push('価格アラートは0以上である必要があります')
    }
  }

  // reason のチェック（指定されている場合）
  if (input.reason !== undefined && input.reason !== null) {
    if (typeof input.reason === 'string' && input.reason.length > 500) {
      errors.push('理由は500文字以下である必要があります')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 有効な優先度かチェック
 */
export function isValidPriority(priority: any): priority is WishlistPriority {
  const validPriorities: WishlistPriority[] = ['low', 'medium', 'high', 'urgent']
  return validPriorities.includes(priority)
}