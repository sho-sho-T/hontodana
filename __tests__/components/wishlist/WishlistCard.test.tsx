/**
 * WishlistCard コンポーネントのテスト
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WishlistCard } from '@/components/wishlist/WishlistCard'

// Next.js router のモック
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Next.js Image のモック
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  )
}))

describe('WishlistCard', () => {
  const defaultWishlistItem = {
    id: 'item-1',
    userId: 'user-1',
    bookId: 'book-1',
    priority: 'medium' as const,
    reason: 'レビューが良い',
    targetDate: new Date('2024-12-31'),
    priceAlert: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    book: {
      id: 'book-1',
      title: 'テスト書籍',
      authors: ['著者名'],
      publisher: 'テスト出版社',
      thumbnailUrl: '/test-image.jpg',
      pageCount: 300,
      description: 'テスト書籍の説明',
      categories: ['フィクション']
    }
  }

  const defaultProps = {
    item: defaultWishlistItem,
    onPriorityChange: jest.fn(),
    onRemove: jest.fn(),
    onMoveToLibrary: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('基本表示', () => {
    test('ウィッシュリストアイテムが正しく表示される', () => {
      render(<WishlistCard {...defaultProps} />)
      
      expect(screen.getByText('テスト書籍')).toBeInTheDocument()
      expect(screen.getByText('著者名')).toBeInTheDocument()
      expect(screen.getByText('テスト出版社')).toBeInTheDocument()
      expect(screen.getByText('レビューが良い')).toBeInTheDocument()
    })

    test('書影が正しく表示される', () => {
      render(<WishlistCard {...defaultProps} />)
      
      const image = screen.getByRole('img', { name: /テスト書籍/i })
      expect(image).toHaveAttribute('src', '/test-image.jpg')
      expect(image).toHaveAttribute('alt', 'テスト書籍 の書影')
    })

    test('書影がない場合はfallback画像が表示される', () => {
      const itemWithoutThumbnail = {
        ...defaultWishlistItem,
        book: {
          ...defaultWishlistItem.book,
          thumbnailUrl: null
        }
      }
      
      render(<WishlistCard {...defaultProps} item={itemWithoutThumbnail} />)
      
      const image = screen.getByRole('img', { name: /テスト書籍/i })
      expect(image).toHaveAttribute('src', '/images/book-placeholder.png')
    })

    test('目標日が表示される', () => {
      render(<WishlistCard {...defaultProps} />)
      
      expect(screen.getByText('目標: 2024-12-31')).toBeInTheDocument()
    })

    test('目標日がない場合は表示されない', () => {
      const itemWithoutTargetDate = {
        ...defaultWishlistItem,
        targetDate: null
      }
      
      render(<WishlistCard {...defaultProps} item={itemWithoutTargetDate} />)
      
      expect(screen.queryByText(/目標:/)).not.toBeInTheDocument()
    })
  })

  describe('優先度表示', () => {
    test('urgent優先度が正しく表示される', () => {
      const urgentItem = {
        ...defaultWishlistItem,
        priority: 'urgent' as const
      }
      
      render(<WishlistCard {...defaultProps} item={urgentItem} />)
      
      expect(screen.getByText('🔴')).toBeInTheDocument()
      expect(screen.getByText('緊急')).toBeInTheDocument()
    })

    test('high優先度が正しく表示される', () => {
      const highItem = {
        ...defaultWishlistItem,
        priority: 'high' as const
      }
      
      render(<WishlistCard {...defaultProps} item={highItem} />)
      
      expect(screen.getByText('🟡')).toBeInTheDocument()
      expect(screen.getByText('高')).toBeInTheDocument()
    })

    test('medium優先度が正しく表示される', () => {
      render(<WishlistCard {...defaultProps} />)
      
      expect(screen.getByText('🟢')).toBeInTheDocument()
      expect(screen.getByText('中')).toBeInTheDocument()
    })

    test('low優先度が正しく表示される', () => {
      const lowItem = {
        ...defaultWishlistItem,
        priority: 'low' as const
      }
      
      render(<WishlistCard {...defaultProps} item={lowItem} />)
      
      expect(screen.getByText('⚪')).toBeInTheDocument()
      expect(screen.getByText('低')).toBeInTheDocument()
    })
  })

  describe('インタラクション', () => {
    test('カードクリック時に書籍詳細画面に遷移する', () => {
      render(<WishlistCard {...defaultProps} />)
      
      const card = screen.getByRole('article')
      fireEvent.click(card)
      
      expect(mockPush).toHaveBeenCalledWith('/books/book-1')
    })

    test('優先度変更ボタンが動作する', async () => {
      render(<WishlistCard {...defaultProps} />)
      
      const priorityButton = screen.getByRole('button', { name: /優先度変更/i })
      fireEvent.click(priorityButton)
      
      await waitFor(() => {
        expect(defaultProps.onPriorityChange).toHaveBeenCalledWith('item-1', 'high')
      })
    })

    test('削除ボタンが動作する', async () => {
      render(<WishlistCard {...defaultProps} />)
      
      const removeButton = screen.getByRole('button', { name: /削除/i })
      fireEvent.click(removeButton)
      
      expect(defaultProps.onRemove).toHaveBeenCalledWith('item-1')
    })

    test('本棚移動ボタンが動作する', async () => {
      render(<WishlistCard {...defaultProps} />)
      
      const moveButton = screen.getByRole('button', { name: /本棚に移動/i })
      fireEvent.click(moveButton)
      
      expect(defaultProps.onMoveToLibrary).toHaveBeenCalledWith('item-1')
    })
  })

  describe('レスポンシブ対応', () => {
    test('モバイル表示で適切にレイアウトされる', () => {
      // モバイルサイズをシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<WishlistCard {...defaultProps} />)
      
      const card = screen.getByRole('article')
      expect(card).toHaveClass('flex-col') // モバイル時は縦並び
    })
  })

  describe('アクセシビリティ', () => {
    test('適切なARIA属性が設定される', () => {
      render(<WishlistCard {...defaultProps} />)
      
      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-label', 'テスト書籍 のウィッシュリストアイテム')
    })

    test('キーボード操作が可能', () => {
      render(<WishlistCard {...defaultProps} />)
      
      const priorityButton = screen.getByRole('button', { name: /優先度変更/i })
      priorityButton.focus()
      
      expect(priorityButton).toHaveFocus()
      
      fireEvent.keyDown(priorityButton, { key: 'Enter' })
      
      expect(defaultProps.onPriorityChange).toHaveBeenCalledWith('item-1', 'high')
    })
  })

  describe('エラーハンドリング', () => {
    test('不正なデータでもクラッシュしない', () => {
      const invalidItem = {
        ...defaultWishlistItem,
        book: null
      }
      
      expect(() => {
        render(<WishlistCard {...defaultProps} item={invalidItem} />)
      }).not.toThrow()
    })

    test('コールバック関数がない場合でもクラッシュしない', () => {
      const propsWithoutCallbacks = {
        item: defaultWishlistItem
      }
      
      expect(() => {
        render(<WishlistCard {...propsWithoutCallbacks} />)
      }).not.toThrow()
    })
  })
})