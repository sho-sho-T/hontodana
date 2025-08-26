'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ThemeSelectorProps, Theme } from '@/types/profile'

const themeOptions: { value: Theme; label: string; description: string; icon: string }[] = [
  { value: 'light', label: 'Light', description: '明るいテーマ', icon: '☀️' },
  { value: 'dark', label: 'Dark', description: '暗いテーマ', icon: '🌙' },
  { value: 'system', label: 'System', description: 'システム設定に従う', icon: '💻' },
]

export default function ThemeSelector({
  currentTheme,
  onChange,
  className,
}: ThemeSelectorProps) {
  // テーマ変更時に即座にHTMLクラスを適用（プレビュー機能）
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('light', 'dark')
    
    if (currentTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      html.classList.add(systemPrefersDark ? 'dark' : 'light')
    } else {
      html.classList.add(currentTheme)
    }
  }, [currentTheme])

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-sm font-medium text-gray-900">テーマ設定</h3>
        <p className="text-xs text-gray-500 mt-1">
          アプリケーションの外観を変更できます
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {themeOptions.map((option) => (
          <Button
            key={option.value}
            variant={currentTheme === option.value ? 'default' : 'outline'}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-col items-center p-4 h-auto space-y-2 transition-all',
              currentTheme === option.value && 'bg-blue-500 text-white hover:bg-blue-600'
            )}
            aria-pressed={currentTheme === option.value}
            aria-describedby={`theme-${option.value}-description`}
          >
            <span className="text-lg" role="img" aria-hidden="true">
              {option.icon}
            </span>
            <div className="text-center">
              <div className="font-medium text-sm">{option.label}</div>
              <div 
                id={`theme-${option.value}-description`}
                className="text-xs opacity-75"
              >
                {option.description}
              </div>
            </div>
          </Button>
        ))}
      </div>
      
      <div className="flex items-center space-x-2 text-xs text-gray-600">
        <div className="w-3 h-3 bg-blue-500 rounded-full" />
        <span>現在選択中: {themeOptions.find(opt => opt.value === currentTheme)?.description}</span>
      </div>
    </div>
  )
}