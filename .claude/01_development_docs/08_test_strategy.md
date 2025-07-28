# テスト戦略設計書

## 1. テスト戦略概要

### 1.1 テストピラミッド
```
        /\
       /  \
      / E2E \ (少数)
     /______\
    /        \
   / Integration \ (中程度)
  /______________\
 /                \
/   Unit Tests     \ (多数)
\__________________/
```

### 1.2 テスト方針
- **高速フィードバック**: 開発中の即座なエラー検出
- **信頼性**: リグレッションバグの防止
- **保守性**: テストコードの可読性・メンテナンス性
- **効率性**: 最小限のテストで最大限の価値提供

### 1.3 カバレッジ目標
- **Unit Tests**: 90%以上（ドメインロジック100%）
- **Integration Tests**: 主要フロー80%以上
- **E2E Tests**: クリティカルパス100%

## 2. テスト環境設定

### 2.1 テストツール構成
```typescript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/test/(.*)$': '<rootDir>/__tests__/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/domain/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### 2.2 テストセットアップ
```typescript
// jest.setup.js
import '@testing-library/jest-dom';
import { server } from './__tests__/mocks/server';

// MSW セットアップ
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// グローバルモック
global.fetch = require('jest-fetch-mock');

// Supabase モック
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}));

// Next.js Router モック
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));
```

## 3. Unit Tests（単体テスト）

### 3.1 ドメインロジックテスト

#### エンティティテスト
```typescript
// __tests__/domain/entities/Book.test.ts
import { Book, BookType, ValidationError } from '@/domain/entities/Book';

describe('Book Entity', () => {
  describe('constructor', () => {
    it('should create a valid book', () => {
      const book = new Book(
        'book-id',
        'TypeScript入門',
        '山田太郎',
        BookType.PHYSICAL,
        300
      );

      expect(book.id).toBe('book-id');
      expect(book.title).toBe('TypeScript入門');
      expect(book.author).toBe('山田太郎');
      expect(book.bookType).toBe(BookType.PHYSICAL);
      expect(book.pageCount).toBe(300);
    });

    it('should throw ValidationError for empty title', () => {
      expect(() => {
        new Book('book-id', '', '山田太郎', BookType.PHYSICAL);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for title too long', () => {
      const longTitle = 'a'.repeat(201);
      expect(() => {
        new Book('book-id', longTitle, '山田太郎', BookType.PHYSICAL);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid page count', () => {
      expect(() => {
        new Book('book-id', 'タイトル', '山田太郎', BookType.PHYSICAL, 0);
      }).toThrow(ValidationError);

      expect(() => {
        new Book('book-id', 'タイトル', '山田太郎', BookType.PHYSICAL, 10001);
      }).toThrow(ValidationError);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate reading progress correctly', () => {
      const book = new Book('id', 'タイトル', '著者', BookType.PHYSICAL, 300);
      const progress = book.calculateProgress(150);

      expect(progress.percentage).toBe(50);
      expect(progress.currentPage).toBe(150);
      expect(progress.totalPages).toBe(300);
    });

    it('should handle edge cases', () => {
      const book = new Book('id', 'タイトル', '著者', BookType.DIGITAL);
      const progress = book.calculateProgress(0);

      expect(progress.percentage).toBe(0);
    });
  });
});
```

#### 値オブジェクトテスト
```typescript
// __tests__/domain/values/Progress.test.ts
import { Progress } from '@/domain/values/Progress';

describe('Progress Value Object', () => {
  it('should calculate percentage correctly', () => {
    const progress = new Progress(75, 150);
    expect(progress.percentage).toBe(50);
  });

  it('should handle completed reading', () => {
    const progress = new Progress(200, 200);
    expect(progress.percentage).toBe(100);
    expect(progress.isCompleted).toBe(true);
  });

  it('should throw error for invalid values', () => {
    expect(() => new Progress(-1, 100)).toThrow();
    expect(() => new Progress(101, 100)).toThrow();
    expect(() => new Progress(50, 0)).toThrow();
  });
});
```

### 3.2 サービスレイヤーテスト

#### アプリケーションサービステスト
```typescript
// __tests__/lib/services/BookService.test.ts
import { BookService } from '@/lib/services/BookService';
import { MockBookRepository } from '@/test/mocks/MockBookRepository';
import { MockLogger } from '@/test/mocks/MockLogger';
import { ValidationError, SystemError } from '@/lib/errors';

describe('BookService', () => {
  let bookService: BookService;
  let mockRepository: MockBookRepository;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockRepository = new MockBookRepository();
    mockLogger = new MockLogger();
    bookService = new BookService(mockRepository, mockLogger);
  });

  describe('createBook', () => {
    const validBookData = {
      title: 'テスト書籍',
      author: 'テスト著者',
      bookType: BookType.PHYSICAL,
      pageCount: 300,
    };

    it('should create book successfully', async () => {
      const createdBook = await bookService.createBook(validBookData);

      expect(createdBook.title).toBe(validBookData.title);
      expect(createdBook.author).toBe(validBookData.author);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Book created successfully',
        { bookId: createdBook.id }
      );
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = { ...validBookData, title: '' };

      await expect(bookService.createBook(invalidData)).rejects.toThrow(
        ValidationError
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockRepository.save.mockRejectedValue(repositoryError);

      await expect(bookService.createBook(validBookData)).rejects.toThrow(
        SystemError
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create book',
        expect.objectContaining({
          error: repositoryError.message,
          bookData: validBookData,
        })
      );
    });
  });

  describe('getBooksByUser', () => {
    it('should return user books with filters', async () => {
      const userId = 'user-123';
      const filters = { status: ReadingStatus.READING };
      const mockBooks = [createMockBook(), createMockBook()];
      
      mockRepository.findByUserId.mockResolvedValue(mockBooks);

      const result = await bookService.getBooksByUser(userId, filters);

      expect(result).toEqual(mockBooks);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId, filters);
    });
  });
});
```

### 3.3 ユーティリティ関数テスト
```typescript
// __tests__/lib/utils/date.test.ts
import { formatDate, isValidDate, getDateRange } from '@/lib/utils/date';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('01/15/2024');
    });

    it('should handle invalid dates', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('isValidDate', () => {
    it('should validate dates correctly', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });
});
```

## 4. Integration Tests（統合テスト）

### 4.1 API統合テスト
```typescript
// __tests__/integration/api/books.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/books/route';
import { prismaMock } from '@/test/mocks/prisma';

describe('/api/books', () => {
  beforeEach(() => {
    prismaMock.book.findMany.mockClear();
    prismaMock.book.create.mockClear();
  });

  describe('GET /api/books', () => {
    it('should return user books', async () => {
      const mockBooks = [
        { id: '1', title: 'Book 1', author: 'Author 1' },
        { id: '2', title: 'Book 2', author: 'Author 2' },
      ];
      prismaMock.book.findMany.mockResolvedValue(mockBooks);

      const { req, res } = createMocks({
        method: 'GET',
        headers: { authorization: 'Bearer valid-token' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.books).toEqual(mockBooks);
    });

    it('should return 401 for unauthorized request', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });
  });

  describe('POST /api/books', () => {
    it('should create new book', async () => {
      const newBook = {
        title: 'New Book',
        author: 'New Author',
        bookType: 'PHYSICAL',
      };
      const createdBook = { id: '123', ...newBook };
      
      prismaMock.book.create.mockResolvedValue(createdBook);

      const { req, res } = createMocks({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: newBook,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.book).toEqual(createdBook);
    });

    it('should return 400 for invalid data', async () => {
      const invalidBook = { title: '', author: 'Author' };

      const { req, res } = createMocks({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        body: invalidBook,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });
  });
});
```

### 4.2 データベース統合テスト
```typescript
// __tests__/integration/repositories/SupabaseBookRepository.test.ts
import { SupabaseBookRepository } from '@/infrastructure/repositories/SupabaseBookRepository';
import { createSupabaseTestClient } from '@/test/utils/supabase';

describe('SupabaseBookRepository', () => {
  let repository: SupabaseBookRepository;
  let testClient: SupabaseClient;

  beforeAll(async () => {
    testClient = createSupabaseTestClient();
    repository = new SupabaseBookRepository(testClient);
  });

  beforeEach(async () => {
    // テストデータクリーンアップ
    await testClient.from('books').delete().neq('id', '');
  });

  it('should save and retrieve book', async () => {
    const book = new Book(
      'test-id',
      'Test Book',
      'Test Author',
      BookType.PHYSICAL,
      200
    );

    await repository.save(book);
    const retrieved = await repository.findById('test-id');

    expect(retrieved).toBeDefined();
    expect(retrieved!.title).toBe('Test Book');
    expect(retrieved!.author).toBe('Test Author');
  });

  it('should handle duplicate IDs', async () => {
    const book1 = new Book('duplicate-id', 'Book 1', 'Author 1', BookType.PHYSICAL);
    const book2 = new Book('duplicate-id', 'Book 2', 'Author 2', BookType.PHYSICAL);

    await repository.save(book1);
    
    await expect(repository.save(book2)).rejects.toThrow();
  });
});
```

## 5. Component Tests（コンポーネントテスト）

### 5.1 UIコンポーネントテスト
```typescript
// __tests__/components/BookCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BookCard } from '@/components/BookCard';
import { createMockBook } from '@/test/factories/book';

describe('BookCard', () => {
  const mockBook = createMockBook();
  const mockOnClick = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render book information', () => {
    render(<BookCard book={mockBook} onClick={mockOnClick} />);

    expect(screen.getByText(mockBook.title)).toBeInTheDocument();
    expect(screen.getByText(mockBook.author)).toBeInTheDocument();
    expect(screen.getByAltText(`${mockBook.title}の表紙`)).toBeInTheDocument();
  });

  it('should show reading progress when provided', () => {
    const readingRecord = {
      status: ReadingStatus.READING,
      progress: { currentPage: 150, totalPages: 300, percentage: 50 },
    };

    render(
      <BookCard 
        book={mockBook} 
        readingRecord={readingRecord}
        showProgress={true}
        onClick={mockOnClick} 
      />
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('150 / 300 ページ')).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', () => {
    render(<BookCard book={mockBook} onClick={mockOnClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledWith(mockBook);
  });

  it('should show action buttons when showActions is true', () => {
    render(
      <BookCard 
        book={mockBook} 
        showActions={true}
        onEdit={mockOnEdit}
        onClick={mockOnClick} 
      />
    );

    expect(screen.getByLabelText('編集')).toBeInTheDocument();
    expect(screen.getByLabelText('削除')).toBeInTheDocument();
  });

  it('should handle missing cover image', () => {
    const bookWithoutCover = { ...mockBook, coverImageUrl: undefined };
    render(<BookCard book={bookWithoutCover} onClick={mockOnClick} />);

    expect(screen.getByText('No Image')).toBeInTheDocument();
  });
});
```

### 5.2 フォームコンポーネントテスト
```typescript
// __tests__/components/BookForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookForm } from '@/components/BookForm';

describe('BookForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields', () => {
    render(<BookForm mode="create" onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText('書籍タイトル')).toBeInTheDocument();
    expect(screen.getByLabelText('著者')).toBeInTheDocument();
    expect(screen.getByLabelText('ページ数')).toBeInTheDocument();
    expect(screen.getByLabelText('書籍種別')).toBeInTheDocument();
  });

  it('should submit valid form data', async () => {
    const user = userEvent.setup();
    render(<BookForm mode="create" onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText('書籍タイトル'), 'テスト書籍');
    await user.type(screen.getByLabelText('著者'), 'テスト著者');
    await user.type(screen.getByLabelText('ページ数'), '300');
    await user.selectOptions(screen.getByLabelText('書籍種別'), 'PHYSICAL');

    fireEvent.click(screen.getByRole('button', { name: '登録' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'テスト書籍',
        author: 'テスト著者',
        pageCount: 300,
        bookType: 'PHYSICAL',
      });
    });
  });

  it('should show validation errors', async () => {
    const user = userEvent.setup();
    render(<BookForm mode="create" onSubmit={mockOnSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: '登録' }));

    await waitFor(() => {
      expect(screen.getByText('書籍タイトルは必須です')).toBeInTheDocument();
      expect(screen.getByText('著者は必須です')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should populate form in edit mode', () => {
    const existingBook = createMockBook();
    render(
      <BookForm 
        mode="edit" 
        book={existingBook} 
        onSubmit={mockOnSubmit} 
      />
    );

    expect(screen.getByDisplayValue(existingBook.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(existingBook.author)).toBeInTheDocument();
  });
});
```

## 6. E2E Tests（End-to-End テスト）

### 6.1 Playwright設定
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 6.2 クリティカルパステスト
```typescript
// e2e/book-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('書籍管理機能', () => {
  test.beforeEach(async ({ page }) => {
    // テストユーザーでログイン
    await page.goto('/auth/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('新しい書籍を登録できる', async ({ page }) => {
    // 書籍登録ページに移動
    await page.click('[data-testid=add-book-button]');
    await expect(page).toHaveURL('/books/add');

    // 書籍情報を入力
    await page.fill('[data-testid=book-title]', 'TypeScript実践入門');
    await page.fill('[data-testid=book-author]', '山田太郎');
    await page.fill('[data-testid=book-pages]', '350');
    await page.selectOption('[data-testid=book-type]', 'PHYSICAL');

    // 登録実行
    await page.click('[data-testid=submit-button]');

    // 成功メッセージ確認
    await expect(page.locator('[data-testid=success-message]')).toContainText(
      '書籍を登録しました'
    );

    // 書籍詳細ページに遷移
    await expect(page).toHaveURL(/\/books\/[a-z0-9-]+$/);
    await expect(page.locator('[data-testid=book-title]')).toContainText(
      'TypeScript実践入門'
    );
  });

  test('読書記録を更新できる', async ({ page }) => {
    // 既存の書籍詳細ページに移動
    await page.goto('/books/test-book-id');

    // 読書記録タブをクリック
    await page.click('[data-testid=reading-record-tab]');

    // 進捗を更新
    await page.fill('[data-testid=current-page]', '150');
    await page.selectOption('[data-testid=reading-status]', 'READING');

    // 保存
    await page.click('[data-testid=save-progress]');

    // 更新確認
    await expect(page.locator('[data-testid=progress-bar]')).toHaveAttribute(
      'aria-valuenow',
      '42' // 150/350 ≈ 42%
    );
  });

  test('書籍検索・フィルタリング機能', async ({ page }) => {
    await page.goto('/books');

    // 検索
    await page.fill('[data-testid=search-input]', 'TypeScript');
    await page.press('[data-testid=search-input]', 'Enter');

    // 検索結果確認
    await expect(page.locator('[data-testid=book-card]')).toContainText(
      'TypeScript'
    );

    // フィルター適用
    await page.click('[data-testid=filter-button]');
    await page.check('[data-testid=filter-reading]');
    await page.click('[data-testid=apply-filters]');

    // フィルター結果確認
    await expect(page.locator('[data-testid=reading-status]')).toContainText(
      '読書中'
    );
  });
});
```

### 6.3 認証フローテスト
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('認証機能', () => {
  test('ユーザー登録フロー', async ({ page }) => {
    await page.goto('/auth/register');

    // 登録フォーム入力
    await page.fill('[data-testid=email]', 'newuser@example.com');
    await page.fill('[data-testid=username]', 'newuser');
    await page.fill('[data-testid=password]', 'password123');
    await page.fill('[data-testid=confirm-password]', 'password123');

    // 利用規約同意
    await page.check('[data-testid=terms-agreement]');

    // 登録実行
    await page.click('[data-testid=register-button]');

    // 初期設定ページに遷移
    await expect(page).toHaveURL('/auth/onboarding');
    
    // 初期設定完了
    await page.fill('[data-testid=display-name]', '新規ユーザー');
    await page.click('[data-testid=complete-setup]');

    // ダッシュボードに遷移
    await expect(page).toHaveURL('/dashboard');
  });

  test('ログイン・ログアウトフロー', async ({ page }) => {
    // ログイン
    await page.goto('/auth/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');

    await expect(page).toHaveURL('/dashboard');

    // ログアウト
    await page.click('[data-testid=user-menu]');
    await page.click('[data-testid=logout-button]');

    await expect(page).toHaveURL('/');
  });

  test('認証が必要なページの保護', async ({ page }) => {
    // 未認証でダッシュボードにアクセス
    await page.goto('/dashboard');

    // ログインページにリダイレクト
    await expect(page).toHaveURL('/auth/login');
  });
});
```

## 7. パフォーマンステスト

### 7.1 負荷テスト設定
```typescript
// __tests__/performance/load.test.ts
import { test, expect } from '@playwright/test';

test.describe('パフォーマンステスト', () => {
  test('ページ読み込み速度', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3秒以内
  });

  test('大量データの表示パフォーマンス', async ({ page }) => {
    // 大量の書籍データがある状態でテスト
    await page.goto('/books?limit=1000');
    
    const startTime = Date.now();
    await page.waitForSelector('[data-testid=book-card]');
    const renderTime = Date.now() - startTime;
    
    expect(renderTime).toBeLessThan(2000); // 2秒以内
  });
});
```

## 8. テストデータ管理

### 8.1 ファクトリー関数
```typescript
// __tests__/factories/book.ts
import { Book, BookType } from '@/domain/entities/Book';

export const createMockBook = (overrides: Partial<Book> = {}): Book => ({
  id: 'book-123',
  userId: 'user-123',
  title: 'テスト書籍',
  author: 'テスト著者',
  bookType: BookType.PHYSICAL,
  pageCount: 300,
  coverImageUrl: 'https://example.com/cover.jpg',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockReadingRecord = (overrides = {}) => ({
  id: 'record-123',
  bookId: 'book-123',
  userId: 'user-123',
  status: ReadingStatus.READING,
  currentPage: 150,
  rating: null,
  review: null,
  isPublic: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});
```

### 8.2 テストユーティリティ
```typescript
// __tests__/utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## 9. CI/CD テスト統合

### 9.1 GitHub Actions設定
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 10. テスト実行コマンド

### 10.1 NPMスクリプト
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__/unit",
    "test:integration": "jest --testPathPattern=__tests__/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:changed": "jest --onlyChanged",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

この包括的なテスト戦略により、アプリケーションの品質と信頼性を確保します。