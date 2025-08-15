/**
 * ウィッシュリスト機能に関する型定義
 */

import type { Decimal } from '@prisma/client/runtime/library'

export type WishlistPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface WishlistItemData {
  id: string
  userId: string
  bookId: string
  priority: WishlistPriority
  reason: string | null
  targetDate: Date | null
  priceAlert: Decimal | null
  createdAt: Date
  updatedAt: Date
}

export interface WishlistItemWithBook extends WishlistItemData {
  book: {
    id: string
    title: string
    authors: string[]
    publisher: string | null
    thumbnailUrl: string | null
    pageCount: number | null
    description: string | null
    categories: string[]
  }
}

export interface AddToWishlistInput {
  bookId: string
  priority?: WishlistPriority
  reason?: string
  targetDate?: Date
  priceAlert?: number
}

export interface UpdatePriorityInput {
  wishlistItemId: string
  priority: WishlistPriority
}

export interface RemoveFromWishlistInput {
  wishlistItemId: string
}

export interface MoveToLibraryInput {
  wishlistItemId: string
  bookType?: import('@/lib/models/book').BookType
  status?: import('@/lib/models/book').BookStatus
}

export interface GetWishlistInput {
  priority?: WishlistPriority
  sortBy?: 'createdAt' | 'priority' | 'targetDate' | 'title'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface WishlistActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface PriorityDisplay {
  label: string
  color: string
  icon: string
  weight: number
}

export interface SortOptions {
  secondarySort?: string
}