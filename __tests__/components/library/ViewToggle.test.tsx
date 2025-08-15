/**
 * ViewToggle コンポーネントのテスト
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ViewToggle } from '@/components/library/ViewToggle'

// localStorage のモック
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('ViewToggle - 基本表示', () => {
  const defaultProps = {
    currentView: 'grid' as const,
    onViewChange: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
  })

  test('グリッド/リスト切り替えボタンが表示される', () => {
    render(<ViewToggle {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /グリッド表示/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /リスト表示/i })).toBeInTheDocument()
  })

  test('現在選択されているモードがハイライトされる', () => {
    render(<ViewToggle {...defaultProps} />)
    
    const gridButton = screen.getByRole('button', { name: /グリッド表示/i })
    const listButton = screen.getByRole('button', { name: /リスト表示/i })
    
    expect(gridButton).toHaveClass('bg-primary', 'text-primary-foreground')
    expect(listButton).not.toHaveClass('bg-primary', 'text-primary-foreground')
  })
})

describe('ViewToggle - 切り替え機能', () => {
  const defaultProps = {
    currentView: 'grid' as const,
    onViewChange: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('グリッドからリストへの切り替えが動作する', () => {
    render(<ViewToggle {...defaultProps} />)
    
    const listButton = screen.getByRole('button', { name: /リスト表示/i })
    fireEvent.click(listButton)
    
    expect(defaultProps.onViewChange).toHaveBeenCalledWith('list')
  })

  test('リストからグリッドへの切り替えが動作する', () => {
    render(<ViewToggle {...defaultProps} currentView="list" />)
    
    const gridButton = screen.getByRole('button', { name: /グリッド表示/i })
    fireEvent.click(gridButton)
    
    expect(defaultProps.onViewChange).toHaveBeenCalledWith('grid')
  })
})

describe('ViewToggle - 永続化', () => {
  const defaultProps = {
    currentView: 'grid' as const,
    onViewChange: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
  })

  test('選択されたモードがlocalStorageに保存される', () => {
    render(<ViewToggle {...defaultProps} />)
    
    const listButton = screen.getByRole('button', { name: /リスト表示/i })
    fireEvent.click(listButton)
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('library-view-mode', 'list')
  })

  test('初期表示時にlocalStorageから設定が読み込まれる', () => {
    localStorageMock.getItem.mockReturnValue('list')
    
    render(<ViewToggle {...defaultProps} />)
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith('library-view-mode')
    // 注：この時点では実装が存在しないため、実際の動作確認は実装後
  })
})