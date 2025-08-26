'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { DisplaySettingsProps, DisplayMode, BooksPerPage } from '@/types/profile'

const displayModeOptions: { value: DisplayMode; label: string; description: string }[] = [
  { value: 'grid', label: 'Grid', description: '本をカード形式で表示' },
  { value: 'list', label: 'List', description: '本を一覧形式で表示' },
]

const booksPerPageOptions: { value: BooksPerPage; label: string; recommended?: boolean }[] = [
  { value: 10, label: '10冊' },
  { value: 20, label: '20冊', recommended: true },
  { value: 50, label: '50冊' },
  { value: 100, label: '100冊' },
]

const bookTypeOptions = [
  { value: 'physical', label: '紙の本', description: '物理的な本' },
  { value: 'kindle', label: 'Kindle', description: 'Kindle電子書籍' },
  { value: 'epub', label: 'EPUB', description: 'EPUB形式の電子書籍' },
  { value: 'audiobook', label: 'オーディオブック', description: '音声書籍' },
  { value: 'other', label: 'その他', description: 'その他の形式' },
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
        <Label className="text-sm font-medium">表示モード</Label>
        <p className="text-xs text-gray-500">
          本棚の表示方式を選択できます
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {displayModeOptions.map((option) => (
            <Button
              key={option.value}
              variant={settings.displayMode === option.value ? 'default' : 'outline'}
              onClick={() => onChange({ ...settings, displayMode: option.value })}
              className={cn(
                'flex items-center space-x-2 h-auto p-3',
                settings.displayMode === option.value && 'bg-blue-500 text-white hover:bg-blue-600'
              )}
              aria-pressed={settings.displayMode === option.value}
            >
              <div className="text-left">
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs opacity-75">{option.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* 1ページあたりの表示数 */}
      <div className="space-y-3">
        <Label htmlFor="booksPerPage" className="text-sm font-medium">
          1ページあたりの表示数
        </Label>
        <p className="text-xs text-gray-500">
          一度に表示する本の数を設定できます
        </p>
        
        <select
          id="booksPerPage"
          value={settings.booksPerPage}
          onChange={(e) => onChange({ 
            ...settings, 
            booksPerPage: Number.parseInt(e.target.value) as BooksPerPage 
          })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          aria-describedby="books-per-page-description"
        >
          {booksPerPageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}{option.recommended ? ' (推奨)' : ''}
            </option>
          ))}
        </select>
        <p id="books-per-page-description" className="text-xs text-gray-500">
          現在: {settings.booksPerPage}冊ずつ表示
        </p>
      </div>

      {/* デフォルト書籍種類 */}
      <div className="space-y-3">
        <Label htmlFor="defaultBookType" className="text-sm font-medium">
          デフォルト書籍種類
        </Label>
        <p className="text-xs text-gray-500">
          新しい本を追加する際のデフォルトの種類
        </p>
        
        <select
          id="defaultBookType"
          value={settings.defaultBookType}
          onChange={(e) => onChange({ 
            ...settings, 
            defaultBookType: e.target.value as typeof settings.defaultBookType
          })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          {bookTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="text-xs text-gray-600">
          選択中: {bookTypeOptions.find(opt => opt.value === settings.defaultBookType)?.description}
        </div>
      </div>
    </div>
  )
}