import { render, screen, act } from '@testing-library/react'
import { BookCard } from '@/components/library/BookCard'
import { BookStatus } from '@/lib/models/book'

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

jest.mock('next/image', () => {
  return function MockImage({ alt, ...props }: any) {
    return <img alt={alt} {...props} />
  }
})

const mockBook = {
  id: '1',
  book: {
    title: 'Test Book Title That Is Very Long And Should Truncate On Mobile Devices',
    authors: ['Test Author', 'Another Author'],
    publisher: 'Test Publisher',
    thumbnailUrl: '/test-cover.jpg',
    pageCount: 300
  },
  status: BookStatus.READING,
  currentPage: 100,
  rating: 4
}

describe('BookCard Responsive Behavior', () => {
  const mockOnStatusChange = jest.fn()
  const mockOnRemove = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Mock window.matchMedia for responsive tests
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))
    })
  })

  test('should render mobile-optimized layout', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    })

    render(<BookCard 
      book={mockBook} 
      onStatusChange={mockOnStatusChange}
      onRemove={mockOnRemove}
    />)

    const card = screen.getByRole('button', { name: /Test Book Title/ })
    
    // These assertions will fail because responsive classes aren't implemented yet
    expect(card).toHaveClass('w-full', 'sm:w-auto') // Will fail
    
    // Check that image wrapper has mobile-appropriate sizing
    const imageWrapper = card.querySelector('.mobile-image-size')
    expect(imageWrapper).toBeInTheDocument()
    expect(imageWrapper).toHaveClass('mobile-image-size')
  })

  test('should have appropriate touch target sizes on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    })

    render(<BookCard 
      book={mockBook} 
      onStatusChange={mockOnStatusChange}
      onRemove={mockOnRemove}
    />)

    // Check button sizes for mobile (44px minimum)
    const statusButton = screen.getByRole('button', { name: 'ステータス変更' })
    const deleteButton = screen.getByRole('button', { name: '削除' })
    
    // These will fail because mobile touch optimizations aren't implemented
    expect(statusButton).toHaveClass('min-h-11', 'min-w-11') // 44px = 11 * 0.25rem
    expect(deleteButton).toHaveClass('min-h-11', 'min-w-11')
  })
})