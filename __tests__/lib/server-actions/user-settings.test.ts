/**
 * ユーザー設定のServer Actions テスト
 * Red Phase: 失敗するテストを実装
 * TASK-301 - ユーザープロフィール・設定画面
 */

import { 
  updateUserSettings, 
  getUserSettings,
  updateUserProfile 
} from '@/lib/server-actions/user-settings'
import type { UserPreferences, UserProfileUpdate } from '@/types/profile'
import { createClient } from '@/lib/supabase/server'

// Supabaseクライアントのモック
jest.mock('@/lib/supabase/server')
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn()
}

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
mockCreateClient.mockReturnValue(mockSupabaseClient as any)

describe('ユーザー設定 Server Actions - Red Phase', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserSettings', () => {
    test('認証済みユーザーの設定を正常に取得できること', async () => {
      // Given: 認証済みユーザー
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null
      })
      
      const mockSettings = {
        theme: 'light',
        display_mode: 'grid',
        books_per_page: 20,
        default_book_type: 'physical',
        reading_goal: 50
      }
      
      mockSupabaseClient.single.mockResolvedValue({
        data: mockSettings,
        error: null
      })

      // When: 設定を取得
      const result = await getUserSettings()

      // Then: 正常に設定が取得されること
      expect(result).toEqual({
        success: true,
        data: {
          theme: 'light',
          displayMode: 'grid',
          booksPerPage: 20,
          defaultBookType: 'physical',
          readingGoal: 50
        }
      })
    })

    test('未認証ユーザーの場合エラーが返されること', async () => {
      // Given: 未認証ユーザー
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      // When: 設定を取得
      const result = await getUserSettings()

      // Then: 認証エラーが返されること
      expect(result).toEqual({
        success: false,
        error: '認証が必要です'
      })
    })

    test('データベースエラーの場合適切なエラーが返されること', async () => {
      // Given: データベースエラー
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      // When: 設定を取得
      const result = await getUserSettings()

      // Then: データベースエラーが返されること
      expect(result).toEqual({
        success: false,
        error: '設定の取得に失敗しました'
      })
    })
  })

  describe('updateUserSettings', () => {
    const validSettings: UserPreferences = {
      theme: 'dark',
      displayMode: 'list',
      booksPerPage: 30,
      defaultBookType: 'ebook',
      readingGoal: 75
    }

    test('有効な設定で正常に更新できること', async () => {
      // Given: 認証済みユーザーと有効な設定
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          theme: 'dark',
          display_mode: 'list',
          books_per_page: 30,
          default_book_type: 'ebook',
          reading_goal: 75
        },
        error: null
      })

      // When: 設定を更新
      const result = await updateUserSettings(validSettings)

      // Then: 正常に更新されること
      expect(result).toEqual({
        success: true,
        data: validSettings
      })
      
      expect(mockSupabaseClient.upsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        theme: 'dark',
        display_mode: 'list',
        books_per_page: 30,
        default_book_type: 'ebook',
        reading_goal: 75
      })
    })

    test('無効なテーマでバリデーションエラーが返されること', async () => {
      // Given: 無効なテーマ設定
      const invalidSettings = {
        ...validSettings,
        theme: 'invalid-theme' as any
      }

      // When: 設定を更新
      const result = await updateUserSettings(invalidSettings)

      // Then: バリデーションエラーが返されること
      expect(result).toEqual({
        success: false,
        error: 'テーマ設定が無効です'
      })
    })

    test('表示件数が範囲外でバリデーションエラーが返されること', async () => {
      // Given: 範囲外の表示件数
      const invalidSettings = {
        ...validSettings,
        booksPerPage: 5
      }

      // When: 設定を更新
      const result = await updateUserSettings(invalidSettings)

      // Then: バリデーションエラーが返されること
      expect(result).toEqual({
        success: false,
        error: '表示件数は10件以上100件以下で設定してください'
      })
    })

    test('読書目標が範囲外でバリデーションエラーが返されること', async () => {
      // Given: 範囲外の読書目標
      const invalidSettings = {
        ...validSettings,
        readingGoal: 1001
      }

      // When: 設定を更新
      const result = await updateUserSettings(invalidSettings)

      // Then: バリデーションエラーが返されること
      expect(result).toEqual({
        success: false,
        error: '読書目標は1冊以上1000冊以下で設定してください'
      })
    })

    test('未認証ユーザーでエラーが返されること', async () => {
      // Given: 未認証ユーザー
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      // When: 設定を更新
      const result = await updateUserSettings(validSettings)

      // Then: 認証エラーが返されること
      expect(result).toEqual({
        success: false,
        error: '認証が必要です'
      })
    })
  })

  describe('updateUserProfile', () => {
    const validProfile: UserProfileUpdate = {
      name: '新しい表示名',
      email: 'newemail@example.com'
    }

    test('有効なプロフィール情報で正常に更新できること', async () => {
      // Given: 認証済みユーザーと有効なプロフィール
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          id: 'user-123',
          name: '新しい表示名',
          email: 'newemail@example.com',
          avatar_url: null
        },
        error: null
      })

      // When: プロフィールを更新
      const result = await updateUserProfile(validProfile)

      // Then: 正常に更新されること
      expect(result).toEqual({
        success: true,
        data: {
          id: 'user-123',
          name: '新しい表示名',
          email: 'newemail@example.com',
          avatarUrl: null
        }
      })
    })

    test('無効なメールアドレスでバリデーションエラーが返されること', async () => {
      // Given: 無効なメールアドレス
      const invalidProfile = {
        ...validProfile,
        email: 'invalid-email'
      }

      // When: プロフィールを更新
      const result = await updateUserProfile(invalidProfile)

      // Then: バリデーションエラーが返されること
      expect(result).toEqual({
        success: false,
        error: '有効なメールアドレスを入力してください'
      })
    })

    test('空のユーザー名でバリデーションエラーが返されること', async () => {
      // Given: 空のユーザー名
      const invalidProfile = {
        ...validProfile,
        name: ''
      }

      // When: プロフィールを更新
      const result = await updateUserProfile(invalidProfile)

      // Then: バリデーションエラーが返されること
      expect(result).toEqual({
        success: false,
        error: 'ユーザー名は1文字以上50文字以下で入力してください'
      })
    })

    test('長すぎるユーザー名でバリデーションエラーが返されること', async () => {
      // Given: 長すぎるユーザー名
      const invalidProfile = {
        ...validProfile,
        name: 'a'.repeat(51)
      }

      // When: プロフィールを更新
      const result = await updateUserProfile(invalidProfile)

      // Then: バリデーションエラーが返されること
      expect(result).toEqual({
        success: false,
        error: 'ユーザー名は1文字以上50文字以下で入力してください'
      })
    })

    test('データベース更新エラーが適切に処理されること', async () => {
      // Given: データベースエラー
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      })

      // When: プロフィールを更新
      const result = await updateUserProfile(validProfile)

      // Then: データベースエラーが返されること
      expect(result).toEqual({
        success: false,
        error: 'プロフィールの更新に失敗しました'
      })
    })
  })

  describe('レスポンス時間テスト', () => {
    test('設定更新処理が1秒以内に完了すること', async () => {
      // Given: 正常な設定データ
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      
      mockSupabaseClient.single.mockResolvedValue({
        data: {},
        error: null
      })

      // When: 設定更新処理を実行
      const startTime = Date.now()
      await updateUserSettings({
        theme: 'light',
        displayMode: 'grid',
        booksPerPage: 20,
        defaultBookType: 'physical',
        readingGoal: 50
      })
      const endTime = Date.now()

      // Then: 1秒以内に完了すること
      expect(endTime - startTime).toBeLessThan(1000)
    })

    test('プロフィール取得処理が2秒以内に完了すること', async () => {
      // Given: 認証済みユーザー
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })
      
      mockSupabaseClient.single.mockResolvedValue({
        data: {},
        error: null
      })

      // When: 設定取得処理を実行
      const startTime = Date.now()
      await getUserSettings()
      const endTime = Date.now()

      // Then: 2秒以内に完了すること
      expect(endTime - startTime).toBeLessThan(2000)
    })
  })
})