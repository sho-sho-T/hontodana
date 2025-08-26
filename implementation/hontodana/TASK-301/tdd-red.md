# TASK-301: ユーザープロフィール・設定画面 - Red Phase (失敗テスト実装)

## Red Phase 概要

TDDサイクルの最初のフェーズとして、まず失敗するテストを実装します。このフェーズでは、実装されていない機能に対するテストを作成し、期待通りテストが失敗することを確認します。

## 実装順序

1. 型定義・エラーメッセージ定数
2. Server Actions テスト（失敗）
3. React Components テスト（失敗）
4. テスト実行・失敗確認

---

## Phase 1: 型定義・エラーメッセージ定数

### `/types/profile.ts` - 型定義

```typescript
// Profile関連の型定義

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
```

### `/lib/constants/profile-errors.ts` - エラーメッセージ

```typescript
// プロフィール機能のエラーメッセージ定数

export const PROFILE_ERROR_MESSAGES = {
  // 認証・権限関連
  AUTH_REQUIRED: 'ログインが必要です',
  PROFILE_NOT_FOUND: 'プロフィールが見つかりません',
  
  // バリデーション関連
  NAME_REQUIRED: '表示名は必須です',
  NAME_TOO_LONG: '表示名は50文字以内で入力してください',
  READING_GOAL_INVALID: '読書目標は1-365冊の範囲で設定してください',
  
  // ファイルアップロード関連
  FILE_TOO_LARGE: 'ファイルサイズは2MB以下にしてください',
  INVALID_FILE_TYPE: 'JPEG、PNG、WebP形式のファイルのみアップロード可能です',
  UPLOAD_FAILED: '画像のアップロードに失敗しました',
  DELETE_FAILED: '画像の削除に失敗しました',
  
  // データ保存関連
  SAVE_FAILED: '設定の保存に失敗しました',
  UPDATE_FAILED: 'プロフィールの更新に失敗しました',
  
  // ネットワーク関連
  NETWORK_ERROR: 'ネットワークエラーが発生しました。しばらく経ってからお試しください',
  
  // 汎用エラー
  UNEXPECTED_ERROR: '予期しないエラーが発生しました',
} as const

export type ProfileErrorMessage = typeof PROFILE_ERROR_MESSAGES[keyof typeof PROFILE_ERROR_MESSAGES]
```

---

## Phase 2: Server Actions テスト実装（失敗予定）

### `/lib/server-actions/profile.ts` - Server Actions (テスト用スタブ)

```typescript
'use server'

// スタブ実装（テスト失敗確認用）
// 実際の実装はGreenフェーズで行う

import { ProfileActionResult, UserProfileData, UserProfileUpdateData, UserSettingsUpdateData, ImageUploadResult } from '@/types/profile'

export async function getUserProfile(): Promise<ProfileActionResult<UserProfileData>> {
  // 未実装 - テストは失敗するはず
  throw new Error('Not implemented yet')
}

export async function updateUserProfile(data: UserProfileUpdateData): Promise<ProfileActionResult<UserProfileData>> {
  // 未実装 - テストは失敗するはず
  throw new Error('Not implemented yet')
}

export async function updateUserSettings(data: UserSettingsUpdateData): Promise<ProfileActionResult<UserProfileData>> {
  // 未実装 - テストは失敗するはず
  throw new Error('Not implemented yet')
}

export async function uploadAvatarImage(file: File): Promise<ProfileActionResult<ImageUploadResult>> {
  // 未実装 - テストは失敗するはず
  throw new Error('Not implemented yet')
}

export async function deleteAvatarImage(): Promise<ProfileActionResult<void>> {
  // 未実装 - テストは失敗するはず
  throw new Error('Not implemented yet')
}
```

### `__tests__/lib/server-actions/profile.test.ts` - Server Actions テスト

```typescript
/**
 * プロフィール関連Server Actionsの単体テスト
 * Red Phase: 失敗するテストを実装
 */

import { 
  getUserProfile, 
  updateUserProfile, 
  updateUserSettings,
  uploadAvatarImage,
  deleteAvatarImage 
} from '@/lib/server-actions/profile'
import { PROFILE_ERROR_MESSAGES } from '@/lib/constants/profile-errors'
import { getCurrentUser } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { UserProfileUpdateData, UserSettingsUpdateData } from '@/types/profile'

// モック設定
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    userProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    }
  }
}))
jest.mock('@/lib/supabase/client')

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Profile Server Actions - Red Phase', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // デフォルトで認証済みユーザーを設定
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com'
    })
  })

  describe('getUserProfile', () => {
    test('認証済みユーザーのプロフィール情報を正常に取得できること', async () => {
      // Given: 認証済みユーザーとプロフィールデータ
      const mockProfile = {
        id: 'user-123',
        name: '山田太郎',
        avatarUrl: 'https://example.com/avatar.jpg',
        theme: 'light',
        displayMode: 'grid',
        booksPerPage: 20,
        defaultBookType: 'physical',
        readingGoal: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockProfile as any)
      
      // When: プロフィール取得を実行
      const result = await getUserProfile()
      
      // Then: プロフィール情報が正常に返されること
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockProfile)
      expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' }
      })
    })

    test('未認証ユーザーの場合エラーが返されること', async () => {
      // Given: 未認証状態
      mockGetCurrentUser.mockResolvedValue(null)
      
      // When: プロフィール取得を実行
      const result = await getUserProfile()
      
      // Then: 認証エラーが返されること
      expect(result.success).toBe(false)
      expect(result.error).toBe(PROFILE_ERROR_MESSAGES.AUTH_REQUIRED)
    })

    test('プロフィールが存在しない場合エラーが返されること', async () => {
      // Given: プロフィールが存在しない
      mockPrisma.userProfile.findUnique.mockResolvedValue(null)
      
      // When: プロフィール取得を実行
      const result = await getUserProfile()
      
      // Then: プロフィール未発見エラーが返されること
      expect(result.success).toBe(false)
      expect(result.error).toBe(PROFILE_ERROR_MESSAGES.PROFILE_NOT_FOUND)
    })
  })

  describe('updateUserProfile', () => {
    test('有効なプロフィール情報で更新が成功すること', async () => {
      // Given: 有効な更新データ
      const updateData: UserProfileUpdateData = {
        name: '鈴木花子',
        readingGoal: 100
      }
      
      const updatedProfile = {
        id: 'user-123',
        ...updateData,
        avatarUrl: null,
        theme: 'light',
        displayMode: 'grid',
        booksPerPage: 20,
        defaultBookType: 'physical',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      mockPrisma.userProfile.update.mockResolvedValue(updatedProfile as any)
      
      // When: プロフィール更新を実行
      const result = await updateUserProfile(updateData)
      
      // Then: 更新が成功すること
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('鈴木花子')
      expect(result.data.readingGoal).toBe(100)
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: updateData
      })
    })

    test('表示名が空の場合バリデーションエラーになること', async () => {
      // Given: 無効な更新データ（空の表示名）
      const updateData: UserProfileUpdateData = {
        name: '',
        readingGoal: 50
      }
      
      // When: プロフィール更新を実行
      const result = await updateUserProfile(updateData)
      
      // Then: バリデーションエラーが返されること
      expect(result.success).toBe(false)
      expect(result.error).toBe(PROFILE_ERROR_MESSAGES.NAME_REQUIRED)
    })

    test('表示名が50文字を超える場合バリデーションエラーになること', async () => {
      // Given: 長すぎる表示名
      const updateData: UserProfileUpdateData = {
        name: 'あ'.repeat(51),
        readingGoal: 50
      }
      
      // When: プロフィール更新を実行
      const result = await updateUserProfile(updateData)
      
      // Then: バリデーションエラーが返されること
      expect(result.success).toBe(false)
      expect(result.error).toBe(PROFILE_ERROR_MESSAGES.NAME_TOO_LONG)
    })

    test('読書目標が範囲外の場合バリデーションエラーになること', async () => {
      // Given: 範囲外の読書目標
      const updateData: UserProfileUpdateData = {
        name: '田中次郎',
        readingGoal: 500
      }
      
      // When: プロフィール更新を実行
      const result = await updateUserProfile(updateData)
      
      // Then: バリデーションエラーが返されること
      expect(result.success).toBe(false)
      expect(result.error).toBe(PROFILE_ERROR_MESSAGES.READING_GOAL_INVALID)
    })
  })

  describe('updateUserSettings', () => {
    test('有効な設定データで更新が成功すること', async () => {
      // Given: 有効な設定データ
      const settingsData: UserSettingsUpdateData = {
        theme: 'dark',
        displayMode: 'list',
        booksPerPage: 50,
        defaultBookType: 'kindle'
      }
      
      const updatedProfile = {
        id: 'user-123',
        name: '既存ユーザー',
        avatarUrl: null,
        readingGoal: null,
        ...settingsData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      mockPrisma.userProfile.update.mockResolvedValue(updatedProfile as any)
      
      // When: 設定更新を実行
      const result = await updateUserSettings(settingsData)
      
      // Then: 更新が成功すること
      expect(result.success).toBe(true)
      expect(result.data.theme).toBe('dark')
      expect(result.data.displayMode).toBe('list')
      expect(result.data.booksPerPage).toBe(50)
      expect(result.data.defaultBookType).toBe('kindle')
    })
  })

  describe('uploadAvatarImage', () => {
    test('有効な画像ファイルのアップロードが成功すること', async () => {
      // Given: 有効な画像ファイル
      const mockFile = new File(['fake-image'], 'avatar.jpg', { type: 'image/jpeg' })
      
      // When: 画像アップロードを実行
      const result = await uploadAvatarImage(mockFile)
      
      // Then: アップロードが成功すること
      expect(result.success).toBe(true)
      expect(result.data?.url).toMatch(/^https:\/\//)
    })
    
    test('サイズが大きすぎる画像ファイルでエラーになること', async () => {
      // Given: 大きすぎるファイル（3MB）
      const largeContent = 'x'.repeat(3 * 1024 * 1024)
      const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
      
      // When: 画像アップロードを実行
      const result = await uploadAvatarImage(largeFile)
      
      // Then: サイズエラーが返されること
      expect(result.success).toBe(false)
      expect(result.error).toBe(PROFILE_ERROR_MESSAGES.FILE_TOO_LARGE)
    })
    
    test('無効なファイル形式でエラーになること', async () => {
      // Given: 無効なファイル形式
      const invalidFile = new File(['fake-data'], 'document.pdf', { type: 'application/pdf' })
      
      // When: 画像アップロードを実行
      const result = await uploadAvatarImage(invalidFile)
      
      // Then: 形式エラーが返されること
      expect(result.success).toBe(false)
      expect(result.error).toBe(PROFILE_ERROR_MESSAGES.INVALID_FILE_TYPE)
    })
  })

  describe('deleteAvatarImage', () => {
    test('画像削除が成功すること', async () => {
      // Given: 削除対象の画像が存在する
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: 'user-123',
        avatarUrl: 'https://example.com/avatar.jpg'
      } as any)
      
      // When: 画像削除を実行
      const result = await deleteAvatarImage()
      
      // Then: 削除が成功すること
      expect(result.success).toBe(true)
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { avatarUrl: null }
      })
    })
  })
})
```

---

## Phase 3: React Components テスト実装（失敗予定）

### `/components/profile/index.ts` - コンポーネントエクスポート（スタブ）

```typescript
// プロフィール関連コンポーネントのエクスポート
// Red Phase: スタブ実装

export { default as ProfilePage } from './ProfilePage'
export { default as ProfileForm } from './ProfileForm'
export { default as ThemeSelector } from './ThemeSelector'
export { default as DisplaySettings } from './DisplaySettings'
export { default as AvatarUpload } from './AvatarUpload'

// 型もエクスポート
export type { 
  ProfileFormProps,
  ThemeSelectorProps,
  DisplaySettingsProps,
  AvatarUploadProps
} from '@/types/profile'
```

### `/components/profile/ProfileForm.tsx` - スタブ実装

```typescript
// ProfileForm コンポーネント (スタブ実装)
// テストが失敗することを確認するため

import type { ProfileFormProps } from '@/types/profile'

export default function ProfileForm(props: ProfileFormProps) {
  // スタブ実装 - テストは失敗するはず
  return <div>Profile Form - Not Implemented</div>
}
```

### `__tests__/components/profile/ProfileForm.test.tsx` - コンポーネントテスト

```typescript
/**
 * ProfileForm コンポーネントの単体テスト
 * Red Phase: 失敗するテストを実装
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileForm from '@/components/profile/ProfileForm'
import type { ProfileFormProps } from '@/types/profile'

// テスト用のモックProps
const mockProps: ProfileFormProps = {
  profile: {
    name: '山田太郎',
    avatarUrl: 'https://example.com/avatar.jpg',
    readingGoal: 50
  },
  onSave: jest.fn(),
  loading: false
}

describe('ProfileForm - Red Phase', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('プロフィール情報が正しく表示されること', () => {
    // Given: プロフィールデータ
    // When: コンポーネントをレンダリング
    render(<ProfileForm {...mockProps} />)
    
    // Then: 各フィールドに値が設定されていること
    expect(screen.getByDisplayValue('山田太郎')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50')).toBeInTheDocument()
  })

  test('フォーム入力が正常に動作すること', async () => {
    // Given: 空のフォーム
    const emptyProps = { ...mockProps, profile: {} }
    render(<ProfileForm {...emptyProps} />)
    
    // When: フォームに入力
    const nameInput = screen.getByLabelText('表示名')
    const goalInput = screen.getByLabelText('読書目標')
    
    await userEvent.type(nameInput, '新しい名前')
    await userEvent.type(goalInput, '75')
    
    // Then: 入力値が反映されること
    expect(screen.getByDisplayValue('新しい名前')).toBeInTheDocument()
    expect(screen.getByDisplayValue('75')).toBeInTheDocument()
  })

  test('必須項目が空の場合エラーが表示されること', async () => {
    // Given: プロフィールフォーム
    render(<ProfileForm {...mockProps} />)
    
    // When: 表示名を空にして保存ボタンをクリック
    const nameInput = screen.getByLabelText('表示名')
    const saveButton = screen.getByRole('button', { name: '保存' })
    
    await userEvent.clear(nameInput)
    await userEvent.click(saveButton)
    
    // Then: エラーメッセージが表示されること
    expect(screen.getByText('表示名は必須です')).toBeInTheDocument()
  })

  test('保存ボタンクリック時にonSaveが呼ばれること', async () => {
    // Given: プロフィールフォーム
    const mockOnSave = jest.fn()
    render(<ProfileForm {...mockProps} onSave={mockOnSave} />)
    
    // When: 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: '保存' })
    await userEvent.click(saveButton)
    
    // Then: onSave が正しい値で呼ばれること
    expect(mockOnSave).toHaveBeenCalledWith({
      name: '山田太郎',
      avatarUrl: 'https://example.com/avatar.jpg',
      readingGoal: 50
    })
  })

  test('ローディング状態で保存ボタンが無効になること', () => {
    // Given: ローディング状態
    render(<ProfileForm {...mockProps} loading={true} />)
    
    // When: コンポーネントがレンダリングされる
    const saveButton = screen.getByRole('button', { name: /保存|更新中/ })
    
    // Then: 保存ボタンが無効になっていること
    expect(saveButton).toBeDisabled()
  })

  test('読書目標が範囲外の値でバリデーションエラーが表示されること', async () => {
    // Given: プロフィールフォーム
    render(<ProfileForm {...mockProps} />)
    
    // When: 読書目標に範囲外の値を入力
    const goalInput = screen.getByLabelText('読書目標')
    await userEvent.clear(goalInput)
    await userEvent.type(goalInput, '500')
    
    const saveButton = screen.getByRole('button', { name: '保存' })
    await userEvent.click(saveButton)
    
    // Then: バリデーションエラーが表示されること
    expect(screen.getByText('読書目標は1-365冊の範囲で設定してください')).toBeInTheDocument()
  })
})
```

---

## Phase 4: テスト実行・失敗確認

### テスト実行コマンド

```bash
# 型定義ファイル作成後
npm run test:profile:server-actions
npm run test:profile:components

# すべてのプロフィール関連テスト実行
npm run test:profile
```

### 期待される失敗結果

```
FAIL __tests__/lib/server-actions/profile.test.ts
  Profile Server Actions - Red Phase
    getUserProfile
      ✕ 認証済みユーザーのプロフィール情報を正常に取得できること
        Error: Not implemented yet
      ✕ 未認証ユーザーの場合エラーが返されること  
        Error: Not implemented yet
        
FAIL __tests__/components/profile/ProfileForm.test.tsx
  ProfileForm - Red Phase
    ✕ プロフィール情報が正しく表示されること
      Unable to find an element with the display value: 山田太郎
    ✕ フォーム入力が正常に動作すること
      Unable to find a label with the text of: 表示名

Test Suites: 2 failed, 0 passed
Tests: 12 failed, 0 passed
```

---

## 実装ファイル作成

次に、実際のファイルを作成してテストを実行し、期待通り失敗することを確認します。

### 1. 型定義ファイル作成

```bash
touch types/profile.ts
```

### 2. エラーメッセージファイル作成

```bash
mkdir -p lib/constants
touch lib/constants/profile-errors.ts
```

### 3. Server Actions スタブ作成

```bash
touch lib/server-actions/profile.ts
```

### 4. コンポーネントスタブ作成

```bash
mkdir -p components/profile
touch components/profile/index.ts
touch components/profile/ProfileForm.tsx
```

### 5. テストファイル作成

```bash
mkdir -p __tests__/lib/server-actions
mkdir -p __tests__/components/profile
touch __tests__/lib/server-actions/profile.test.ts
touch __tests__/components/profile/ProfileForm.test.tsx
```

---

## Red Phase 完了条件

✅ **完了チェックリスト**:

- [x] 型定義ファイル (`types/profile.ts`) 作成
- [x] エラーメッセージ定数 (`lib/constants/profile-errors.ts`) 作成
- [x] Server Actions スタブ (`lib/server-actions/profile.ts`) 作成
- [x] React コンポーネントスタブ作成
- [x] 包括的なテストケース実装
- [ ] テスト実行・失敗確認
- [ ] 失敗理由の文書化

## 次のフェーズ

Red Phase完了後、Green Phase（最小実装）に進みます。

---

**作成日**: 2025-08-25  
**フェーズ**: Red (失敗テスト実装)  
**ステータス**: 実装完了、テスト実行待ち