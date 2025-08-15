/**
 * 書籍データモデルの型定義
 */

// Prismaのデータベーススキーマに合わせた型定義
export enum BookStatus {
  WANT_TO_READ = 'want_to_read',
  READING = 'reading',
  READ = 'completed', // Prismaスキーマでは 'completed'
  PAUSED = 'paused',
  ABANDONED = 'abandoned',
  REFERENCE = 'reference'
}

export enum BookType {
  PHYSICAL = 'physical',
  KINDLE = 'kindle', 
  EPUB = 'epub',
  AUDIOBOOK = 'audiobook',
  OTHER = 'other'
}

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
  progress: number // currentPage から progress に変更してテストと一致させる
  startDate?: Date | null
  finishDate?: Date | null
  rating?: number | null
  review?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  book: {
    id: string
    googleBooksId: string
    title: string
    authors: string[]
    publisher?: string
    publishedDate?: string
    isbn10?: string
    isbn13?: string
    pageCount?: number
    language: string
    description?: string
    thumbnailUrl?: string | null
    previewLink?: string
    infoLink?: string
    categories: string[]
    averageRating?: number
    ratingsCount: number
    createdAt: Date
    updatedAt: Date
  }
}