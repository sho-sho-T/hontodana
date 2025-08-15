/**
 * BookSkeleton コンポーネントのテスト
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { BookSkeleton } from '@/components/library/BookSkeleton'

describe('BookSkeleton - 基本表示', () => {
  test('グリッドモード用スケルトンが正しく表示される', () => {
    render(<BookSkeleton viewMode="grid" count={3} />)
    
    const skeletonItems = screen.getAllByTestId('skeleton-item')
    expect(skeletonItems).toHaveLength(3)
    
    // グリッド用のスケルトンスタイルが適用されているか確認
    skeletonItems.forEach(item => {
      expect(item).toHaveClass('grid-skeleton')
    })
  })

  test('リストモード用スケルトンが正しく表示される', () => {
    render(<BookSkeleton viewMode="list" count={5} />)
    
    const skeletonItems = screen.getAllByTestId('skeleton-item')
    expect(skeletonItems).toHaveLength(5)
    
    // リスト用のスケルトンスタイルが適用されているか確認
    skeletonItems.forEach(item => {
      expect(item).toHaveClass('list-skeleton')
    })
  })

  test('デフォルトの count が適用される', () => {
    render(<BookSkeleton viewMode="grid" />)
    
    // デフォルトは6個
    const skeletonItems = screen.getAllByTestId('skeleton-item')
    expect(skeletonItems).toHaveLength(6)
  })

  test('カスタム count が正しく適用される', () => {
    render(<BookSkeleton viewMode="grid" count={10} />)
    
    const skeletonItems = screen.getAllByTestId('skeleton-item')
    expect(skeletonItems).toHaveLength(10)
  })
})

describe('BookSkeleton - アニメーション', () => {
  test('パルスアニメーションが適用される', () => {
    render(<BookSkeleton viewMode="grid" count={1} />)
    
    const skeletonItem = screen.getByTestId('skeleton-item')
    expect(skeletonItem).toHaveClass('animate-pulse')
  })

  test('各スケルトン要素にアニメーションが適用される', () => {
    render(<BookSkeleton viewMode="grid" count={3} />)
    
    const skeletonItems = screen.getAllByTestId('skeleton-item')
    skeletonItems.forEach(item => {
      expect(item).toHaveClass('animate-pulse')
    })
  })
})

describe('BookSkeleton - レスポンシブ対応', () => {
  test('グリッドモードでレスポンシブクラスが適用される', () => {
    render(<BookSkeleton viewMode="grid" count={1} />)
    
    const container = screen.getByTestId('skeleton-container')
    expect(container).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4')
  })

  test('リストモードで適切なレイアウトクラスが適用される', () => {
    render(<BookSkeleton viewMode="list" count={1} />)
    
    const container = screen.getByTestId('skeleton-container')
    expect(container).toHaveClass('space-y-4')
  })
})

describe('BookSkeleton - アクセシビリティ', () => {
  test('適切な ARIA 属性が設定される', () => {
    render(<BookSkeleton viewMode="grid" count={1} />)
    
    const container = screen.getByTestId('skeleton-container')
    expect(container).toHaveAttribute('aria-label', '書籍データを読み込み中')
    expect(container).toHaveAttribute('aria-busy', 'true')
  })

  test('各スケルトン項目に適切な role が設定される', () => {
    render(<BookSkeleton viewMode="grid" count={3} />)
    
    const skeletonItems = screen.getAllByTestId('skeleton-item')
    skeletonItems.forEach(item => {
      expect(item).toHaveAttribute('role', 'status')
      expect(item).toHaveAttribute('aria-label', '書籍情報を読み込み中')
    })
  })
})