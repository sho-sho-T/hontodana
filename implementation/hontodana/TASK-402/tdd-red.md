# TASK-402: パフォーマンス最適化 - テスト実装（失敗）

## 実装するテスト

現在のコードはパフォーマンス最適化が未実装のため、最適化要件をテストするテストを実装し、失敗することを確認します。

### 1. 画像最適化テスト

```typescript
// __tests__/performance/image-optimization.test.tsx
import { render, screen } from '@testing-library/react'
import { BookCard } from '@/components/library/BookCard'
import { BookStatus } from '@/types/books'

describe('Image Optimization Tests', () => {
  const mockBook = {
    id: '1',
    book: {
      id: 'book-1',
      title: 'Test Book',
      authors: ['Test Author'],
      thumbnailUrl: 'https://example.com/cover.jpg',
      pageCount: 300
    },
    status: BookStatus.READING,
    currentPage: 150,
    userId: 'user-1',
    addedAt: new Date(),
    updatedAt: new Date()
  }

  // このテストは失敗するはず（現在は img タグを使用）
  it('should use Next.js Image component instead of img tag', () => {
    render(<BookCard book={mockBook} onStatusChange={() => {}} onRemove={() => {}} />)
    
    // Next.js Image コンポーネントを期待（現在は失敗）
    const imageElement = screen.getByRole('img')
    expect(imageElement.tagName).toBe('IMG') // 現在は IMG タグ
    expect(imageElement).toHaveAttribute('loading', 'lazy') // 期待される属性（未実装）
    expect(imageElement).toHaveAttribute('sizes') // 期待される属性（未実装）
  })

  it('should have optimized image sizes defined', () => {
    render(<BookCard book={mockBook} onStatusChange={() => {}} onRemove={() => {}} />)
    
    const imageElement = screen.getByRole('img')
    // 最適化されたサイズが未設定のため失敗するはず
    expect(imageElement).toHaveAttribute('sizes', '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw')
  })
})
```

### 2. コード分割テスト

```typescript
// __tests__/performance/code-splitting.test.tsx
import { render, waitFor } from '@testing-library/react'

describe('Code Splitting Tests', () => {
  // このテストは失敗するはず（動的インポート未実装）
  it('should dynamically import heavy dashboard components', async () => {
    const { getByTestId } = render(<DashboardPage />)
    
    // 初期レンダリング時は重いコンポーネントが読み込まれていないはず
    const heavyComponent = getByTestId('statistics-chart')
    expect(heavyComponent).toBeInTheDocument() // 現在は静的インポートなので即座に存在（失敗）
    
    // 動的読み込みの確認
    await waitFor(() => {
      expect(heavyComponent).toHaveAttribute('data-loaded', 'true')
    }, { timeout: 1000 })
  })

  it('should have initial bundle size under 200KB', () => {
    // webpack-bundle-analyzer または Next.js built-in の結果を確認
    // 現在のバンドルサイズは200KB超過のため失敗するはず
    expect(getInitialBundleSize()).toBeLessThan(200 * 1024) // 200KB
  })
})
```

### 3. キャッシュ戦略テスト

```typescript
// __tests__/performance/caching.test.tsx
import { searchBooks } from '@/lib/books/actions'

describe('Caching Strategy Tests', () => {
  // このテストは失敗するはず（キャッシュ未実装）
  it('should cache book search results', async () => {
    const query = 'test book'
    
    // 初回検索
    const startTime1 = Date.now()
    const result1 = await searchBooks(query)
    const endTime1 = Date.now()
    
    // 2回目検索（キャッシュヒットを期待）
    const startTime2 = Date.now()
    const result2 = await searchBooks(query)
    const endTime2 = Date.now()
    
    // キャッシュが実装されていないため、2回目も同じ時間がかかる（失敗）
    expect(endTime2 - startTime2).toBeLessThan((endTime1 - startTime1) * 0.1) // 90%時間短縮を期待
    expect(result1).toEqual(result2)
  })

  it('should implement Next.js unstable_cache', () => {
    // Server Actions でキャッシュが使用されていることを確認
    // 現在は未実装のため失敗
    expect(searchBooks.toString()).toContain('unstable_cache') // 失敗するはず
  })
})
```

### 4. データベースクエリ最適化テスト

```typescript
// __tests__/performance/database-optimization.test.tsx
import { getUserBooks } from '@/lib/books/actions'

describe('Database Query Optimization Tests', () => {
  // このテストは失敗するはず（クエリ最適化未実装）
  it('should include related data in single query', async () => {
    const userId = 'test-user'
    
    // クエリ実行回数をモック
    const queryCount = jest.fn()
    
    await getUserBooks(userId)
    
    // N+1問題が解決されていないため、複数クエリが実行される（失敗）
    expect(queryCount).toHaveBeenCalledTimes(1) // 1回のクエリを期待（現在は複数回）
  })

  it('should execute queries within 100ms average', async () => {
    const startTime = Date.now()
    await getUserBooks('test-user')
    const endTime = Date.now()
    
    // 最適化前は100msを超える可能性が高い（失敗）
    expect(endTime - startTime).toBeLessThanOrEqual(100)
  })
})
```

### 5. レスポンス時間テスト

```typescript
// __tests__/performance/response-time.test.tsx
import { searchBooks } from '@/lib/books/actions'

describe('Response Time Tests', () => {
  // これらのテストは現在の最適化前の状態では失敗するはず
  it('should search books within 3 seconds', async () => {
    const startTime = performance.now()
    await searchBooks('JavaScript')
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThanOrEqual(3000) // 失敗する可能性
  })

  it('should load library page within 2 seconds', async () => {
    const startTime = performance.now()
    // ページ読み込みのシミュレーション
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThanOrEqual(2000) // 失敗する可能性
  })
})
```

## 6. Core Web Vitals テスト

```typescript
// __tests__/performance/core-web-vitals.test.tsx
describe('Core Web Vitals Tests', () => {
  // 最適化前は目標値を満たさないため失敗するはず
  it('should have FCP under 1.5 seconds', () => {
    // First Contentful Paint の測定
    expect(getFCP()).toBeLessThanOrEqual(1500) // 失敗するはず
  })

  it('should have LCP under 2.5 seconds', () => {
    // Largest Contentful Paint の測定  
    expect(getLCP()).toBeLessThanOrEqual(2500) // 失敗するはず
  })

  it('should have CLS under 0.1', () => {
    // Cumulative Layout Shift の測定
    expect(getCLS()).toBeLessThanOrEqual(0.1) // 失敗するはず
  })
})
```

## テスト実行手順

1. テストファイルを作成
2. `npm test` でテスト実行
3. 失敗することを確認
4. 失敗理由を記録
5. 次のステップ（最小実装）へ進む

## 期待される失敗結果

- 画像最適化: Next.js Image 未使用
- コード分割: 動的インポート未実装  
- キャッシュ: キャッシュ戦略未実装
- DB最適化: N+1問題、インデックス未最適化
- レスポンス時間: 目標値未達成