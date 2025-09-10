/**
 * BookCard コンポーネントのテスト
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { BookCard } from '@/components/library/BookCard'
import { BookStatus } from '@/lib/models/book'
import { mockUserBook, createMockBook } from '@/__tests__/fixtures/bookData'

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
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) => (
    // biome-ignore lint/performance/noImgElement: This is a test mock
    <img src={src} alt={alt} {...props} />
  )
}))

describe('BookCard - 基本表示', () => {
  const defaultProps = {
    book: mockUserBook,
    viewMode: 'grid' as const,
    onStatusChange: jest.fn(),
    onRemove: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('書籍の基本情報が正しく表示される', () => {
    render(<BookCard {...defaultProps} />)
    
    expect(screen.getByText('テスト書籍のタイトル')).toBeInTheDocument()
    expect(screen.getByText('テスト著者1, テスト著者2')).toBeInTheDocument()
    expect(screen.getByText('テスト出版社')).toBeInTheDocument()
  })

  test('書影が正しく表示される', () => {
    render(<BookCard {...defaultProps} />)
    
    const image = screen.getByRole('img', { name: /テスト書籍のタイトル/i })
    expect(image).toHaveAttribute('src', 'https://example.com/thumbnail.jpg')
    expect(image).toHaveAttribute('alt', 'テスト書籍のタイトル の書影')
  })

  test('書影がない場合はfallback画像が表示される', () => {
    const bookWithoutThumbnail = createMockBook({
      book: { ...mockUserBook.book, thumbnailUrl: null }
    })
    
    render(<BookCard {...defaultProps} book={bookWithoutThumbnail} />)
    
    const image = screen.getByRole('img', { name: /テスト書籍のタイトル/i })
    expect(image).toHaveAttribute('src', '/images/book-placeholder.png')
  })
})

describe('BookCard - ステータス表示', () => {
  const defaultProps = {
    viewMode: 'grid' as const,
    onStatusChange: jest.fn(),
    onRemove: jest.fn()
  }

  test('読みたい本のステータスが表示される', () => {
    const wantToReadBook = createMockBook({
      status: BookStatus.WANT_TO_READ,
      currentPage: 0
    })
    
    render(<BookCard {...defaultProps} book={wantToReadBook} />)
    
    expect(screen.getByText('読みたい')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  test('読書中のステータスと進捗バーが表示される', () => {
    const readingBook = createMockBook({
      status: BookStatus.READING,
      currentPage: 150,
      book: { ...mockUserBook.book, pageCount: 300 }
    })
    
    render(<BookCard {...defaultProps} book={readingBook} />)
    
    expect(screen.getByText('読書中')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  test('読了のステータスが表示される', () => {
    const readBook = createMockBook({
      status: BookStatus.READ,
      currentPage: 300,
      book: { ...mockUserBook.book, pageCount: 300 }
    })
    
    render(<BookCard {...defaultProps} book={readBook} />)
    
    expect(screen.getByText('読了')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})

describe('BookCard - インタラクション', () => {
  const defaultProps = {
    book: mockUserBook,
    viewMode: 'grid' as const,
    onStatusChange: jest.fn(),
    onRemove: jest.fn()
  }

  test('カードクリック時に詳細画面に遷移する', () => {
    render(<BookCard {...defaultProps} />)
    
    const card = screen.getByRole('button', { name: /テスト書籍のタイトル の詳細/i })
    fireEvent.click(card)
    
    expect(mockPush).toHaveBeenCalledWith('/protected/books/book-1')
  })

  test('ステータス変更ボタンクリック時にコールバックが実行される', () => {
    render(<BookCard {...defaultProps} />)
    
    const statusButton = screen.getByRole('button', { name: /ステータス変更/i })
    fireEvent.click(statusButton)
    
    expect(defaultProps.onStatusChange).toHaveBeenCalledWith('user-book-1', BookStatus.READ)
  })

  test('削除ボタンクリック時にコールバックが実行される', () => {
    render(<BookCard {...defaultProps} />)
    
    const deleteButton = screen.getByRole('button', { name: /削除/i })
    fireEvent.click(deleteButton)
    
    expect(defaultProps.onRemove).toHaveBeenCalledWith('user-book-1')
  })
})

describe('BookCard - ホバー効果', () => {
  const defaultProps = {
    book: mockUserBook,
    viewMode: 'grid' as const,
    onStatusChange: jest.fn(),
    onRemove: jest.fn()
  }

  test('カードが正しいクラス名を持つ', () => {
    render(<BookCard {...defaultProps} />)
    
    const card = screen.getByRole('button', { name: /テスト書籍のタイトル の詳細/i })
    
    // 基本的なスタイルクラスが適用されていることを確認
    expect(card).toHaveClass('cursor-pointer')
    expect(card).toHaveClass('bg-white')
  })
})