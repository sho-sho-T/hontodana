# TASK-302: モバイル対応・レスポンシブ最適化 - テストケース

## テスト戦略

### テスト種別
1. **単体テスト**: Hook とユーティリティ関数
2. **コンポーネントテスト**: レスポンシブコンポーネント
3. **統合テスト**: 画面全体のレスポンシブ動作
4. **E2Eテスト**: 実デバイスでの動作確認

### テストツール
- **Jest**: 単体テスト
- **React Testing Library**: コンポーネントテスト
- **Playwright**: E2Eテスト、マルチデバイステスト
- **@testing-library/jest-dom**: DOM アサーション

## 1. Viewport Detection Hook のテスト

### テストファイル: `__tests__/hooks/useViewport.test.ts`

```typescript
describe('useViewport Hook', () => {
  beforeEach(() => {
    // Mock window.innerWidth and window.innerHeight
    global.innerWidth = 1024;
    global.innerHeight = 768;
  });

  test('should return current viewport dimensions', () => {
    const { result } = renderHook(() => useViewport());
    
    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(true);
  });

  test('should detect mobile viewport', () => {
    global.innerWidth = 375;
    global.innerHeight = 667;
    
    const { result } = renderHook(() => useViewport());
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  test('should update on window resize', () => {
    const { result } = renderHook(() => useViewport());
    
    // Initial desktop size
    expect(result.current.isDesktop).toBe(true);
    
    // Resize to mobile
    act(() => {
      global.innerWidth = 320;
      global.innerHeight = 568;
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  test('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHook(() => useViewport());
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
```

## 2. Swipe Gesture Hook のテスト

### テストファイル: `__tests__/hooks/useSwipe.test.ts`

```typescript
describe('useSwipe Hook', () => {
  const mockOnSwipeLeft = jest.fn();
  const mockOnSwipeRight = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should detect left swipe gesture', () => {
    const { result } = renderHook(() => 
      useSwipe(mockOnSwipeLeft, mockOnSwipeRight)
    );

    const element = document.createElement('div');
    
    // Simulate swipe left
    act(() => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }] as any
      });
      element.dispatchEvent(touchStart);
    });

    act(() => {
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 20, clientY: 100 }] as any
      });
      element.dispatchEvent(touchEnd);
    });

    expect(mockOnSwipeLeft).toHaveBeenCalled();
    expect(mockOnSwipeRight).not.toHaveBeenCalled();
  });

  test('should detect right swipe gesture', () => {
    const { result } = renderHook(() => 
      useSwipe(mockOnSwipeLeft, mockOnSwipeRight)
    );

    const element = document.createElement('div');
    
    // Simulate swipe right
    act(() => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 20, clientY: 100 }] as any
      });
      element.dispatchEvent(touchStart);
    });

    act(() => {
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 100 }] as any
      });
      element.dispatchEvent(touchEnd);
    });

    expect(mockOnSwipeRight).toHaveBeenCalled();
    expect(mockOnSwipeLeft).not.toHaveBeenCalled();
  });

  test('should not trigger swipe for short distance', () => {
    const { result } = renderHook(() => 
      useSwipe(mockOnSwipeLeft, mockOnSwipeRight)
    );

    const element = document.createElement('div');
    
    // Simulate short swipe (less than threshold)
    act(() => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }] as any
      });
      element.dispatchEvent(touchStart);
    });

    act(() => {
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 90, clientY: 100 }] as any
      });
      element.dispatchEvent(touchEnd);
    });

    expect(mockOnSwipeLeft).not.toHaveBeenCalled();
    expect(mockOnSwipeRight).not.toHaveBeenCalled();
  });
});
```

## 3. BookCard レスポンシブテスト

### テストファイル: `__tests__/components/BookCard.responsive.test.tsx`

```typescript
describe('BookCard Responsive Behavior', () => {
  const mockBook = {
    id: '1',
    title: 'テスト書籍',
    author: 'テスト著者',
    coverImage: '/test-cover.jpg',
    currentPage: 100,
    totalPages: 300
  };

  test('should render mobile layout correctly', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    render(<BookCard book={mockBook} />);

    const card = screen.getByTestId('book-card');
    
    // Mobile-specific classes should be present
    expect(card).toHaveClass('w-full'); // Full width on mobile
    
    // Check that image is appropriately sized
    const image = screen.getByRole('img');
    expect(image).toHaveClass('w-16', 'h-20'); // Mobile image size
  });

  test('should render desktop layout correctly', () => {
    // Mock desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });

    render(<BookCard book={mockBook} />);

    const card = screen.getByTestId('book-card');
    
    // Desktop-specific classes should be present
    expect(card).toHaveClass('w-48'); // Fixed width on desktop
    
    // Check that image is appropriately sized
    const image = screen.getByRole('img');
    expect(image).toHaveClass('w-32', 'h-40'); // Desktop image size
  });

  test('should adapt to screen size changes', () => {
    const { rerender } = render(<BookCard book={mockBook} />);

    // Start with desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });

    rerender(<BookCard book={mockBook} />);
    
    let card = screen.getByTestId('book-card');
    expect(card).toHaveClass('w-48');

    // Change to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });
    
    // Trigger resize event
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    rerender(<BookCard book={mockBook} />);
    
    card = screen.getByTestId('book-card');
    expect(card).toHaveClass('w-full');
  });

  test('should have appropriate touch target sizes on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    render(<BookCard book={mockBook} />);

    // Check that clickable elements meet minimum touch target size (44px)
    const actionButton = screen.getByRole('button');
    const styles = window.getComputedStyle(actionButton);
    
    expect(parseInt(styles.height)).toBeGreaterThanOrEqual(44);
    expect(parseInt(styles.width)).toBeGreaterThanOrEqual(44);
  });
});
```

## 4. BookList レスポンシブテスト

### テストファイル: `__tests__/components/BookList.responsive.test.tsx`

```typescript
describe('BookList Responsive Behavior', () => {
  const mockBooks = [
    { id: '1', title: 'Book 1', author: 'Author 1' },
    { id: '2', title: 'Book 2', author: 'Author 2' },
    { id: '3', title: 'Book 3', author: 'Author 3' }
  ];

  test('should display appropriate columns on different screen sizes', () => {
    const { rerender } = render(<BookList books={mockBooks} />);

    // Mobile: 1 column
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    });
    
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    
    rerender(<BookList books={mockBooks} />);
    
    const grid = screen.getByTestId('book-grid');
    expect(grid).toHaveClass('grid-cols-1');

    // Tablet: 2-3 columns
    Object.defineProperty(window, 'innerWidth', {
      value: 768,
      writable: true
    });
    
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    
    rerender(<BookList books={mockBooks} />);
    expect(grid).toHaveClass('sm:grid-cols-2', 'md:grid-cols-3');

    // Desktop: 4+ columns
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true
    });
    
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    
    rerender(<BookList books={mockBooks} />);
    expect(grid).toHaveClass('lg:grid-cols-4');
  });

  test('should handle text overflow on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    });

    const longTitleBook = {
      id: '1',
      title: 'この本のタイトルはとても長くてモバイル画面では全て表示できません',
      author: 'テスト著者'
    };

    render(<BookList books={[longTitleBook]} />);

    const titleElement = screen.getByText(/この本のタイトルは/);
    expect(titleElement).toHaveClass('truncate');
  });
});
```

## 5. Navigation レスポンシブテスト

### テストファイル: `__tests__/components/Navigation.responsive.test.tsx`

```typescript
describe('Navigation Responsive Behavior', () => {
  test('should show hamburger menu on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    });

    render(<Navigation />);

    const hamburgerButton = screen.getByLabelText('メニューを開く');
    expect(hamburgerButton).toBeInTheDocument();

    const desktopNav = screen.queryByTestId('desktop-navigation');
    expect(desktopNav).toHaveClass('hidden', 'md:block');
  });

  test('should show full navigation on desktop', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true
    });

    render(<Navigation />);

    const desktopNav = screen.getByTestId('desktop-navigation');
    expect(desktopNav).toBeVisible();

    const hamburgerButton = screen.queryByLabelText('メニューを開く');
    expect(hamburgerButton).toHaveClass('md:hidden');
  });

  test('should toggle mobile menu correctly', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    });

    render(<Navigation />);

    const hamburgerButton = screen.getByLabelText('メニューを開く');
    const mobileMenu = screen.getByTestId('mobile-menu');

    // Initially closed
    expect(mobileMenu).toHaveClass('hidden');

    // Open menu
    await user.click(hamburgerButton);
    expect(mobileMenu).not.toHaveClass('hidden');

    // Close menu
    await user.click(hamburgerButton);
    expect(mobileMenu).toHaveClass('hidden');
  });
});
```

## 6. Search Form レスポンシブテスト

### テストファイル: `__tests__/components/SearchForm.responsive.test.tsx`

```typescript
describe('SearchForm Responsive Behavior', () => {
  test('should expand to full width on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    });

    render(<SearchForm />);

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveClass('w-full');

    const searchContainer = screen.getByTestId('search-container');
    expect(searchContainer).toHaveClass('w-full', 'px-4');
  });

  test('should show compact filter options on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    });

    render(<SearchForm />);

    // Filter should be in accordion format on mobile
    const filterToggle = screen.getByText('フィルター');
    expect(filterToggle).toBeInTheDocument();

    await user.click(filterToggle);

    const filterOptions = screen.getByTestId('filter-options');
    expect(filterOptions).toBeVisible();
  });

  test('should show inline filters on desktop', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true
    });

    render(<SearchForm />);

    const filterOptions = screen.getByTestId('filter-options');
    expect(filterOptions).not.toHaveClass('hidden');

    // Filters should be inline on desktop
    expect(filterOptions).toHaveClass('flex', 'space-x-4');
  });
});
```

## 7. Performance テスト

### テストファイル: `__tests__/performance/responsive.performance.test.tsx`

```typescript
describe('Responsive Performance Tests', () => {
  test('should render large book list efficiently on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    });

    const largeBookList = Array.from({ length: 100 }, (_, i) => ({
      id: i.toString(),
      title: `Book ${i}`,
      author: `Author ${i}`
    }));

    const startTime = performance.now();
    
    render(<BookList books={largeBookList} />);
    
    // Wait for all books to render
    await waitFor(() => {
      expect(screen.getAllByTestId('book-card')).toHaveLength(100);
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within 2 seconds
    expect(renderTime).toBeLessThan(2000);
  });

  test('should handle window resize events efficiently', () => {
    const { rerender } = render(<BookCard book={mockBook} />);

    const startTime = performance.now();

    // Simulate multiple rapid resize events
    for (let i = 0; i < 100; i++) {
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
    }

    const endTime = performance.now();
    const processTime = endTime - startTime;

    // Should handle resize events within 500ms
    expect(processTime).toBeLessThan(500);
  });
});
```

## 8. Accessibility テスト

### テストファイル: `__tests__/accessibility/responsive.a11y.test.tsx`

```typescript
describe('Responsive Accessibility Tests', () => {
  test('should maintain accessibility on mobile layout', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    });

    render(<BookCard book={mockBook} />);

    const card = screen.getByRole('article');
    
    // Should have proper ARIA labels
    expect(card).toHaveAttribute('aria-label');
    
    // Images should have alt text
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', mockBook.title);

    // Touch targets should be large enough
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      expect(parseInt(styles.height)).toBeGreaterThanOrEqual(44);
    });
  });

  test('should support keyboard navigation on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    });

    render(<Navigation />);

    const hamburgerButton = screen.getByLabelText('メニューを開く');
    
    // Should be focusable
    hamburgerButton.focus();
    expect(hamburgerButton).toHaveFocus();

    // Should open menu with Enter
    await user.keyboard('{Enter}');
    
    const mobileMenu = screen.getByTestId('mobile-menu');
    expect(mobileMenu).not.toHaveClass('hidden');

    // Should be able to navigate menu items
    const menuItems = screen.getAllByRole('link');
    await user.keyboard('{Tab}');
    expect(menuItems[0]).toHaveFocus();
  });
});
```

## 9. E2E テスト (Playwright)

### テストファイル: `tests/e2e/responsive.spec.ts`

```typescript
test.describe('Responsive E2E Tests', () => {
  test.describe('Mobile Viewport', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display mobile layout correctly', async ({ page }) => {
      await page.goto('/library');

      // Check mobile navigation
      await expect(page.getByTestId('hamburger-menu')).toBeVisible();
      await expect(page.getByTestId('desktop-navigation')).toBeHidden();

      // Check mobile book grid
      const bookGrid = page.getByTestId('book-grid');
      await expect(bookGrid).toHaveClass(/grid-cols-1/);
    });

    test('should support touch gestures', async ({ page }) => {
      await page.goto('/library');

      // Test swipe navigation
      await page.touchscreen.tap(200, 300);
      
      const startX = 100;
      const endX = 300;
      
      await page.touchscreen.tap(startX, 300);
      await page.mouse.move(startX, 300);
      await page.mouse.down();
      await page.mouse.move(endX, 300);
      await page.mouse.up();

      // Verify swipe action was recognized
      // (Implementation depends on swipe behavior)
    });
  });

  test.describe('Tablet Viewport', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should display tablet layout correctly', async ({ page }) => {
      await page.goto('/library');

      const bookGrid = page.getByTestId('book-grid');
      await expect(bookGrid).toHaveClass(/sm:grid-cols-2/);
    });
  });

  test.describe('Desktop Viewport', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('should display desktop layout correctly', async ({ page }) => {
      await page.goto('/library');

      // Check desktop navigation
      await expect(page.getByTestId('desktop-navigation')).toBeVisible();
      await expect(page.getByTestId('hamburger-menu')).toBeHidden();

      // Check desktop book grid
      const bookGrid = page.getByTestId('book-grid');
      await expect(bookGrid).toHaveClass(/lg:grid-cols-4/);
    });
  });

  test('should adapt to viewport changes', async ({ page }) => {
    await page.goto('/library');

    // Start desktop
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.getByTestId('desktop-navigation')).toBeVisible();

    // Switch to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId('hamburger-menu')).toBeVisible();
    await expect(page.getByTestId('desktop-navigation')).toBeHidden();
  });
});
```

## テスト実行コマンド

```bash
# 全テストの実行
npm test

# レスポンシブテストのみ実行
npm test -- --testPathPattern=responsive

# パフォーマンステスト
npm run test:performance

# E2Eテスト
npm run test:e2e

# アクセシビリティテスト
npm run test:a11y

# 特定のブレークポイントでテスト
npm test -- --testTimeout=10000
```

## カバレッジ要件

- **単体テスト**: Hook とユーティリティ関数 100%
- **コンポーネントテスト**: UI コンポーネント 90%以上
- **統合テスト**: レスポンシブフロー 85%以上
- **E2Eテスト**: 主要ユーザーフロー 100%

## テスト品質基準

1. **レスポンシブ対応**: 全ブレークポイントでの動作確認
2. **パフォーマンス**: 指定時間内でのレンダリング
3. **アクセシビリティ**: WCAG 2.1 AA準拠
4. **タッチ操作**: 全ジェスチャーの正常動作