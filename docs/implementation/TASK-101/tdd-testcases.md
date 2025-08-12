# TASK-101: 書籍検索API実装 - テストケース定義

## 単体テスト

### 1. 検索パラメータのバリデーション
```typescript
describe('searchParams validation', () => {
  test('有効なパラメータで成功', () => {
    const params = { q: 'JavaScript' }
    expect(validateSearchParams(params)).toBeTruthy()
  })
  
  test('空のクエリでエラー', () => {
    const params = { q: '' }
    expect(() => validateSearchParams(params)).toThrow('検索クエリが必要です')
  })
  
  test('最大件数超過でエラー', () => {
    const params = { q: 'test', maxResults: 50 }
    expect(() => validateSearchParams(params)).toThrow('最大40件まで指定できます')
  })
  
  test('負の値でエラー', () => {
    const params = { q: 'test', maxResults: -1 }
    expect(() => validateSearchParams(params)).toThrow('正の値を指定してください')
  })
  
  test('デフォルト値が適用される', () => {
    const params = { q: 'test' }
    const validated = validateSearchParams(params)
    expect(validated.maxResults).toBe(10)
    expect(validated.startIndex).toBe(0)
    expect(validated.langRestrict).toBe('ja')
  })
})
```

### 2. Google Books APIレスポンス正規化
```typescript
describe('normalizeGoogleBooksResponse', () => {
  test('正常なレスポンスの変換', () => {
    const googleResponse = {
      totalItems: 100,
      items: [{
        id: 'book1',
        volumeInfo: {
          title: 'Test Book',
          authors: ['Author 1', 'Author 2'],
          publisher: 'Test Publisher',
          publishedDate: '2023-01-01',
          description: 'Test description',
          pageCount: 200,
          categories: ['Technology'],
          averageRating: 4.5,
          ratingsCount: 10,
          imageLinks: {
            thumbnail: 'http://example.com/thumb.jpg'
          },
          language: 'ja',
          industryIdentifiers: [
            { type: 'ISBN_10', identifier: '1234567890' },
            { type: 'ISBN_13', identifier: '9781234567890' }
          ]
        }
      }]
    }
    
    const normalized = normalizeGoogleBooksResponse(googleResponse, 10, 0)
    
    expect(normalized.totalItems).toBe(100)
    expect(normalized.hasMore).toBe(true)
    expect(normalized.items).toHaveLength(1)
    expect(normalized.items[0]).toEqual({
      id: 'book1',
      title: 'Test Book',
      authors: ['Author 1', 'Author 2'],
      publisher: 'Test Publisher',
      publishedDate: '2023-01-01',
      description: 'Test description',
      pageCount: 200,
      categories: ['Technology'],
      averageRating: 4.5,
      ratingsCount: 10,
      imageLinks: {
        thumbnail: 'http://example.com/thumb.jpg'
      },
      language: 'ja',
      isbn: {
        isbn10: '1234567890',
        isbn13: '9781234567890'
      }
    })
  })
  
  test('不完全なデータの処理', () => {
    const googleResponse = {
      totalItems: 1,
      items: [{
        id: 'book1',
        volumeInfo: {
          title: 'Minimal Book'
        }
      }]
    }
    
    const normalized = normalizeGoogleBooksResponse(googleResponse, 10, 0)
    
    expect(normalized.items[0].title).toBe('Minimal Book')
    expect(normalized.items[0].authors).toBeUndefined()
    expect(normalized.items[0].isbn).toBeUndefined()
  })
})
```

### 3. レート制限・再試行ロジック
```typescript
describe('retryWithBackoff', () => {
  test('成功時は再試行しない', async () => {
    const mockFn = jest.fn().mockResolvedValue('success')
    const result = await retryWithBackoff(mockFn, 3)
    
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
  
  test('429エラー時は再試行', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('429'))
      .mockRejectedValueOnce(new Error('429'))
      .mockResolvedValue('success')
    
    const result = await retryWithBackoff(mockFn, 3)
    
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })
  
  test('最大回数後も失敗時はエラー', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('429'))
    
    await expect(retryWithBackoff(mockFn, 3)).rejects.toThrow('429')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })
})
```

## 統合テスト

### 4. Google Books API連携
```typescript
describe('Google Books API Integration', () => {
  test('実際のAPIとの連携テスト', async () => {
    const client = new GoogleBooksClient()
    const result = await client.searchBooks({
      q: 'JavaScript',
      maxResults: 5
    })
    
    expect(result.items).toBeDefined()
    expect(result.items.length).toBeGreaterThan(0)
    expect(result.items[0].title).toBeDefined()
  })
  
  test('存在しない書籍での検索', async () => {
    const client = new GoogleBooksClient()
    const result = await client.searchBooks({
      q: 'nonexistentbook12345',
      maxResults: 5
    })
    
    expect(result.totalItems).toBe(0)
    expect(result.items).toHaveLength(0)
  })
})
```

## E2Eテスト

### 5. APIエンドポイント
```typescript
describe('/api/books/search', () => {
  test('認証済みユーザーで検索成功', async () => {
    const response = await request(app)
      .get('/api/books/search')
      .query({ q: 'JavaScript' })
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)
    
    expect(response.body.items).toBeDefined()
    expect(response.body.totalItems).toBeGreaterThan(0)
  })
  
  test('未認証ユーザーは401エラー', async () => {
    await request(app)
      .get('/api/books/search')
      .query({ q: 'JavaScript' })
      .expect(401)
  })
  
  test('不正なパラメータで400エラー', async () => {
    const response = await request(app)
      .get('/api/books/search')
      .query({ q: '', maxResults: 50 })
      .set('Authorization', `Bearer ${validToken}`)
      .expect(400)
    
    expect(response.body.error).toContain('バリデーション')
  })
  
  test('ページネーションの動作', async () => {
    const page1 = await request(app)
      .get('/api/books/search')
      .query({ q: 'プログラミング', maxResults: 5, startIndex: 0 })
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)
    
    const page2 = await request(app)
      .get('/api/books/search')
      .query({ q: 'プログラミング', maxResults: 5, startIndex: 5 })
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)
    
    expect(page1.body.items[0].id).not.toBe(page2.body.items[0].id)
  })
})
```

## エラーハンドリングテスト

### 6. ネットワーク・API エラー
```typescript
describe('Error Handling', () => {
  test('Google Books API ダウン時の処理', async () => {
    // Google Books APIをモック化してエラーを発生させる
    jest.spyOn(fetch, 'fetch').mockRejectedValue(new Error('Network Error'))
    
    const response = await request(app)
      .get('/api/books/search')
      .query({ q: 'JavaScript' })
      .set('Authorization', `Bearer ${validToken}`)
      .expect(503)
    
    expect(response.body.error).toContain('サービス利用不可')
  })
  
  test('タイムアウト時の処理', async () => {
    jest.spyOn(fetch, 'fetch').mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 15000))
    )
    
    const response = await request(app)
      .get('/api/books/search')
      .query({ q: 'JavaScript' })
      .set('Authorization', `Bearer ${validToken}`)
      .expect(503)
    
    expect(response.body.error).toContain('タイムアウト')
  })
})
```

## パフォーマンステスト

### 7. レスポンス時間
```typescript
describe('Performance', () => {
  test('レスポンス時間が3秒以内', async () => {
    const startTime = Date.now()
    
    await request(app)
      .get('/api/books/search')
      .query({ q: 'JavaScript' })
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)
    
    const responseTime = Date.now() - startTime
    expect(responseTime).toBeLessThan(3000)
  })
  
  test('大量データ検索のパフォーマンス', async () => {
    const startTime = Date.now()
    
    await request(app)
      .get('/api/books/search')
      .query({ q: 'programming', maxResults: 40 })
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)
    
    const responseTime = Date.now() - startTime
    expect(responseTime).toBeLessThan(5000)
  })
})
```

## モックデータ

### テスト用Google Books APIレスポンス
```javascript
export const mockGoogleBooksResponse = {
  kind: "books#volumes",
  totalItems: 1000,
  items: [
    {
      kind: "books#volume",
      id: "test-book-id",
      etag: "test-etag",
      selfLink: "https://www.googleapis.com/books/v1/volumes/test-book-id",
      volumeInfo: {
        title: "JavaScript: The Good Parts",
        authors: ["Douglas Crockford"],
        publisher: "O'Reilly Media",
        publishedDate: "2008-05-08",
        description: "Most programming languages contain good and bad parts...",
        industryIdentifiers: [
          { type: "ISBN_10", identifier: "0596517742" },
          { type: "ISBN_13", identifier: "9780596517748" }
        ],
        readingModes: { text: false, image: true },
        pageCount: 176,
        printType: "BOOK",
        categories: ["Computers"],
        averageRating: 4,
        ratingsCount: 85,
        maturityRating: "NOT_MATURE",
        allowAnonLogging: true,
        contentVersion: "0.6.6.0.preview.1",
        panelizationSummary: { containsEpubBubbles: false, containsImageBubbles: false },
        imageLinks: {
          smallThumbnail: "http://books.google.com/books/content?id=test&printsec=frontcover&img=1&zoom=5&source=gbs_api",
          thumbnail: "http://books.google.com/books/content?id=test&printsec=frontcover&img=1&zoom=1&source=gbs_api"
        },
        language: "en",
        previewLink: "http://books.google.co.jp/books?id=test&dq=javascript&hl=&source=gbs_api",
        infoLink: "https://play.google.com/store/books/details?id=test",
        canonicalVolumeLink: "https://play.google.com/store/books/details?id=test"
      }
    }
  ]
}
```

## テスト実行計画
1. 単体テスト: 各関数の正常系・異常系
2. 統合テスト: Google Books API連携
3. E2Eテスト: APIエンドポイント全体
4. エラーハンドリング: ネットワークエラー、API エラー
5. パフォーマンステスト: レスポンス時間

## カバレッジ目標
- 行カバレッジ: 90%以上
- 分岐カバレッジ: 85%以上
- 関数カバレッジ: 100%