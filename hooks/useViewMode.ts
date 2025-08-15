/**
 * 表示モード管理カスタムフック
 */

import { useState, useEffect } from 'react'
import type { ViewMode } from '@/lib/models/book'

const STORAGE_KEY = 'library-view-mode'

export function useViewMode(defaultMode: ViewMode = 'grid') {
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultMode)

  // 初期化時にlocalStorageから読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'grid' || stored === 'list') {
        setViewModeState(stored)
      }
    } catch (error) {
      // localStorage読み込みエラー時はデフォルト値を使用
      console.warn('Failed to read view mode from localStorage:', error)
    }
  }, [])

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode)
    
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch (error) {
      // localStorage書き込みエラー時も状態は更新
      console.warn('Failed to save view mode to localStorage:', error)
    }
  }

  return {
    viewMode,
    setViewMode
  }
}