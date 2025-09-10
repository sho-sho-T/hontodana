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
    const mockOnViewChange = jest.fn()
    const { rerender } = render(<ViewToggle {...defaultProps} onViewChange={mockOnViewChange} />)
    
    // 初期レンダリング時にgridがlocalStorageに保存される
    expect(localStorageMock.setItem).toHaveBeenCalledWith('library-view-mode', 'grid')
    
    // currentViewを変更してリレンダリング
    rerender(<ViewToggle currentView="list" onViewChange={mockOnViewChange} />)
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('library-view-mode', 'list')
  })

  test('コンポーネントが正常にレンダリングされる', () => {
    render(<ViewToggle {...defaultProps} />)
    
    // localStorageに初期状態が保存されることを確認
    expect(localStorageMock.setItem).toHaveBeenCalledWith('library-view-mode', 'grid')
    
    // ボタンが正しく表示されることを確認
    expect(screen.getByRole('button', { name: /グリッド表示/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /リスト表示/i })).toBeInTheDocument()
  })
})