/**
 * 書籍データモデルの型定義
 */

// Prismaから生成された型を再エクスポート
import type { BookType as PrismaBookType, ReadingStatus as PrismaReadingStatus } from '@/lib/generated/prisma'
import type { Decimal } from '@prisma/client/runtime/library'

export type BookStatus = PrismaReadingStatus
export type BookType = PrismaBookType

// 便利な定数として古いenumも維持（後方互換性）
export const BookStatus = {
  WANT_TO_READ: 'want_to_read' as PrismaReadingStatus,
  READING: 'reading' as PrismaReadingStatus,
  READ: 'completed' as PrismaReadingStatus, // Prismaスキーマでは 'completed'
  PAUSED: 'paused' as PrismaReadingStatus,
  ABANDONED: 'abandoned' as PrismaReadingStatus,
  REFERENCE: 'reference' as PrismaReadingStatus
} as const

export const BookType = {
  PHYSICAL: 'physical' as PrismaBookType,
  KINDLE: 'kindle' as PrismaBookType, 
  EPUB: 'epub' as PrismaBookType,
  AUDIOBOOK: 'audiobook' as PrismaBookType,
  OTHER: 'other' as PrismaBookType
} as const

// Google Books APIレスポンス型（部分的）
export interface GoogleBooksApiResponse {
  id: string
  volumeInfo: {
    title?: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    description?: string
    pageCount?: number
    categories?: string[]
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    industryIdentifiers?: Array<{
      type: 'ISBN_10' | 'ISBN_13' | 'OTHER'
      identifier: string
    }>
    language?: string
    averageRating?: number
    ratingsCount?: number
    previewLink?: string
    infoLink?: string
  }
}

// アプリケーション内で使用する正規化された書籍データ型
export interface NormalizedBookData {
  googleBooksId: string
  title: string
  authors: string[]
  publisher?: string
  publishedDate?: string
  description?: string
  isbn10?: string
  isbn13?: string
  pageCount?: number
  categories: string[]
  thumbnailUrl?: string
  language: string
  averageRating?: number
  ratingsCount: number
  previewLink?: string
  infoLink?: string
}

// UserBook作成用のデータ型
export interface CreateUserBookData {
  userId: string
  bookId: string
  bookType: BookType
  status: BookStatus
}

// Server Actionのレスポンス型
export type ServerActionResult<T> = T | { error: string }

// 表示モード関連の型定義
export type ViewMode = 'grid' | 'list'

// フィルタ関連の型定義
export interface BookFilter {
  type: 'status' | 'author' | 'category'
  value: string
  label: string
}

// ソート関連の型定義
export type SortField = 'title' | 'author' | 'createdAt' | 'updatedAt'
export type SortOrder = 'asc' | 'desc'

// コンポーネントProps型定義
export interface BookCardProps {
  book: UserBookWithBook
  viewMode: ViewMode
  onStatusChange: (bookId: string, status: BookStatus) => void
  onRemove: (bookId: string) => void
}

export interface BookListProps {
  books: UserBookWithBook[]
  onStatusChange: (bookId: string, status: BookStatus) => void
  onRemove: (bookId: string) => void
  sortBy: SortField
  sortOrder: SortOrder
  onSort: (field: SortField, order: SortOrder) => void
  activeFilters?: BookFilter[]
  onClearFilters?: () => void
}

export interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

export interface ProgressBarProps {
  current: number
  total: number
  label?: string
}

export interface BookSkeletonProps {
  viewMode: ViewMode
  count?: number
}

// UserBookの完全なデータ型（データベースから取得）
export interface UserBookWithBook {
  id: string
  userId: string
  bookId: string
  bookType: BookType
  status: BookStatus
  currentPage: number // Prismaスキーマのフィールド名に合わせる
  startDate?: Date | null
  finishDate?: Date | null
  rating?: number | null
  review?: string | null
  notes: string[]
  tags: string[]
  isFavorite: boolean
  acquiredDate?: Date | null
  location?: string | null
  createdAt: Date
  updatedAt: Date
  book: {
    id: string
    googleBooksId: string | null
    title: string
    authors: string[]
    publisher?: string | null
    publishedDate?: string | null
    isbn10?: string | null
    isbn13?: string | null
    pageCount?: number | null
    language: string
    description?: string | null
    thumbnailUrl?: string | null
    previewLink?: string | null
    infoLink?: string | null
    categories: string[]
    averageRating?: Decimal | null
    ratingsCount: number
    createdAt: Date
    updatedAt: Date
  }
}