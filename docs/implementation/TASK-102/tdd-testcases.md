# TASK-102: 書籍データモデルとServer Actions - テストケース

## 単体テスト: データ正規化 (`book-normalizer.test.ts`)

### normalizeBookData関数

#### 正常系テスト
```typescript
describe('normalizeBookData', () => {
  test('完全なGoogle Books APIデータを正しく正規化する', () => {
    const googleBookData = {
      id: 'test-google-id',
      volumeInfo: {
        title: 'テスト書籍',
        authors: ['著者1', '著者2'],
        publisher: 'テスト出版社',
        publishedDate: '2023-12-01',
        description: '書籍の説明文',
        pageCount: 300,
        categories: ['Fiction', 'Mystery'],
        imageLinks: {
          thumbnail: 'http://example.com/thumbnail.jpg'
        },
        industryIdentifiers: [
          { type: 'ISBN_13', identifier: '9784123456789' },
          { type: 'ISBN_10', identifier: '4123456789' }
        ],
        language: 'ja'
      }
    }
    
    const result = normalizeBookData(googleBookData, 'user123', BookStatus.WANT_TO_READ)
    
    expect(result).toEqual({
      googleBooksId: 'test-google-id',
      title: 'テスト書籍',
      authors: ['著者1', '著者2'],
      publisher: 'テスト出版社',
      publishedDate: '2023-12-01',
      description: '書籍の説明文',
      pageCount: 300,
      categories: ['Fiction', 'Mystery'],
      thumbnail: 'https://example.com/thumbnail.jpg',
      isbn: '9784123456789',
      language: 'ja',
      status: BookStatus.WANT_TO_READ,
      userId: 'user123'
    })
  })

  test('最小データでも正規化できる', () => {
    const googleBookData = {
      id: 'minimal-id',
      volumeInfo: {
        title: 'ミニマル書籍'
      }
    }
    
    const result = normalizeBookData(googleBookData, 'user123', BookStatus.READING)
    
    expect(result).toEqual({
      googleBooksId: 'minimal-id',
      title: 'ミニマル書籍',
      authors: [],
      publisher: undefined,
      publishedDate: undefined,
      description: undefined,
      pageCount: undefined,
      categories: [],
      thumbnail: undefined,
      isbn: undefined,
      language: 'ja', // デフォルト値
      status: BookStatus.READING,
      userId: 'user123'
    })
  })

  test('ISBN_13を優先してISBN_10より選択する', () => {
    const googleBookData = {
      id: 'test-isbn-priority',
      volumeInfo: {
        title: 'ISBN優先テスト',
        industryIdentifiers: [
          { type: 'ISBN_10', identifier: '4123456789' },
          { type: 'ISBN_13', identifier: '9784123456789' }
        ]
      }
    }
    
    const result = normalizeBookData(googleBookData, 'user123', BookStatus.WANT_TO_READ)
    
    expect(result.isbn).toBe('9784123456789')
  })
```

#### 異常系・境界値テスト
```typescript
  test('HTTPサムネイルをHTTPSに変換する', () => {
    const googleBookData = {
      id: 'http-thumbnail-test',
      volumeInfo: {
        title: 'HTTPサムネイルテスト',
        imageLinks: {
          thumbnail: 'http://insecure.example.com/thumbnail.jpg'
        }
      }
    }
    
    const result = normalizeBookData(googleBookData, 'user123', BookStatus.WANT_TO_READ)
    
    expect(result.thumbnail).toBe('https://insecure.example.com/thumbnail.jpg')
  })

  test('長い文字列データを適切に切り詰める', () => {
    const longTitle = 'a'.repeat(600)
    const longDescription = 'b'.repeat(12000)
    
    const googleBookData = {
      id: 'long-data-test',
      volumeInfo: {
        title: longTitle,
        description: longDescription
      }
    }
    
    const result = normalizeBookData(googleBookData, 'user123', BookStatus.WANT_TO_READ)
    
    expect(result.title).toHaveLength(500)
    expect(result.description).toHaveLength(10000)
  })

  test('HTMLタグを除去する', () => {
    const googleBookData = {
      id: 'html-test',
      volumeInfo: {
        title: '<script>alert("xss")</script>危険なタイトル',
        description: '<p>段落タグ付き説明文</p><script>悪意のあるスクリプト</script>'
      }
    }
    
    const result = normalizeBookData(googleBookData, 'user123', BookStatus.WANT_TO_READ)
    
    expect(result.title).toBe('危険なタイトル')
    expect(result.description).toBe('段落タグ付き説明文')
  })
```

## 単体テスト: バリデーション (`book-validation.test.ts`)

### validateBookData関数
```typescript
describe('validateBookData', () => {
  test('有効な書籍データを通す', () => {
    const validBook = {
      googleBooksId: 'valid-id',
      title: '有効な書籍',
      authors: ['著者1'],
      publisher: '出版社',
      isbn: '9784123456789',
      pageCount: 300,
      categories: ['Fiction'],
      language: 'ja',
      status: BookStatus.WANT_TO_READ,
      userId: 'user123'
    }
    
    expect(() => validateBookData(validBook)).not.toThrow()
  })

  test('不正なISBN形式でエラー', () => {
    const invalidBook = {
      title: '書籍',
      isbn: 'invalid-isbn',
      status: BookStatus.WANT_TO_READ,
      userId: 'user123'
    }
    
    expect(() => validateBookData(invalidBook)).toThrow('Invalid ISBN format')
  })

  test('ページ数が範囲外でエラー', () => {
    const invalidBook = {
      title: '書籍',
      pageCount: 15000,
      status: BookStatus.WANT_TO_READ,
      userId: 'user123'
    }
    
    expect(() => validateBookData(invalidBook)).toThrow('Page count must be between 1 and 10000')
  })
```

## 統合テスト: Server Actions (`books.test.ts`)

### addBookToLibrary関数

#### 正常系テスト
```typescript
describe('addBookToLibrary', () => {
  beforeEach(async () => {
    // テスト用データベースのクリーンアップ
    await prisma.book.deleteMany()
    // モックユーザーセッション設定
    mockAuth({ user: { id: 'test-user' } })
  })

  test('新しい書籍を正常にライブラリに追加できる', async () => {
    const googleBookData = {
      id: 'new-book-id',
      volumeInfo: {
        title: '新しい書籍',
        authors: ['新作者'],
        publisher: '新出版社'
      }
    }
    
    const result = await addBookToLibrary(googleBookData, BookStatus.WANT_TO_READ)
    
    expect(result).not.toHaveProperty('error')
    expect(result.title).toBe('新しい書籍')
    expect(result.status).toBe(BookStatus.WANT_TO_READ)
    expect(result.userId).toBe('test-user')
    
    // データベースに保存されているかチェック
    const saved = await prisma.book.findUnique({
      where: { id: result.id }
    })
    expect(saved).toBeTruthy()
  })

  test('デフォルトステータスWANT_TO_READで追加される', async () => {
    const googleBookData = {
      id: 'default-status-test',
      volumeInfo: { title: 'デフォルトステータステスト' }
    }
    
    const result = await addBookToLibrary(googleBookData)
    
    expect(result.status).toBe(BookStatus.WANT_TO_READ)
  })
```

#### 異常系テスト
```typescript
  test('未認証ユーザーはエラーになる', async () => {
    mockAuth(null) // 未認証状態
    
    const result = await addBookToLibrary({
      id: 'test',
      volumeInfo: { title: 'テスト' }
    })
    
    expect(result).toEqual({ error: 'Authentication required' })
  })

  test('重複書籍の追加でエラーになる', async () => {
    // 既存書籍を先に追加
    await prisma.book.create({
      data: {
        googleBooksId: 'duplicate-test',
        title: '既存書籍',
        authors: [],
        categories: [],
        language: 'ja',
        status: BookStatus.WANT_TO_READ,
        userId: 'test-user'
      }
    })
    
    const result = await addBookToLibrary({
      id: 'duplicate-test',
      volumeInfo: { title: '重複書籍' }
    })
    
    expect(result).toEqual({ error: 'Book already exists in library' })
  })

  test('無効なGoogle Books データでエラーになる', async () => {
    const result = await addBookToLibrary({
      id: '',
      volumeInfo: { title: '' }
    })
    
    expect(result).toEqual({ error: 'Invalid book data' })
  })
```

### updateBookStatus関数

#### 正常系テスト
```typescript
describe('updateBookStatus', () => {
  let testBook: Book
  
  beforeEach(async () => {
    await prisma.book.deleteMany()
    mockAuth({ user: { id: 'test-user' } })
    
    testBook = await prisma.book.create({
      data: {
        googleBooksId: 'update-test',
        title: 'ステータス更新テスト',
        authors: [],
        categories: [],
        language: 'ja',
        status: BookStatus.WANT_TO_READ,
        userId: 'test-user'
      }
    })
  })

  test('読書ステータスを正常に更新できる', async () => {
    const result = await updateBookStatus(testBook.id, BookStatus.READING)
    
    expect(result.status).toBe(BookStatus.READING)
    expect(result.updatedAt).not.toEqual(testBook.updatedAt)
  })

  test('他ユーザーの書籍は更新できない', async () => {
    mockAuth({ user: { id: 'other-user' } })
    
    const result = await updateBookStatus(testBook.id, BookStatus.READ)
    
    expect(result).toEqual({ error: 'Book not found or access denied' })
  })
```

### getUserBooks関数

#### 正常系テスト
```typescript
describe('getUserBooks', () => {
  beforeEach(async () => {
    await prisma.book.deleteMany()
    mockAuth({ user: { id: 'test-user' } })
    
    // テストデータ作成
    await Promise.all([
      prisma.book.create({
        data: {
          googleBooksId: 'want-to-read-1',
          title: '読みたい本1',
          authors: [],
          categories: [],
          language: 'ja',
          status: BookStatus.WANT_TO_READ,
          userId: 'test-user'
        }
      }),
      prisma.book.create({
        data: {
          googleBooksId: 'reading-1',
          title: '読書中の本1',
          authors: [],
          categories: [],
          language: 'ja',
          status: BookStatus.READING,
          userId: 'test-user'
        }
      }),
      prisma.book.create({
        data: {
          googleBooksId: 'other-user-book',
          title: '他ユーザーの本',
          authors: [],
          categories: [],
          language: 'ja',
          status: BookStatus.READ,
          userId: 'other-user'
        }
      })
    ])
  })

  test('ユーザーの全書籍を取得できる', async () => {
    const result = await getUserBooks()
    
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
    expect(result.every(book => book.userId === 'test-user')).toBe(true)
  })

  test('ステータスでフィルタリングできる', async () => {
    const result = await getUserBooks(BookStatus.WANT_TO_READ)
    
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('読みたい本1')
  })

  test('ページネーション機能が動作する', async () => {
    const result = await getUserBooks(undefined, 1, 1)
    
    expect(result).toHaveLength(1)
  })
```

## エラーテスト・境界値テスト

### データベースエラーハンドリング
```typescript
describe('Database Error Handling', () => {
  test('データベース接続エラーを適切にハンドリング', async () => {
    // Prismaモックでエラーを発生させる
    jest.spyOn(prisma.book, 'create').mockRejectedValueOnce(new Error('Database connection failed'))
    
    const result = await addBookToLibrary({
      id: 'db-error-test',
      volumeInfo: { title: 'データベースエラーテスト' }
    })
    
    expect(result).toEqual({ error: 'Database error occurred' })
  })
```

### パフォーマンステスト
```typescript
describe('Performance Tests', () => {
  test('addBookToLibraryが500ms以下で完了する', async () => {
    const start = Date.now()
    
    await addBookToLibrary({
      id: 'performance-test',
      volumeInfo: { title: 'パフォーマンステスト' }
    })
    
    const duration = Date.now() - start
    expect(duration).toBeLessThan(500)
  })

  test('getUserBooksが200ms以下で完了する', async () => {
    const start = Date.now()
    
    await getUserBooks()
    
    const duration = Date.now() - start
    expect(duration).toBeLessThan(200)
  })
```

### 同時実行テスト
```typescript
describe('Concurrency Tests', () => {
  test('同じ書籍の同時追加で一方のみ成功する', async () => {
    const bookData = {
      id: 'concurrent-test',
      volumeInfo: { title: '同時実行テスト' }
    }
    
    const [result1, result2] = await Promise.allSettled([
      addBookToLibrary(bookData),
      addBookToLibrary(bookData)
    ])
    
    // 一方は成功、一方は重複エラー
    const results = [result1, result2].map(r => r.status === 'fulfilled' ? r.value : null)
    const successes = results.filter(r => r && !r.error)
    const failures = results.filter(r => r && r.error)
    
    expect(successes).toHaveLength(1)
    expect(failures).toHaveLength(1)
    expect(failures[0].error).toBe('Book already exists in library')
  })
```

## テスト実行計画

### 1. 単体テスト実行
```bash
npm test -- --testPathPattern=book-normalizer.test.ts
npm test -- --testPathPattern=book-validation.test.ts
```

### 2. 統合テスト実行  
```bash
npm test -- --testPathPattern=books.test.ts
```

### 3. 全テスト実行
```bash
npm test
npm run test:coverage
```

### 4. テストカバレッジ目標
- ラインカバレッジ: 90%以上
- 分岐カバレッジ: 85%以上  
- 関数カバレッジ: 100%