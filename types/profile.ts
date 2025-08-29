// Profile関連の型定義

import type { BookType } from '@/lib/generated/prisma'

export type Theme = 'light' | 'dark' | 'system'
export type DisplayMode = 'grid' | 'list'
export type BooksPerPage = 10 | 20 | 50 | 100

// プロフィール更新用の型
export interface UserProfileUpdateData {
  name: string
  avatarUrl?: string | null
  readingGoal?: number | null
}

// 設定更新用の型
export interface UserSettingsUpdateData {
  theme: Theme
  displayMode: DisplayMode
  booksPerPage: BooksPerPage
  defaultBookType: BookType
}

// 画像アップロード用の型
export interface ImageUploadResult {
  success: boolean
  url?: string
  error?: string
}

// Server Action結果型
export interface ProfileActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// プロフィール表示用の型
export interface UserProfileData {
  id: string
  name: string
  avatarUrl: string | null
  theme: Theme
  displayMode: DisplayMode
  booksPerPage: BooksPerPage
  defaultBookType: BookType
  readingGoal: number | null
  createdAt: Date
  updatedAt: Date
}

// コンポーネント Props型
export interface ProfileFormProps {
  profile: Partial<UserProfileData>
  onSave: (data: UserProfileUpdateData) => Promise<void>
  loading?: boolean
  className?: string
}

export interface ThemeSelectorProps {
  currentTheme: Theme
  onChange: (theme: Theme) => void
  className?: string
}

export interface DisplaySettingsProps {
  settings: UserSettingsUpdateData
  onChange: (settings: UserSettingsUpdateData) => void
  className?: string
}

export interface AvatarUploadProps {
  currentUrl?: string | null
  onUpload: (file: File) => Promise<void>
  onDelete?: () => Promise<void>
  loading?: boolean
  className?: string
}

// バリデーション用の型
export interface ProfileValidationError {
  field: string
  message: string
}

export interface ProfileValidationResult {
  valid: boolean
  errors: ProfileValidationError[]
}

// TASK-301で追加: テスト用の型定義
export interface UserPreferences {
  theme: Theme
  displayMode: DisplayMode
  booksPerPage: number
  defaultBookType: BookType
  readingGoal?: number
}

export interface UserSettingsProps {
  settings: UserPreferences
  onSave: (settings: UserPreferences) => Promise<void>
  loading: boolean
}

export interface UserProfileUpdate {
  name: string
  email: string
  avatarUrl?: string
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}