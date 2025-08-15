/**
 * 表示切り替えコンポーネント
 */

import React, { useEffect } from 'react'
import { Grid, List } from 'lucide-react'
import type { ViewToggleProps } from '@/lib/models/book'

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  // localStorage連携
  useEffect(() => {
    const handleViewChange = (view: typeof currentView) => {
      try {
        localStorage.setItem('library-view-mode', view)
      } catch (error) {
        console.warn('Failed to save view mode:', error)
      }
    }

    handleViewChange(currentView)
  }, [currentView])

  const buttonBaseClass = "p-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const activeClass = "bg-primary text-primary-foreground"
  const inactiveClass = "bg-gray-100 text-gray-600 hover:bg-gray-200"

  return (
    <div className="flex gap-1 border rounded-lg p-1 bg-gray-50" role="group" aria-label="表示モード選択">
      <button
        type="button"
        onClick={() => onViewChange('grid')}
        className={`${buttonBaseClass} ${currentView === 'grid' ? activeClass : inactiveClass}`}
        aria-label="グリッド表示"
        aria-pressed={currentView === 'grid'}
      >
        <Grid size={20} />
      </button>
      <button
        type="button"
        onClick={() => onViewChange('list')}
        className={`${buttonBaseClass} ${currentView === 'list' ? activeClass : inactiveClass}`}
        aria-label="リスト表示"
        aria-pressed={currentView === 'list'}
      >
        <List size={20} />
      </button>
    </div>
  )
}