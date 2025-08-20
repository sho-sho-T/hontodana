# TASK-201: 検索・フィルタリング機能 - テストケース

## 単体テストケース

### 1. 検索クエリ生成テスト (`lib/search/searchQuery.test.ts`)

#### TC-01: 基本的な検索クエリ生成
```typescript
describe('buildSearchQuery', () => {
  test('単一キーワードでのクエリ生成', () => {
    const result = buildSearchQuery('JavaScript');
    expect(result.query).toContain("to_tsquery('japanese', $1)");
    expect(result.params).toEqual(['JavaScript:*']);
  });

  test('複数キーワードでのAND検索', () => {
    const result = buildSearchQuery('JavaScript React');
    expect(result.params).toEqual(['JavaScript:* & React:*']);
  });

  test('特殊文字のエスケープ処理', () => {
    const result = buildSearchQuery('C++ & Java');
    expect(result.params[0]).not.toContain('&');
  });
});
```

#### TC-02: フィルタ条件の組み合わせテスト
```typescript
describe('buildFilterConditions', () => {
  test('読書状態フィルタ', () => {
    const filters = { status: 'reading' as const };
    const result = buildFilterConditions(filters);
    expect(result.conditions).toContain('status = $');
    expect(result.params).toContain('reading');
  });

  test('複数フィルタの組み合わせ', () => {
    const filters = {
      status: 'completed' as const,
      categories: ['技術書', '小説'],
      registeredAfter: '2024-01-01'
    };
    const result = buildFilterConditions(filters);
    expect(result.conditions.length).toBe(3);
  });
});
```

### 2. 検索履歴管理テスト (`lib/search/searchHistory.test.ts`)

#### TC-03: 検索履歴の保存・取得
```typescript
describe('SearchHistory', () => {
  test('検索履歴の保存', () => {
    const history = new SearchHistory();
    history.add('JavaScript');
    expect(history.getAll()).toContain('JavaScript');
  });

  test('重複検索語の処理', () => {
    const history = new SearchHistory();
    history.add('JavaScript');
    history.add('JavaScript');
    expect(history.getAll().filter(h => h === 'JavaScript')).toHaveLength(1);
  });

  test('検索履歴の上限管理', () => {
    const history = new SearchHistory();
    for (let i = 0; i < 15; i++) {
      history.add(`keyword${i}`);
    }
    expect(history.getAll()).toHaveLength(10);
  });
});
```

### 3. テキストハイライト機能テスト (`components/search/HighlightedText.test.tsx`)

#### TC-04: ハイライト表示テスト
```typescript
describe('HighlightedText', () => {
  test('単一キーワードのハイライト', () => {
    render(
      <HighlightedText text="JavaScript入門" highlight="JavaScript" />
    );
    expect(screen.getByRole('mark')).toHaveTextContent('JavaScript');
  });

  test('複数キーワードのハイライト', () => {
    render(
      <HighlightedText 
        text="JavaScript と React の入門書" 
        highlight="JavaScript React" 
      />
    );
    expect(screen.getAllByRole('mark')).toHaveLength(2);
  });

  test('大文字小文字を無視したハイライト', () => {
    render(
      <HighlightedText text="javascript" highlight="JavaScript" />
    );
    expect(screen.getByRole('mark')).toBeInTheDocument();
  });
});
```

## コンポーネントテストケース

### 4. 検索フォームコンポーネントテスト (`components/search/SearchForm.test.tsx`)

#### TC-05: 基本的な検索機能テスト
```typescript
describe('SearchForm', () => {
  test('検索キーワード入力', async () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('書籍を検索...');
    await userEvent.type(input, 'JavaScript');
    await userEvent.click(screen.getByRole('button', { name: '検索' }));
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'JavaScript',
      filters: {}
    });
  });

  test('フィルタ条件の設定', async () => {
    const mockOnSearch = jest.fn();
    render(<SearchForm onSearch={mockOnSearch} />);
    
    // 読書状態フィルタを設定
    await userEvent.selectOptions(
      screen.getByLabelText('読書状態'),
      'reading'
    );
    await userEvent.click(screen.getByRole('button', { name: '検索' }));
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: '',
      filters: { status: 'reading' }
    });
  });
});
```

#### TC-06: フィルタパネルテスト
```typescript
describe('FilterPanel', () => {
  test('フィルタ条件のクリア', async () => {
    const mockOnFilterChange = jest.fn();
    render(<FilterPanel onFilterChange={mockOnFilterChange} />);
    
    // フィルタを設定
    await userEvent.selectOptions(
      screen.getByLabelText('読書状態'),
      'reading'
    );
    
    // クリアボタンをクリック
    await userEvent.click(screen.getByRole('button', { name: 'クリア' }));
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });
});
```

### 5. 検索結果表示テスト (`components/search/SearchResults.test.tsx`)

#### TC-07: 検索結果の表示
```typescript
describe('SearchResults', () => {
  test('検索結果の正常表示', () => {
    const mockBooks = [
      {
        id: '1',
        title: 'JavaScript入門',
        authors: ['山田太郎'],
        thumbnail: 'thumb1.jpg',
        status: 'reading' as const
      }
    ];

    render(
      <SearchResults 
        books={mockBooks}
        isLoading={false}
        query="JavaScript"
      />
    );

    expect(screen.getByText('JavaScript入門')).toBeInTheDocument();
    expect(screen.getByText('山田太郎')).toBeInTheDocument();
  });

  test('ローディング状態の表示', () => {
    render(<SearchResults books={[]} isLoading={true} />);
    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
  });

  test('検索結果0件の表示', () => {
    render(
      <SearchResults 
        books={[]} 
        isLoading={false} 
        query="存在しない書籍"
      />
    );
    expect(screen.getByText(/検索結果が見つかりませんでした/)).toBeInTheDocument();
  });
});
```

## 統合テストケース

### 6. 検索APIテスト (`__tests__/api/books/search.test.ts`)

#### TC-08: API エンドポイントテスト
```typescript
describe('/api/books/search', () => {
  test('基本的な検索機能', async () => {
    const response = await request(app)
      .get('/api/books/search')
      .query({ query: 'JavaScript' })
      .expect(200);

    expect(response.body.books).toBeDefined();
    expect(response.body.total).toBeGreaterThanOrEqual(0);
    expect(response.body.page).toBe(1);
  });

  test('フィルタ条件での検索', async () => {
    const response = await request(app)
      .get('/api/books/search')
      .query({ 
        query: 'JavaScript',
        status: 'reading'
      })
      .expect(200);

    response.body.books.forEach((book: any) => {
      expect(book.status).toBe('reading');
    });
  });

  test('ページネーション機能', async () => {
    const response = await request(app)
      .get('/api/books/search')
      .query({ 
        page: 2,
        limit: 5
      })
      .expect(200);

    expect(response.body.books.length).toBeLessThanOrEqual(5);
    expect(response.body.page).toBe(2);
  });
});
```

### 7. データベース検索テスト (`__tests__/lib/search/database.test.ts`)

#### TC-09: PostgreSQL全文検索テスト
```typescript
describe('Database Search', () => {
  test('日本語タイトルの検索', async () => {
    const results = await searchBooks({
      query: 'プログラミング',
      userId: 'test-user'
    });

    expect(results.books.length).toBeGreaterThan(0);
    results.books.forEach(book => {
      expect(book.title.toLowerCase()).toContain('プログラミング');
    });
  });

  test('著者名での検索', async () => {
    const results = await searchBooks({
      query: '山田太郎',
      userId: 'test-user'
    });

    results.books.forEach(book => {
      expect(book.authors.join(' ')).toContain('山田太郎');
    });
  });

  test('複合条件での検索', async () => {
    const results = await searchBooks({
      query: 'JavaScript',
      filters: {
        status: 'reading',
        categories: ['技術書']
      },
      userId: 'test-user'
    });

    results.books.forEach(book => {
      expect(book.status).toBe('reading');
      expect(book.categories).toContain('技術書');
    });
  });
});
```

## パフォーマンステストケース

### 8. 検索性能テスト (`__tests__/performance/search.test.ts`)

#### TC-10: レスポンス時間テスト
```typescript
describe('Search Performance', () => {
  test('検索応答時間が3秒以内', async () => {
    const startTime = Date.now();
    
    await searchBooks({
      query: 'JavaScript',
      userId: 'test-user'
    });
    
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(3000);
  });

  test('大量データでの検索性能', async () => {
    // 1000件のテストデータを作成
    await createTestBooks(1000);
    
    const startTime = Date.now();
    const results = await searchBooks({
      query: 'test',
      userId: 'test-user'
    });
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(3000);
    expect(results.books.length).toBeGreaterThan(0);
  });
});
```

### 9. 同時検索処理テスト (`__tests__/performance/concurrent.test.ts`)

#### TC-11: 同時リクエスト処理テスト
```typescript
describe('Concurrent Search', () => {
  test('100件の同時検索処理', async () => {
    const searchPromises = Array.from({ length: 100 }, (_, i) =>
      searchBooks({
        query: `test-${i}`,
        userId: `user-${i}`
      })
    );

    const results = await Promise.all(searchPromises);
    
    // すべてのリクエストが正常に完了することを確認
    expect(results).toHaveLength(100);
    results.forEach(result => {
      expect(result.books).toBeDefined();
    });
  });
});
```

## E2Eテストケース

### 10. 検索フロー全体テスト (`e2e/search.spec.ts`)

#### TC-12: 完全な検索フローテスト
```typescript
describe('Search Flow E2E', () => {
  test('検索から結果表示までの完全フロー', async ({ page }) => {
    await page.goto('/library');
    
    // 検索フォームに入力
    await page.fill('[data-testid="search-input"]', 'JavaScript');
    
    // 検索実行
    await page.click('[data-testid="search-button"]');
    
    // ローディング状態の確認
    await expect(page.locator('[data-testid="search-loading"]')).toBeVisible();
    
    // 検索結果の表示確認
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // 検索キーワードのハイライト確認
    await expect(page.locator('mark')).toContainText('JavaScript');
  });

  test('フィルタリング機能のテスト', async ({ page }) => {
    await page.goto('/library');
    
    // フィルタパネルを開く
    await page.click('[data-testid="filter-toggle"]');
    
    // 読書状態フィルタを設定
    await page.selectOption('[data-testid="status-filter"]', 'reading');
    
    // 検索実行
    await page.click('[data-testid="search-button"]');
    
    // 結果が読書中の書籍のみであることを確認
    const bookCards = page.locator('[data-testid="book-card"]');
    await expect(bookCards.first()).toBeVisible();
    
    for (const card of await bookCards.all()) {
      await expect(card.locator('[data-testid="book-status"]')).toHaveText('読書中');
    }
  });
});
```

## エラーハンドリングテストケース

### 11. エラー処理テスト (`__tests__/error/search.test.ts`)

#### TC-13: エラー処理テスト
```typescript
describe('Search Error Handling', () => {
  test('データベース接続エラー', async () => {
    // データベース接続を切断
    await prisma.$disconnect();
    
    const result = await searchBooks({
      query: 'JavaScript',
      userId: 'test-user'
    });
    
    expect(result.error).toBeDefined();
    expect(result.error.code).toBe('DATABASE_ERROR');
  });

  test('不正な検索パラメータ', async () => {
    const response = await request(app)
      .get('/api/books/search')
      .query({ 
        page: -1,  // 不正な値
        limit: 1000  // 上限超過
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  test('SQLインジェクション対策', async () => {
    const maliciousQuery = "'; DROP TABLE books; --";
    
    const response = await request(app)
      .get('/api/books/search')
      .query({ query: maliciousQuery })
      .expect(200);  // エラーではなく、安全に処理される

    // テーブルが削除されていないことを確認
    const books = await prisma.book.findMany();
    expect(books).toBeDefined();
  });
});
```

## アクセシビリティテストケース

### 12. アクセシビリティテスト (`__tests__/accessibility/search.test.ts`)

#### TC-14: アクセシビリティテスト
```typescript
describe('Search Accessibility', () => {
  test('キーボード操作での検索', async ({ page }) => {
    await page.goto('/library');
    
    // Tab キーで検索フォームにフォーカス
    await page.keyboard.press('Tab');
    
    // 検索キーワード入力
    await page.keyboard.type('JavaScript');
    
    // Enter キーで検索実行
    await page.keyboard.press('Enter');
    
    // 検索結果が表示されることを確認
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('ARIA属性の設定確認', () => {
    render(<SearchForm onSearch={() => {}} />);
    
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveAttribute('aria-label', '書籍検索');
    
    const filterPanel = screen.getByRole('region');
    expect(filterPanel).toHaveAttribute('aria-label', '検索フィルタ');
  });

  test('スクリーンリーダー対応', async ({ page }) => {
    await page.goto('/library');
    
    // 検索実行
    await page.fill('[data-testid="search-input"]', 'JavaScript');
    await page.click('[data-testid="search-button"]');
    
    // 検索結果の読み上げテキスト確認
    const resultsAnnouncement = page.locator('[aria-live="polite"]');
    await expect(resultsAnnouncement).toContainText('件の検索結果が見つかりました');
  });
});
```

## テストデータ準備

### テストデータベース設定
```sql
-- テスト用書籍データ
INSERT INTO books (id, title, authors, description, status, categories, user_id) VALUES
('test-1', 'JavaScript 入門書', ARRAY['山田太郎'], 'JavaScript の基礎を学ぶ', 'reading', ARRAY['技術書'], 'test-user'),
('test-2', 'React 実践ガイド', ARRAY['田中花子'], 'React を使った実践的な開発', 'completed', ARRAY['技術書'], 'test-user'),
('test-3', 'TypeScript ハンドブック', ARRAY['佐藤次郎'], 'TypeScript の詳細な解説', 'unread', ARRAY['技術書'], 'test-user'),
('test-4', '小説「夏の終わり」', ARRAY['小説家三郎'], '夏をテーマにした感動作品', 'reading', ARRAY['小説'], 'test-user');

-- 全文検索インデックス作成
CREATE INDEX IF NOT EXISTS books_search_test_idx ON books 
USING GIN(to_tsvector('japanese', title || ' ' || array_to_string(authors, ' ') || ' ' || COALESCE(description, '')));
```

## テスト実行コマンド

```bash
# 全テスト実行
npm test

# 単体テストのみ
npm run test:unit

# 統合テストのみ
npm run test:integration

# E2Eテストのみ
npm run test:e2e

# パフォーマンステストのみ
npm run test:performance

# テストカバレッジ確認
npm run test:coverage

# 特定のテストファイル実行
npm test -- search.test.ts
```