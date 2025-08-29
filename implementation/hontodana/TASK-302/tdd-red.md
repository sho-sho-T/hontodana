# TASK-302: モバイル対応・レスポンシブ最適化 - RED Phase (失敗テスト実装)

## フェーズ概要

TDDのRed Phaseとして、まず失敗するテストを実装します。これらのテストは、まだ実装されていない機能をテストするため、最初は失敗します。

## 実装するテスト

### 1. useViewport Hook の実装と失敗テスト

#### ファイル: `hooks/useViewport.ts` (まだ存在しない)

```typescript
// This file doesn't exist yet - tests will fail
```

#### テストファイル: `__tests__/hooks/useViewport.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react'
import { useViewport } from '@/hooks/useViewport'

describe('useViewport Hook', () => {
  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    })
  })

  test('should return current viewport dimensions', () => {
    const { result } = renderHook(() => useViewport())
    
    expect(result.current.width).toBe(1024)
    expect(result.current.height).toBe(768)
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(true)
    expect(result.current.isDesktop).toBe(true)
  })

  test('should detect mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    })
    
    const { result } = renderHook(() => useViewport())
    
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
  })

  test('should update on window resize', () => {
    const { result } = renderHook(() => useViewport())
    
    // Initial desktop size
    expect(result.current.isDesktop).toBe(true)
    
    // Resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 568,
      })
      window.dispatchEvent(new Event('resize'))
    })
    
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isDesktop).toBe(false)
  })
})
```

### 2. useSwipe Hook の失敗テスト

#### テストファイル: `__tests__/hooks/useSwipe.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react'
import { useSwipe } from '@/hooks/useSwipe'

// Mock TouchEvent for Node.js environment
class MockTouchEvent extends Event {
  touches: Array<{ clientX: number; clientY: number }>
  changedTouches: Array<{ clientX: number; clientY: number }>

  constructor(type: string, eventInitDict: any) {
    super(type, eventInitDict)
    this.touches = eventInitDict.touches || []
    this.changedTouches = eventInitDict.changedTouches || []
  }
}

// @ts-ignore
global.TouchEvent = MockTouchEvent

describe('useSwipe Hook', () => {
  const mockOnSwipeLeft = jest.fn()
  const mockOnSwipeRight = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should detect left swipe gesture', () => {
    const elementRef = { current: document.createElement('div') }
    
    renderHook(() => useSwipe({
      onSwipeLeft: mockOnSwipeLeft,
      onSwipeRight: mockOnSwipeRight,
      elementRef
    }))

    // Simulate touch start
    act(() => {
      const touchStart = new MockTouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      elementRef.current.dispatchEvent(touchStart)
    })

    // Simulate touch end (swipe left)
    act(() => {
      const touchEnd = new MockTouchEvent('touchend', {
        changedTouches: [{ clientX: 20, clientY: 100 }]
      })
      elementRef.current.dispatchEvent(touchEnd)
    })

    expect(mockOnSwipeLeft).toHaveBeenCalled()
    expect(mockOnSwipeRight).not.toHaveBeenCalled()
  })

  test('should detect right swipe gesture', () => {
    const elementRef = { current: document.createElement('div') }
    
    renderHook(() => useSwipe({
      onSwipeLeft: mockOnSwipeLeft,
      onSwipeRight: mockOnSwipeRight,
      elementRef
    }))

    // Simulate touch start
    act(() => {
      const touchStart = new MockTouchEvent('touchstart', {
        touches: [{ clientX: 20, clientY: 100 }]
      })
      elementRef.current.dispatchEvent(touchStart)
    })

    // Simulate touch end (swipe right)
    act(() => {
      const touchEnd = new MockTouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100 }]
      })
      elementRef.current.dispatchEvent(touchEnd)
    })

    expect(mockOnSwipeRight).toHaveBeenCalled()
    expect(mockOnSwipeLeft).not.toHaveBeenCalled()
  })

  test('should not trigger swipe for short distance', () => {
    const elementRef = { current: document.createElement('div') }
    
    renderHook(() => useSwipe({
      onSwipeLeft: mockOnSwipeLeft,
      onSwipeRight: mockOnSwipeRight,
      elementRef,
      threshold: 50
    }))

    // Simulate short swipe (less than threshold)
    act(() => {
      const touchStart = new MockTouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      elementRef.current.dispatchEvent(touchStart)
    })

    act(() => {
      const touchEnd = new MockTouchEvent('touchend', {
        changedTouches: [{ clientX: 90, clientY: 100 }]
      })
      elementRef.current.dispatchEvent(touchEnd)
    })

    expect(mockOnSwipeLeft).not.toHaveBeenCalled()
    expect(mockOnSwipeRight).not.toHaveBeenCalled()
  })
})
```

### 3. BookCard レスポンシブテスト (失敗版)

#### テストファイル: `__tests__/components/BookCard.responsive.test.tsx`

```typescript
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
    
    // Check that image has mobile-appropriate sizing
    const image = screen.getByRole('img', { name: /Test Book Title の書影/ })
    expect(image).toHaveClass('mobile-image-size') // Will fail
    
    // Check mobile-optimized padding
    const content = card.querySelector('[data-testid="card-content"]')
    expect(content).toHaveClass('p-2', 'sm:p-4') // Will fail
  })

  test('should truncate long titles on mobile', () => {
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

    const titleElement = screen.getByText(/Test Book Title/)
    
    // Should have mobile-specific truncation classes
    expect(titleElement).toHaveClass('line-clamp-1', 'sm:line-clamp-2') // Will fail
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

  test('should adapt layout on screen size changes', () => {
    const { rerender } = render(<BookCard 
      book={mockBook} 
      onStatusChange={mockOnStatusChange}
      onRemove={mockOnRemove}
    />)

    // Start with desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    rerender(<BookCard 
      book={mockBook} 
      onStatusChange={mockOnStatusChange}
      onRemove={mockOnRemove}
    />)
    
    let card = screen.getByRole('button', { name: /Test Book Title/ })
    expect(card).toHaveClass('desktop-layout') // Will fail

    // Change to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    })
    
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    rerender(<BookCard 
      book={mockBook} 
      onStatusChange={mockOnStatusChange}
      onRemove={mockOnRemove}
    />)
    
    card = screen.getByRole('button', { name: /Test Book Title/ })
    expect(card).toHaveClass('mobile-layout') // Will fail
  })

  test('should render compact information on small screens', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 320
    })

    render(<BookCard 
      book={mockBook} 
      onStatusChange={mockOnStatusChange}
      onRemove={mockOnRemove}
    />)

    // Publisher should be hidden on very small screens
    const publisherElement = screen.queryByText('Test Publisher')
    expect(publisherElement).toHaveClass('hidden', 'sm:block') // Will fail

    // Author list should be truncated more aggressively
    const authorElement = screen.getByText(/Test Author/)
    expect(authorElement).toHaveClass('truncate-mobile') // Will fail
  })
})
```

### 4. MobileNavigation テスト (失敗版)

#### テストファイル: `__tests__/components/MobileNavigation.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileNavigation } from '@/components/navigation/MobileNavigation'

// Mock Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/library'
  }),
  usePathname: () => '/library'
}))

describe('MobileNavigation Component', () => {
  beforeEach(() => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    })
  })

  test('should render hamburger menu button', () => {
    render(<MobileNavigation />)

    // This will fail because MobileNavigation component doesn't exist yet
    const hamburgerButton = screen.getByLabelText('メニューを開く')
    expect(hamburgerButton).toBeInTheDocument()
    expect(hamburgerButton).toHaveClass('md:hidden') // Hidden on desktop
  })

  test('should toggle mobile menu on hamburger click', async () => {
    const user = userEvent.setup()
    render(<MobileNavigation />)

    const hamburgerButton = screen.getByLabelText('メニューを開く')
    const mobileMenu = screen.getByTestId('mobile-menu')

    // Initially closed
    expect(mobileMenu).toHaveClass('hidden')

    // Open menu
    await user.click(hamburgerButton)
    expect(mobileMenu).not.toHaveClass('hidden')
    expect(mobileMenu).toHaveClass('animate-slide-down') // Will fail

    // Close menu
    await user.click(hamburgerButton)
    expect(mobileMenu).toHaveClass('hidden')
  })

  test('should close menu when clicking outside', async () => {
    const user = userEvent.setup()
    render(<MobileNavigation />)

    const hamburgerButton = screen.getByLabelText('メニューを開く')
    
    // Open menu
    await user.click(hamburgerButton)
    
    const mobileMenu = screen.getByTestId('mobile-menu')
    expect(mobileMenu).not.toHaveClass('hidden')

    // Click outside
    await user.click(document.body)
    
    await waitFor(() => {
      expect(mobileMenu).toHaveClass('hidden')
    })
  })

  test('should support swipe gestures to close menu', () => {
    render(<MobileNavigation />)

    // This will fail because swipe gesture support isn't implemented
    const mobileMenu = screen.getByTestId('mobile-menu')
    
    // Simulate swipe up gesture
    fireEvent.touchStart(mobileMenu, {
      touches: [{ clientX: 100, clientY: 300 }]
    })
    
    fireEvent.touchEnd(mobileMenu, {
      changedTouches: [{ clientX: 100, clientY: 100 }]
    })

    expect(mobileMenu).toHaveClass('hidden')
  })

  test('should have proper accessibility attributes', () => {
    render(<MobileNavigation />)

    const hamburgerButton = screen.getByLabelText('メニューを開く')
    const mobileMenu = screen.getByTestId('mobile-menu')

    // ARIA attributes will fail because they're not implemented
    expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')
    expect(hamburgerButton).toHaveAttribute('aria-controls', 'mobile-menu')
    expect(mobileMenu).toHaveAttribute('aria-labelledby', 'hamburger-button')
  })
})
```

### 5. ResponsiveImage テスト (失敗版)

#### テストファイル: `__tests__/components/ResponsiveImage.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { ResponsiveImage } from '@/components/ui/ResponsiveImage'

describe('ResponsiveImage Component', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test Image',
    width: 200,
    height: 300
  }

  test('should render with responsive sizes', () => {
    render(<ResponsiveImage {...defaultProps} />)

    const image = screen.getByRole('img', { name: 'Test Image' })
    
    // These will fail because ResponsiveImage doesn't exist
    expect(image).toHaveAttribute('sizes', '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw')
    expect(image).toHaveClass('responsive-image')
  })

  test('should use WebP format when supported', () => {
    render(<ResponsiveImage {...defaultProps} useWebP />)

    const image = screen.getByRole('img')
    
    // Should have srcSet with WebP variants
    expect(image).toHaveAttribute('srcSet')
    const srcSet = image.getAttribute('srcSet')
    expect(srcSet).toMatch(/\.webp/) // Will fail
  })

  test('should apply mobile-specific sizing', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    })

    render(<ResponsiveImage {...defaultProps} mobileSize="small" />)

    const image = screen.getByRole('img')
    expect(image).toHaveClass('mobile-small') // Will fail
  })

  test('should implement lazy loading', () => {
    render(<ResponsiveImage {...defaultProps} lazy />)

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('loading', 'lazy') // Will fail
  })
})
```

## テスト実行と失敗確認

以下のコマンドでテストを実行し、期待通りに失敗することを確認します。

```bash
# 全レスポンシブテストを実行
npm test -- --testPathPattern="responsive|mobile|viewport|swipe"

# 個別テスト実行
npm test __tests__/hooks/useViewport.test.ts
npm test __tests__/hooks/useSwipe.test.ts
npm test __tests__/components/BookCard.responsive.test.tsx
npm test __tests__/components/MobileNavigation.test.tsx
npm test __tests__/components/ResponsiveImage.test.tsx
```

## 期待される失敗メッセージ

### useViewport Hook
```
Error: Cannot find module '@/hooks/useViewport'
```

### useSwipe Hook  
```
Error: Cannot find module '@/hooks/useSwipe'
```

### BookCard Responsive
```
AssertionError: expected element not to have class "w-full"
AssertionError: expected element not to have class "mobile-image-size"
```

### MobileNavigation
```
Error: Cannot find module '@/components/navigation/MobileNavigation'
```

### ResponsiveImage
```
Error: Cannot find module '@/components/ui/ResponsiveImage'
```

## 失敗テスト実装の完了

これらのテストは以下の理由で失敗します：

1. **必要なHookが存在しない**: `useViewport`, `useSwipe`
2. **レスポンシブ対応コンポーネントが存在しない**: `MobileNavigation`, `ResponsiveImage`  
3. **既存コンポーネントにレスポンシブクラスが適用されていない**: `BookCard`
4. **タッチジェスチャー機能が実装されていない**
5. **モバイル最適化が実装されていない**

次のGreen Phaseでは、これらのテストが通るように最小限の実装を行います。