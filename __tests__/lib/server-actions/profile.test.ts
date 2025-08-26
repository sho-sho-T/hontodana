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