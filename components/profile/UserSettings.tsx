/**
 * ユーザー設定コンポーネント
 * TASK-301 - ユーザープロフィール・設定画面
 * Refactor Phase: コード品質向上とUI/UX改善
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2, Save, Palette, Monitor, BookOpen } from 'lucide-react'
import type { UserSettingsProps } from '@/types/profile'

export default function UserSettings({ settings, onSave, loading }: UserSettingsProps) {
  const [formData, setFormData] = useState(settings)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isModified, setIsModified] = useState(false)

  useEffect(() => {
    setFormData(settings)
  }, [settings])

  useEffect(() => {
    setIsModified(JSON.stringify(formData) !== JSON.stringify(settings))
  }, [formData, settings])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.theme) {
      newErrors.theme = 'テーマの選択は必須です'
    }
    
    if (formData.booksPerPage < 10 || formData.booksPerPage > 100) {
      newErrors.booksPerPage = '表示件数は10件以上100件以下で設定してください'
    }
    
    if (formData.readingGoal && (formData.readingGoal < 1 || formData.readingGoal > 1000)) {
      newErrors.readingGoal = '読書目標は1冊以上1000冊以下で設定してください'
    }
    
    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors = validateForm()
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      await onSave(formData)
    }
  }

  return (
    <div data-testid="settings-container" className="w-full max-w-4xl mx-auto space-y-6 mobile-layout desktop-layout">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            外観設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theme">テーマ</Label>
              <Select
                value={formData.theme}
                onValueChange={(value) => setFormData({ ...formData, theme: value as any })}
              >
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">ライト</SelectItem>
                  <SelectItem value="dark">ダーク</SelectItem>
                  <SelectItem value="system">システム</SelectItem>
                </SelectContent>
              </Select>
              {errors.theme && <p className="text-sm text-destructive">{errors.theme}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayMode">表示モード</Label>
              <Select
                value={formData.displayMode}
                onValueChange={(value) => setFormData({ ...formData, displayMode: value as any })}
              >
                <SelectTrigger id="displayMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">グリッド</SelectItem>
                  <SelectItem value="list">リスト</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div data-testid="theme-preview" className={`p-4 rounded-lg border ${formData.theme === 'dark' ? 'dark bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'}`}>
            <div className="flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4" />
              テーマプレビュー - {formData.theme === 'light' ? 'ライト' : formData.theme === 'dark' ? 'ダーク' : 'システム'}テーマ
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            書籍表示設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="booksPerPage">1ページの表示件数</Label>
              <Input
                id="booksPerPage"
                type="number"
                min="10"
                max="100"
                value={formData.booksPerPage}
                onChange={(e) => setFormData({ ...formData, booksPerPage: Number(e.target.value) })}
              />
              {errors.booksPerPage && <p className="text-sm text-destructive">{errors.booksPerPage}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultBookType">デフォルト書籍タイプ</Label>
              <Select
                value={formData.defaultBookType}
                onValueChange={(value) => setFormData({ ...formData, defaultBookType: value as any })}
              >
                <SelectTrigger id="defaultBookType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">物理書籍</SelectItem>
                  <SelectItem value="ebook">電子書籍</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="readingGoal">年間読書目標（冊）</Label>
            <Input
              id="readingGoal"
              type="number"
              min="1"
              max="1000"
              placeholder="例: 50"
              value={formData.readingGoal || ''}
              onChange={(e) => setFormData({ ...formData, readingGoal: e.target.value ? Number(e.target.value) : undefined })}
            />
            {errors.readingGoal && <p className="text-sm text-destructive">{errors.readingGoal}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={!isModified || loading}
          onClick={() => setFormData(settings)}
        >
          リセット
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isModified || loading}
          className="min-w-[120px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              更新中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              設定を保存
            </>
          )}
        </Button>
      </div>

      {loading && (
        <div role="status" className="sr-only">
          保存中...
        </div>
      )}
    </div>
  )
}