# TASK-301: ユーザープロフィール・設定画面 - Green Phase (最小実装)

## Green Phase 概要

RedフェーズでテストがC失敗することを確認後、最小限の実装でテストを通すフェーズです。過度な実装は避け、テストが通る必要最小限のコードを書きます。

## 実装順序

1. Server Actions の実装
2. React Components の実装  
3. ページコンポーネントの実装
4. テスト実行・成功確認

---

## Phase 1: Server Actions 実装

### `/lib/server-actions/profile.ts` - 最小実装

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/supabase/server'
import { PROFILE_ERROR_MESSAGES } from '@/lib/constants/profile-errors'
import type { 
  ProfileActionResult, 
  UserProfileData, 
  UserProfileUpdateData, 
  UserSettingsUpdateData, 
  ImageUploadResult 
} from '@/types/profile'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// バリデーションスキーマ
const profileUpdateSchema = z.object({
  name: z.string().min(1, PROFILE_ERROR_MESSAGES.NAME_REQUIRED).max(50, PROFILE_ERROR_MESSAGES.NAME_TOO_LONG),
  avatarUrl: z.string().url().optional().nullable(),
  readingGoal: z.number().min(1).max(365).optional().nullable(),
})

const settingsUpdateSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  displayMode: z.enum(['grid', 'list']),
  booksPerPage: z.enum([10, 20, 50, 100]),
  defaultBookType: z.enum(['physical', 'kindle', 'epub', 'audiobook', 'other']),
})

const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const maxFileSize = 2 * 1024 * 1024 // 2MB

/**
 * 現在のユーザープロフィールを取得
 */
export async function getUserProfile(): Promise<ProfileActionResult<UserProfileData>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: PROFILE_ERROR_MESSAGES.AUTH_REQUIRED,
      }
    }

    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id }
    })

    if (!profile) {
      return {
        success: false,
        error: PROFILE_ERROR_MESSAGES.PROFILE_NOT_FOUND,
      }
    }

    return {
      success: true,
      data: {
        id: profile.id,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        theme: profile.theme as 'light' | 'dark' | 'system',
        displayMode: profile.displayMode as 'grid' | 'list',
        booksPerPage: profile.booksPerPage as 10 | 20 | 50 | 100,
        defaultBookType: profile.defaultBookType,
        readingGoal: profile.readingGoal,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    }
  } catch (error) {
    console.error('Failed to get user profile:', error)
    return {
      success: false,
      error: PROFILE_ERROR_MESSAGES.UNEXPECTED_ERROR,
    }
  }
}

/**
 * ユーザープロフィールを更新
 */
export async function updateUserProfile(data: UserProfileUpdateData): Promise<ProfileActionResult<UserProfileData>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: PROFILE_ERROR_MESSAGES.AUTH_REQUIRED,
      }
    }

    // バリデーション
    const validation = profileUpdateSchema.safeParse(data)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    // 読書目標の範囲チェック
    if (data.readingGoal !== null && data.readingGoal !== undefined) {
      if (data.readingGoal < 1 || data.readingGoal > 365) {
        return {
          success: false,
          error: PROFILE_ERROR_MESSAGES.READING_GOAL_INVALID,
        }
      }
    }

    const updatedProfile = await prisma.userProfile.update({
      where: { id: user.id },
      data: {
        name: data.name,
        avatarUrl: data.avatarUrl,
        readingGoal: data.readingGoal,
      },
    })

    return {
      success: true,
      data: {
        id: updatedProfile.id,
        name: updatedProfile.name,
        avatarUrl: updatedProfile.avatarUrl,
        theme: updatedProfile.theme as 'light' | 'dark' | 'system',
        displayMode: updatedProfile.displayMode as 'grid' | 'list',
        booksPerPage: updatedProfile.booksPerPage as 10 | 20 | 50 | 100,
        defaultBookType: updatedProfile.defaultBookType,
        readingGoal: updatedProfile.readingGoal,
        createdAt: updatedProfile.createdAt,
        updatedAt: updatedProfile.updatedAt,
      },
    }
  } catch (error) {
    console.error('Failed to update user profile:', error)
    return {
      success: false,
      error: PROFILE_ERROR_MESSAGES.UPDATE_FAILED,
    }
  }
}

/**
 * ユーザー設定を更新
 */
export async function updateUserSettings(data: UserSettingsUpdateData): Promise<ProfileActionResult<UserProfileData>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: PROFILE_ERROR_MESSAGES.AUTH_REQUIRED,
      }
    }

    // バリデーション
    const validation = settingsUpdateSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: PROFILE_ERROR_MESSAGES.SAVE_FAILED,
      }
    }

    const updatedProfile = await prisma.userProfile.update({
      where: { id: user.id },
      data: {
        theme: data.theme,
        displayMode: data.displayMode,
        booksPerPage: data.booksPerPage,
        defaultBookType: data.defaultBookType,
      },
    })

    return {
      success: true,
      data: {
        id: updatedProfile.id,
        name: updatedProfile.name,
        avatarUrl: updatedProfile.avatarUrl,
        theme: updatedProfile.theme as 'light' | 'dark' | 'system',
        displayMode: updatedProfile.displayMode as 'grid' | 'list',
        booksPerPage: updatedProfile.booksPerPage as 10 | 20 | 50 | 100,
        defaultBookType: updatedProfile.defaultBookType,
        readingGoal: updatedProfile.readingGoal,
        createdAt: updatedProfile.createdAt,
        updatedAt: updatedProfile.updatedAt,
      },
    }
  } catch (error) {
    console.error('Failed to update user settings:', error)
    return {
      success: false,
      error: PROFILE_ERROR_MESSAGES.SAVE_FAILED,
    }
  }
}

/**
 * アバター画像をアップロード
 */
export async function uploadAvatarImage(file: File): Promise<ProfileActionResult<ImageUploadResult>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: PROFILE_ERROR_MESSAGES.AUTH_REQUIRED,
      }
    }

    // ファイルサイズチェック
    if (file.size > maxFileSize) {
      return {
        success: false,
        error: PROFILE_ERROR_MESSAGES.FILE_TOO_LARGE,
      }
    }

    // ファイル形式チェック
    if (!allowedImageTypes.includes(file.type)) {
      return {
        success: false,
        error: PROFILE_ERROR_MESSAGES.INVALID_FILE_TYPE,
      }
    }

    const supabase = await createClient()
    
    // ファイル名生成（ユニーク）
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`
    
    // Supabase Storageにアップロード
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return {
        success: false,
        error: PROFILE_ERROR_MESSAGES.UPLOAD_FAILED,
      }
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // プロフィールのavatarUrlを更新
    await prisma.userProfile.update({
      where: { id: user.id },
      data: { avatarUrl: publicUrl },
    })

    return {
      success: true,
      data: {
        success: true,
        url: publicUrl,
      },
    }
  } catch (error) {
    console.error('Failed to upload avatar image:', error)
    return {
      success: false,
      error: PROFILE_ERROR_MESSAGES.UPLOAD_FAILED,
    }
  }
}

/**
 * アバター画像を削除
 */
export async function deleteAvatarImage(): Promise<ProfileActionResult<void>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: PROFILE_ERROR_MESSAGES.AUTH_REQUIRED,
      }
    }

    // プロフィールのavatarUrlをnullに更新
    await prisma.userProfile.update({
      where: { id: user.id },
      data: { avatarUrl: null },
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('Failed to delete avatar image:', error)
    return {
      success: false,
      error: PROFILE_ERROR_MESSAGES.DELETE_FAILED,
    }
  }
}
```

---

## Phase 2: React Components 実装

### `/components/profile/ProfileForm.tsx` - 最小実装

```typescript
'use client'

import React, { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProfileFormProps } from '@/types/profile'
import { PROFILE_ERROR_MESSAGES } from '@/lib/constants/profile-errors'

export default function ProfileForm({
  profile,
  onSave,
  loading = false,
  className,
}: ProfileFormProps) {
  const [name, setName] = useState(profile.name || '')
  const [readingGoal, setReadingGoal] = useState(profile.readingGoal?.toString() || '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const isLoading = loading || isPending

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = PROFILE_ERROR_MESSAGES.NAME_REQUIRED
    } else if (name.length > 50) {
      newErrors.name = PROFILE_ERROR_MESSAGES.NAME_TOO_LONG
    }

    if (readingGoal) {
      const goal = parseInt(readingGoal, 10)
      if (isNaN(goal) || goal < 1 || goal > 365) {
        newErrors.readingGoal = PROFILE_ERROR_MESSAGES.READING_GOAL_INVALID
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const data = {
      name: name.trim(),
      avatarUrl: profile.avatarUrl,
      readingGoal: readingGoal ? parseInt(readingGoal, 10) : null,
    }

    startTransition(async () => {
      await onSave(data)
    })
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">表示名</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="表示名を入力"
            disabled={isLoading}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="readingGoal">読書目標</Label>
          <Input
            id="readingGoal"
            type="number"
            value={readingGoal}
            onChange={(e) => setReadingGoal(e.target.value)}
            placeholder="年間の読書目標（冊数）"
            min="1"
            max="365"
            disabled={isLoading}
            className={errors.readingGoal ? 'border-red-500' : ''}
          />
          {errors.readingGoal && (
            <p className="mt-1 text-sm text-red-600">{errors.readingGoal}</p>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? '更新中...' : '保存'}
      </Button>
    </form>
  )
}
```

### `/components/profile/ThemeSelector.tsx` - 最小実装

```typescript
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ThemeSelectorProps, Theme } from '@/types/profile'

const themeOptions: { value: Theme; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: '明るいテーマ' },
  { value: 'dark', label: 'Dark', description: '暗いテーマ' },
  { value: 'system', label: 'System', description: 'システム設定に従う' },
]

export default function ThemeSelector({
  currentTheme,
  onChange,
  className,
}: ThemeSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium">テーマ設定</h3>
      <div className="flex gap-2 flex-wrap">
        {themeOptions.map((option) => (
          <Button
            key={option.value}
            variant={currentTheme === option.value ? 'default' : 'outline'}
            onClick={() => onChange(option.value)}
            className={cn(
              'text-sm',
              currentTheme === option.value && 'bg-blue-500 text-white'
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <p className="text-xs text-gray-600">
        現在: {themeOptions.find(opt => opt.value === currentTheme)?.description}
      </p>
    </div>
  )
}
```

### `/components/profile/DisplaySettings.tsx` - 最小実装

```typescript
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { DisplaySettingsProps, DisplayMode, BooksPerPage } from '@/types/profile'

const displayModeOptions: { value: DisplayMode; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
]

const booksPerPageOptions: { value: BooksPerPage; label: string }[] = [
  { value: 10, label: '10冊' },
  { value: 20, label: '20冊' },
  { value: 50, label: '50冊' },
  { value: 100, label: '100冊' },
]

const bookTypeOptions = [
  { value: 'physical', label: '紙の本' },
  { value: 'kindle', label: 'Kindle' },
  { value: 'epub', label: 'EPUB' },
  { value: 'audiobook', label: 'オーディオブック' },
  { value: 'other', label: 'その他' },
] as const

export default function DisplaySettings({
  settings,
  onChange,
  className,
}: DisplaySettingsProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 表示モード */}
      <div className="space-y-3">
        <Label>表示モード</Label>
        <div className="flex gap-2">
          {displayModeOptions.map((option) => (
            <Button
              key={option.value}
              variant={settings.displayMode === option.value ? 'default' : 'outline'}
              onClick={() => onChange({ ...settings, displayMode: option.value })}
              className="text-sm"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 1ページあたりの表示数 */}
      <div className="space-y-3">
        <Label htmlFor="booksPerPage">1ページあたりの表示数</Label>
        <select
          id="booksPerPage"
          value={settings.booksPerPage}
          onChange={(e) => onChange({ 
            ...settings, 
            booksPerPage: parseInt(e.target.value) as BooksPerPage 
          })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {booksPerPageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* デフォルト書籍種類 */}
      <div className="space-y-3">
        <Label htmlFor="defaultBookType">デフォルト書籍種類</Label>
        <select
          id="defaultBookType"
          value={settings.defaultBookType}
          onChange={(e) => onChange({ 
            ...settings, 
            defaultBookType: e.target.value as typeof settings.defaultBookType
          })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {bookTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
```

### `/components/profile/AvatarUpload.tsx` - 最小実装

```typescript
'use client'

import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { AvatarUploadProps } from '@/types/profile'

export default function AvatarUpload({
  currentUrl,
  onUpload,
  onDelete,
  loading = false,
  className,
}: AvatarUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)
    }
  }

  const handleUpload = async () => {
    if (selectedFile && onUpload) {
      await onUpload(selectedFile)
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete()
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-3">
        <h3 className="text-sm font-medium">アバター画像</h3>
        
        {/* 現在の画像表示 */}
        {currentUrl && !previewUrl && (
          <div className="flex items-center space-x-4">
            <img
              src={currentUrl}
              alt="現在のアバター"
              className="w-16 h-16 rounded-full object-cover border"
            />
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
                className="text-red-600 hover:text-red-700"
              >
                画像を削除
              </Button>
            )}
          </div>
        )}

        {/* プレビュー表示 */}
        {previewUrl && (
          <div className="flex items-center space-x-4">
            <img
              src={previewUrl}
              alt="選択された画像"
              className="w-16 h-16 rounded-full object-cover border"
            />
            <div className="space-x-2">
              <Button
                onClick={handleUpload}
                disabled={loading}
                size="sm"
              >
                アップロード
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFile(null)
                  setPreviewUrl(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                size="sm"
              >
                キャンセル
              </Button>
            </div>
          </div>
        )}

        {/* ファイル選択 */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-file-input"
            aria-label="アバター画像を選択"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            type="button"
          >
            画像を選択
          </Button>
        </div>
        
        <p className="text-xs text-gray-500">
          JPEG、PNG、WebP形式、2MB以下
        </p>
      </div>
    </div>
  )
}
```

---

## Phase 3: メインページコンポーネント

### `/app/profile/page.tsx` - メインプロフィールページ

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfilePage } from '@/components/profile'

export default async function ProfilePageRoute() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth/login')
  }

  return <ProfilePage />
}
```

### `/components/profile/ProfilePage.tsx` - メインコンポーネント

```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import ProfileForm from './ProfileForm'
import ThemeSelector from './ThemeSelector'
import DisplaySettings from './DisplaySettings'
import AvatarUpload from './AvatarUpload'
import { 
  getUserProfile, 
  updateUserProfile, 
  updateUserSettings,
  uploadAvatarImage,
  deleteAvatarImage 
} from '@/lib/server-actions/profile'
import type { 
  UserProfileData, 
  UserProfileUpdateData, 
  UserSettingsUpdateData,
  Theme 
} from '@/types/profile'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const result = await getUserProfile()
      if (result.success && result.data) {
        setProfile(result.data)
      } else {
        setMessage({ type: 'error', text: result.error || 'プロフィールの読み込みに失敗しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '予期しないエラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = async (data: UserProfileUpdateData) => {
    setSaving(true)
    try {
      const result = await updateUserProfile(data)
      if (result.success && result.data) {
        setProfile(result.data)
        setMessage({ type: 'success', text: 'プロフィールを更新しました' })
      } else {
        setMessage({ type: 'error', text: result.error || '更新に失敗しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '予期しないエラーが発生しました' })
    } finally {
      setSaving(false)
    }
  }

  const handleSettingsSave = async (data: UserSettingsUpdateData) => {
    try {
      const result = await updateUserSettings(data)
      if (result.success && result.data) {
        setProfile(result.data)
        setMessage({ type: 'success', text: '設定を更新しました' })
      } else {
        setMessage({ type: 'error', text: result.error || '更新に失敗しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '予期しないエラーが発生しました' })
    }
  }

  const handleThemeChange = (theme: Theme) => {
    if (profile) {
      const newSettings: UserSettingsUpdateData = {
        theme,
        displayMode: profile.displayMode,
        booksPerPage: profile.booksPerPage,
        defaultBookType: profile.defaultBookType,
      }
      handleSettingsSave(newSettings)
    }
  }

  const handleDisplaySettingsChange = (settings: UserSettingsUpdateData) => {
    handleSettingsSave(settings)
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      const result = await uploadAvatarImage(file)
      if (result.success) {
        await loadProfile() // プロフィールを再読み込み
        setMessage({ type: 'success', text: '画像をアップロードしました' })
      } else {
        setMessage({ type: 'error', text: result.error || 'アップロードに失敗しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '予期しないエラーが発生しました' })
    }
  }

  const handleAvatarDelete = async () => {
    try {
      const result = await deleteAvatarImage()
      if (result.success) {
        await loadProfile() // プロフィールを再読み込み
        setMessage({ type: 'success', text: '画像を削除しました' })
      } else {
        setMessage({ type: 'error', text: result.error || '削除に失敗しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '予期しないエラーが発生しました' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">プロフィールの読み込みに失敗しました</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">プロフィール設定</h1>
            <p className="mt-2 text-gray-600">
              アカウント情報と表示設定を管理します
            </p>
          </div>

          {/* メッセージ表示 */}
          {message && (
            <div className={`p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* プロフィール情報 */}
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileForm
                  profile={profile}
                  onSave={handleProfileSave}
                  loading={saving}
                />
              </CardContent>
            </Card>

            {/* アバター画像 */}
            <Card>
              <CardHeader>
                <CardTitle>プロフィール画像</CardTitle>
              </CardHeader>
              <CardContent>
                <AvatarUpload
                  currentUrl={profile.avatarUrl}
                  onUpload={handleAvatarUpload}
                  onDelete={handleAvatarDelete}
                />
              </CardContent>
            </Card>

            {/* テーマ設定 */}
            <Card>
              <CardHeader>
                <CardTitle>テーマ設定</CardTitle>
              </CardHeader>
              <CardContent>
                <ThemeSelector
                  currentTheme={profile.theme}
                  onChange={handleThemeChange}
                />
              </CardContent>
            </Card>

            {/* 表示設定 */}
            <Card>
              <CardHeader>
                <CardTitle>表示設定</CardTitle>
              </CardHeader>
              <CardContent>
                <DisplaySettings
                  settings={{
                    theme: profile.theme,
                    displayMode: profile.displayMode,
                    booksPerPage: profile.booksPerPage,
                    defaultBookType: profile.defaultBookType,
                  }}
                  onChange={handleDisplaySettingsChange}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 4: テスト実行・成功確認

### テスト実行コマンド

```bash
# コンポーネントテスト実行
npm test -- __tests__/components/profile/ProfileForm.test.tsx

# 全プロフィール関連テスト実行（ESModuleエラー解決後）
npm run test:profile
```

### 期待される成功結果

```
PASS __tests__/components/profile/ProfileForm.test.tsx
  ProfileForm - Red Phase
    ✓ プロフィール情報が正しく表示されること
    ✓ フォーム入力が正常に動作すること
    ✓ 必須項目が空の場合エラーが表示されること
    ✓ 保存ボタンクリック時にonSaveが呼ばれること
    ✓ ローディング状態で保存ボタンが無効になること
    ✓ 読書目標が範囲外の値でバリデーションエラーが表示されること

Test Suites: 1 passed, 1 total
Tests: 6 passed, 6 total
```

---

## Green Phase 完了条件

✅ **完了チェックリスト**:

- [x] Server Actions の最小実装完了
- [x] React Components の最小実装完了  
- [x] メインページコンポーネント実装
- [ ] テスト実行・成功確認
- [ ] 基本機能の動作確認

## 次のフェーズ

Green Phase完了後、Refactoring Phase（リファクタリング）に進みます。

---

**作成日**: 2025-08-25  
**フェーズ**: Green (最小実装)  
**ステータス**: 実装完了、テスト実行待ち