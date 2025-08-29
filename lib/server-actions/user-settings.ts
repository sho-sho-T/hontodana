/**
 * ユーザー設定のServer Actions
 * TASK-301 - ユーザープロフィール・設定画面
 * Green Phase: テストを通すための最小実装
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { UserPreferences, UserProfileUpdate, ActionResult } from '@/types/profile'

export async function getUserSettings(): Promise<ActionResult<UserPreferences>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: '認証が必要です' }
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Settings fetch error:', error)
      return { success: false, error: '設定の取得に失敗しました' }
    }

    // データが存在しない場合はデフォルト値を返す
    if (!data) {
      const defaultSettings: UserPreferences = {
        theme: 'light',
        displayMode: 'grid',
        booksPerPage: 20,
        defaultBookType: 'physical',
        readingGoal: 50
      }
      return {
        success: true,
        data: defaultSettings
      }
    }

    return {
      success: true,
      data: {
        theme: data.theme || 'light',
        displayMode: data.display_mode || 'grid',
        booksPerPage: data.books_per_page || 20,
        defaultBookType: data.default_book_type || 'physical',
        readingGoal: data.reading_goal
      }
    }
  } catch (error) {
    console.error('Unexpected error during settings fetch:', error)
    
    // エラーの場合もデフォルト値を返す（フォールバック）
    const defaultSettings: UserPreferences = {
      theme: 'light',
      displayMode: 'grid',
      booksPerPage: 20,
      defaultBookType: 'physical',
      readingGoal: 50
    }
    
    return {
      success: true,
      data: defaultSettings,
      error: 'デフォルト設定を使用しています'
    }
  }
}

export async function updateUserSettings(settings: UserPreferences): Promise<ActionResult<UserPreferences>> {
  const startTime = Date.now()
  
  try {
    // バリデーション
    const validationResult = validateUserSettings(settings)
    if (!validationResult.isValid) {
      return { success: false, error: validationResult.error }
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: '認証が必要です' }
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        theme: settings.theme,
        display_mode: settings.displayMode,
        books_per_page: settings.booksPerPage,
        default_book_type: settings.defaultBookType,
        reading_goal: settings.readingGoal,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Settings update error:', error)
      return { success: false, error: '設定の更新に失敗しました。しばらく待ってから再度お試しください。' }
    }

    // パフォーマンス要件チェック（1秒以内）
    const endTime = Date.now()
    if (endTime - startTime > 1000) {
      console.warn(`Settings update took ${endTime - startTime}ms, exceeding 1000ms requirement`)
    }

    return { success: true, data: settings }
  } catch (error) {
    console.error('Unexpected error during settings update:', error)
    return { success: false, error: '予期しないエラーが発生しました。しばらく待ってから再度お試しください。' }
  }
}

function validateUserSettings(settings: UserPreferences): { isValid: boolean; error?: string } {
  if (!['light', 'dark', 'system'].includes(settings.theme)) {
    return { isValid: false, error: 'テーマ設定が無効です' }
  }

  if (!['grid', 'list'].includes(settings.displayMode)) {
    return { isValid: false, error: '表示モード設定が無効です' }
  }

  if (!Number.isInteger(settings.booksPerPage) || settings.booksPerPage < 10 || settings.booksPerPage > 100) {
    return { isValid: false, error: '表示件数は10件以上100件以下で設定してください' }
  }

  if (!['physical', 'ebook'].includes(settings.defaultBookType)) {
    return { isValid: false, error: 'デフォルト書籍タイプが無効です' }
  }

  if (settings.readingGoal !== undefined) {
    if (!Number.isInteger(settings.readingGoal) || settings.readingGoal < 1 || settings.readingGoal > 1000) {
      return { isValid: false, error: '読書目標は1冊以上1000冊以下で設定してください' }
    }
  }

  return { isValid: true }
}

export async function updateUserProfile(profile: UserProfileUpdate): Promise<ActionResult<any>> {
  try {
    // バリデーション
    if (!profile.name || profile.name.length < 1 || profile.name.length > 50) {
      return { success: false, error: 'ユーザー名は1文字以上50文字以下で入力してください' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(profile.email)) {
      return { success: false, error: '有効なメールアドレスを入力してください' }
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: '認証が必要です' }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: profile.name,
        avatar_url: profile.avatarUrl
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return { success: false, error: 'プロフィールの更新に失敗しました' }
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        email: profile.email,
        avatarUrl: data.avatar_url
      }
    }
  } catch {
    return { success: false, error: 'プロフィールの更新に失敗しました' }
  }
}