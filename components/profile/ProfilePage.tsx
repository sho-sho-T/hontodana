'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { User, Settings, Palette, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface Message {
  type: 'success' | 'error' | 'info'
  title: string
  text: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    // 5秒後にメッセージを自動で消去
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const result = await getUserProfile()
      if (result.success && result.data) {
        setProfile(result.data)
      } else {
        showMessage('error', 'エラー', result.error || 'プロフィールの読み込みに失敗しました')
      }
    } catch {
      showMessage('error', '予期しないエラー', 'システムエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: Message['type'], title: string, text: string) => {
    setMessage({ type, title, text })
  }

  const handleProfileSave = async (data: UserProfileUpdateData) => {
    setSaving(true)
    try {
      const result = await updateUserProfile(data)
      if (result.success && result.data) {
        setProfile(result.data)
        showMessage('success', '保存完了', 'プロフィールを更新しました')
      } else {
        showMessage('error', '更新エラー', result.error || '更新に失敗しました')
      }
    } catch {
      showMessage('error', '予期しないエラー', 'システムエラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  const handleSettingsSave = async (data: UserSettingsUpdateData) => {
    try {
      const result = await updateUserSettings(data)
      if (result.success && result.data) {
        setProfile(result.data)
        showMessage('success', '設定更新', '表示設定を更新しました')
      } else {
        showMessage('error', '更新エラー', result.error || '設定の更新に失敗しました')
      }
    } catch {
      showMessage('error', '予期しないエラー', 'システムエラーが発生しました')
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
        showMessage('success', 'アップロード完了', '画像をアップロードしました')
      } else {
        showMessage('error', 'アップロードエラー', result.error || 'アップロードに失敗しました')
      }
    } catch {
      showMessage('error', '予期しないエラー', 'システムエラーが発生しました')
    }
  }

  const handleAvatarDelete = async () => {
    try {
      const result = await deleteAvatarImage()
      if (result.success) {
        await loadProfile() // プロフィールを再読み込み
        showMessage('success', '削除完了', '画像を削除しました')
      } else {
        showMessage('error', '削除エラー', result.error || '削除に失敗しました')
      }
    } catch {
      showMessage('error', '予期しないエラー', 'システムエラーが発生しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">プロフィールを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  プロフィールが見つかりません
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  プロフィールの読み込みに失敗しました
                </p>
              </div>
              <Button onClick={loadProfile} variant="outline">
                再試行
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">プロフィール設定</h1>
              <p className="text-sm text-gray-600 mt-1">
                アカウント情報と表示設定を管理します
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* メッセージ表示 */}
          {message && (
            <Card className={`border-l-4 ${
              message.type === 'success' 
                ? 'border-l-green-500 bg-green-50' 
                : message.type === 'error'
                ? 'border-l-red-500 bg-red-50'
                : 'border-l-blue-500 bg-blue-50'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-3">
                  {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {message.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                  {message.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600" />}
                  <div>
                    <h3 className={`font-medium ${
                      message.type === 'success' ? 'text-green-800' :
                      message.type === 'error' ? 'text-red-800' : 'text-blue-800'
                    }`}>
                      {message.title}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      message.type === 'success' ? 'text-green-700' :
                      message.type === 'error' ? 'text-red-700' : 'text-blue-700'
                    }`}>
                      {message.text}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMessage(null)}
                    className="ml-auto"
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>基本情報</span>
                </CardTitle>
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
            <AvatarUpload
              currentUrl={profile.avatarUrl}
              onUpload={handleAvatarUpload}
              onDelete={handleAvatarDelete}
            />

            {/* テーマ設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-blue-600" />
                  <span>外観設定</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ThemeSelector
                  currentTheme={profile.theme}
                  onChange={handleThemeChange}
                />
              </CardContent>
            </Card>

            {/* 表示設定 */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <span>表示設定</span>
                  </CardTitle>
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
    </div>
  )
}