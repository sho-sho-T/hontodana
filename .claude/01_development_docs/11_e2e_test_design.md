# E2Eテスト設計書

## 1. E2Eテスト戦略概要

### 1.1 E2Eテストの目的
- **ユーザージャーニーの検証**: 実際のユーザー操作フローの動作確認
- **クロスブラウザ対応**: 異なるブラウザでの一貫した動作保証
- **リグレッション防止**: 機能追加・変更時の既存機能への影響確認
- **本番環境での信頼性**: 実際の使用環境に近い条件での検証

### 1.2 テスト対象範囲
- **クリティカルパス**: アプリケーションの主要機能
- **ユーザー認証フロー**: ログイン・登録・ログアウト
- **書籍管理機能**: 登録・編集・削除・検索
- **読書記録機能**: 進捗更新・レビュー投稿
- **ソーシャル機能**: フォロー・いいね・共有

## 2. テスト環境設定

### 2.1 Playwright設定
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'results.xml' }],
  ],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // デスクトップブラウザ
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
    
    // モバイルブラウザ
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // タブレット
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 2.2 テストデータ管理
```typescript
// tests/e2e/fixtures/test-data.ts
export const testUsers = {
  validUser: {
    email: 'testuser@example.com',
    password: 'Test123!@#',
    username: 'testuser',
    displayName: 'テストユーザー',
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'Admin123!@#',
    username: 'admin',
    displayName: '管理者',
  },
  newUser: {
    email: 'newuser@example.com',
    password: 'NewUser123!@#',
    username: 'newuser',
    displayName: '新規ユーザー',
  },
};

export const testBooks = {
  sampleBook: {
    title: 'TypeScript実践入門',
    author: '山田太郎',
    isbn: '9784123456789',
    pageCount: 350,
    bookType: 'PHYSICAL',
    description: 'TypeScriptの実践的な使い方を学ぶための入門書',
  },
  digitalBook: {
    title: 'React開発ガイド',
    author: '田中花子',
    pageCount: 280,
    bookType: 'DIGITAL',
    description: 'Reactを使ったモダンWeb開発の包括的ガイド',
  },
};

export const testReadingRecords = {
  readingInProgress: {
    status: 'READING',
    currentPage: 150,
    startDate: '2024-01-01',
  },
  completedReading: {
    status: 'COMPLETED',
    currentPage: 350,
    startDate: '2024-01-01',
    completedDate: '2024-01-15',
    rating: 5,
    review: '非常に分かりやすく、実践的な内容でした。',
  },
};
```

### 2.3 ページオブジェクトモデル
```typescript
// tests/e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly googleLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('email-input');
    this.passwordInput = page.getByTestId('password-input');
    this.loginButton = page.getByTestId('login-button');
    this.registerLink = page.getByTestId('register-link');
    this.forgotPasswordLink = page.getByTestId('forgot-password-link');
    this.errorMessage = page.getByTestId('error-message');
    this.googleLoginButton = page.getByTestId('google-login-button');
  }

  async goto() {
    await this.page.goto('/auth/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginWithGoogle() {
    await this.googleLoginButton.click();
    // Google OAuth flow handling
  }

  async expectLoginSuccess() {
    await this.page.waitForURL('/dashboard');
  }

  async expectLoginError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}
```

```typescript
// tests/e2e/pages/DashboardPage.ts
export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly addBookButton: Locator;
  readonly bookGrid: Locator;
  readonly readingStats: Locator;
  readonly recentlyAdded: Locator;
  readonly currentlyReading: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.addBookButton = page.getByTestId('add-book-button');
    this.bookGrid = page.getByTestId('book-grid');
    this.readingStats = page.getByTestId('reading-stats');
    this.recentlyAdded = page.getByTestId('recently-added');
    this.currentlyReading = page.getByTestId('currently-reading');
    this.userMenu = page.getByTestId('user-menu');
    this.logoutButton = page.getByTestId('logout-button');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async addNewBook() {
    await this.addBookButton.click();
    await this.page.waitForURL('/books/add');
  }

  async viewBook(bookTitle: string) {
    await this.bookGrid.getByText(bookTitle).click();
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL('/');
  }

  async expectReadingStats(stats: { totalBooks: number; completedBooks: number; readingBooks: number }) {
    await expect(this.readingStats.getByTestId('total-books')).toContainText(stats.totalBooks.toString());
    await expect(this.readingStats.getByTestId('completed-books')).toContainText(stats.completedBooks.toString());
    await expect(this.readingStats.getByTestId('reading-books')).toContainText(stats.readingBooks.toString());
  }
}
```

```typescript
// tests/e2e/pages/BookFormPage.ts
export class BookFormPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly authorInput: Locator;
  readonly isbnInput: Locator;
  readonly pageCountInput: Locator;
  readonly bookTypeSelect: Locator;
  readonly descriptionTextarea: Locator;
  readonly coverImageUpload: Locator;
  readonly tagsInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly searchGoogleBooksButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.getByTestId('title-input');
    this.authorInput = page.getByTestId('author-input');
    this.isbnInput = page.getByTestId('isbn-input');
    this.pageCountInput = page.getByTestId('page-count-input');
    this.bookTypeSelect = page.getByTestId('book-type-select');
    this.descriptionTextarea = page.getByTestId('description-textarea');
    this.coverImageUpload = page.getByTestId('cover-image-upload');
    this.tagsInput = page.getByTestId('tags-input');
    this.submitButton = page.getByTestId('submit-button');
    this.cancelButton = page.getByTestId('cancel-button');
    this.searchGoogleBooksButton = page.getByTestId('search-google-books');
  }

  async goto() {
    await this.page.goto('/books/add');
  }

  async fillBookForm(book: typeof testBooks.sampleBook) {
    await this.titleInput.fill(book.title);
    await this.authorInput.fill(book.author);
    if (book.isbn) await this.isbnInput.fill(book.isbn);
    if (book.pageCount) await this.pageCountInput.fill(book.pageCount.toString());
    await this.bookTypeSelect.selectOption(book.bookType);
    if (book.description) await this.descriptionTextarea.fill(book.description);
  }

  async addTag(tag: string) {
    await this.tagsInput.fill(tag);
    await this.page.keyboard.press('Enter');
  }

  async uploadCoverImage(imagePath: string) {
    await this.coverImageUpload.setInputFiles(imagePath);
  }

  async searchGoogleBooks(query: string) {
    await this.searchGoogleBooksButton.click();
    // Google Books search modal handling
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async expectFormSuccess() {
    await this.page.waitForURL(/\/books\/[a-z0-9-]+$/);
  }

  async expectValidationError(field: string, message: string) {
    const errorElement = this.page.getByTestId(`${field}-error`);
    await expect(errorElement).toContainText(message);
  }
}
```

## 3. クリティカルパステスト

### 3.1 認証フローテスト
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { testUsers } from './fixtures/test-data';

test.describe('認証フロー', () => {
  test('ユーザーログイン・ログアウト', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // ログインページに移動
    await loginPage.goto();
    
    // ログイン実行
    await loginPage.login(testUsers.validUser.email, testUsers.validUser.password);
    
    // ダッシュボードに遷移することを確認
    await loginPage.expectLoginSuccess();
    
    // ウェルカムメッセージの確認
    await expect(dashboardPage.welcomeMessage).toContainText('おかえりなさい');
    
    // ログアウト
    await dashboardPage.logout();
    
    // ホームページに遷移することを確認
    await expect(page).toHaveURL('/');
  });

  test('無効な認証情報でのログイン失敗', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    await loginPage.expectLoginError('メールアドレスまたはパスワードが正しくありません');
  });

  test('新規ユーザー登録フロー', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const onboardingPage = new OnboardingPage(page);
    const dashboardPage = new DashboardPage(page);

    // 登録ページに移動
    await registerPage.goto();
    
    // 新規ユーザー情報入力
    await registerPage.fillRegistrationForm(testUsers.newUser);
    await registerPage.submitForm();
    
    // 初期設定ページに遷移
    await registerPage.expectRegistrationSuccess();
    
    // 初期設定を完了
    await onboardingPage.completeOnboarding({
      readingGoal: 24,
      favoriteGenres: ['技術書', '小説'],
      profilePublic: true,
    });
    
    // ダッシュボードに遷移
    await onboardingPage.expectOnboardingComplete();
    await expect(dashboardPage.welcomeMessage).toContainText('hontodanaへようこそ');
  });
});
```

### 3.2 書籍管理テスト
```typescript
// tests/e2e/book-management.spec.ts
import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';
import { BookFormPage } from './pages/BookFormPage';
import { BookDetailPage } from './pages/BookDetailPage';
import { testBooks } from './fixtures/test-data';

test.describe('書籍管理機能', () => {
  test.beforeEach(async ({ page }) => {
    // 事前にログイン
    await loginAsTestUser(page);
  });

  test('新しい書籍を登録', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const bookFormPage = new BookFormPage(page);
    const bookDetailPage = new BookDetailPage(page);

    // ダッシュボードから書籍追加
    await dashboardPage.goto();
    await dashboardPage.addNewBook();
    
    // 書籍情報入力
    await bookFormPage.fillBookForm(testBooks.sampleBook);
    await bookFormPage.addTag('プログラミング');
    await bookFormPage.addTag('入門書');
    
    // 登録実行
    await bookFormPage.submitForm();
    await bookFormPage.expectFormSuccess();
    
    // 書籍詳細ページで情報確認
    await expect(bookDetailPage.title).toContainText(testBooks.sampleBook.title);
    await expect(bookDetailPage.author).toContainText(testBooks.sampleBook.author);
    await expect(bookDetailPage.pageCount).toContainText('350ページ');
    await expect(bookDetailPage.tags).toContainText('プログラミング');
    await expect(bookDetailPage.tags).toContainText('入門書');
  });

  test('書籍情報を編集', async ({ page }) => {
    const bookDetailPage = new BookDetailPage(page);
    const bookFormPage = new BookFormPage(page);

    // 既存の書籍詳細ページに移動
    await bookDetailPage.goto('existing-book-id');
    
    // 編集ボタンをクリック
    await bookDetailPage.clickEditButton();
    
    // 情報更新
    await bookFormPage.titleInput.clear();
    await bookFormPage.titleInput.fill('TypeScript実践入門 第2版');
    await bookFormPage.pageCountInput.clear();
    await bookFormPage.pageCountInput.fill('400');
    
    // 更新実行
    await bookFormPage.submitForm();
    await bookFormPage.expectFormSuccess();
    
    // 更新確認
    await expect(bookDetailPage.title).toContainText('第2版');
    await expect(bookDetailPage.pageCount).toContainText('400ページ');
  });

  test('書籍を削除', async ({ page }) => {
    const bookDetailPage = new BookDetailPage(page);
    const dashboardPage = new DashboardPage(page);

    await bookDetailPage.goto('book-to-delete-id');
    
    // 削除ボタンクリック
    await bookDetailPage.clickDeleteButton();
    
    // 確認ダイアログで削除実行
    await bookDetailPage.confirmDeletion();
    
    // ダッシュボードにリダイレクト
    await expect(page).toHaveURL('/dashboard');
    
    // 削除された書籍が表示されないことを確認
    await expect(dashboardPage.bookGrid.getByText('削除対象書籍')).not.toBeVisible();
  });

  test('Google Books APIで書籍検索', async ({ page }) => {
    const bookFormPage = new BookFormPage(page);

    await bookFormPage.goto();
    
    // Google Books検索
    await bookFormPage.searchGoogleBooks('TypeScript');
    
    // 検索結果モーダルが表示される
    const searchModal = page.getByTestId('google-books-search-modal');
    await expect(searchModal).toBeVisible();
    
    // 検索結果から選択
    const firstResult = searchModal.getByTestId('search-result-item').first();
    await firstResult.click();
    
    // フォームに情報が自動入力される
    await expect(bookFormPage.titleInput).not.toBeEmpty();
    await expect(bookFormPage.authorInput).not.toBeEmpty();
  });
});
```

### 3.3 読書記録テスト
```typescript
// tests/e2e/reading-record.spec.ts
import { test, expect } from '@playwright/test';
import { BookDetailPage } from './pages/BookDetailPage';
import { ReadingRecordPage } from './pages/ReadingRecordPage';
import { testReadingRecords } from './fixtures/test-data';

test.describe('読書記録機能', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('読書進捗を更新', async ({ page }) => {
    const bookDetailPage = new BookDetailPage(page);
    const readingRecordPage = new ReadingRecordPage(page);

    await bookDetailPage.goto('test-book-id');
    
    // 読書記録タブに移動
    await bookDetailPage.clickReadingRecordTab();
    
    // 進捗更新
    await readingRecordPage.updateProgress({
      status: 'READING',
      currentPage: 150,
      notes: '第5章まで読了。TypeScriptの型システムについて理解が深まった。',
    });
    
    // 進捗保存
    await readingRecordPage.saveProgress();
    
    // 進捗確認
    await expect(readingRecordPage.progressBar).toHaveAttribute('aria-valuenow', '43'); // 150/350
    await expect(readingRecordPage.statusBadge).toContainText('読書中');
    await expect(readingRecordPage.currentPage).toContainText('150 / 350');
  });

  test('読書完了とレビュー投稿', async ({ page }) => {
    const readingRecordPage = new ReadingRecordPage(page);

    await page.goto('/books/test-book-id/reading');
    
    // 読了処理
    await readingRecordPage.markAsCompleted({
      rating: 5,
      review: '非常に分かりやすく、実践的な内容でした。TypeScriptを学ぶ人におすすめです。',
      completedDate: '2024-01-15',
    });
    
    await readingRecordPage.saveRecord();
    
    // 完了確認
    await expect(readingRecordPage.statusBadge).toContainText('読了');
    await expect(readingRecordPage.rating).toContainText('★★★★★');
    await expect(readingRecordPage.completedDate).toContainText('2024年1月15日');
    await expect(readingRecordPage.review).toContainText('非常に分かりやすく');
  });

  test('読書メモを追加', async ({ page }) => {
    const readingRecordPage = new ReadingRecordPage(page);

    await page.goto('/books/test-book-id/reading');
    
    // メモタブに移動
    await readingRecordPage.clickNotesTab();
    
    // 新しいメモ追加
    await readingRecordPage.addNote({
      pageNumber: 85,
      noteType: 'HIGHLIGHT',
      content: '型ガードを使うことで、TypeScriptの型推論を活用できる',
    });
    
    // メモ保存
    await readingRecordPage.saveNote();
    
    // メモ一覧で確認
    const notesList = page.getByTestId('notes-list');
    await expect(notesList.getByText('p.85')).toBeVisible();
    await expect(notesList.getByText('型ガードを使うこと')).toBeVisible();
  });
});
```

### 3.4 検索・フィルタリングテスト
```typescript
// tests/e2e/search-filtering.spec.ts
import { test, expect } from '@playwright/test';
import { BookshelfPage } from './pages/BookshelfPage';

test.describe('検索・フィルタリング機能', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('書籍タイトルで検索', async ({ page }) => {
    const bookshelfPage = new BookshelfPage(page);

    await bookshelfPage.goto();
    
    // 検索実行
    await bookshelfPage.searchBooks('TypeScript');
    
    // 検索結果確認
    const searchResults = bookshelfPage.bookGrid;
    await expect(searchResults.getByText('TypeScript')).toBeVisible();
    
    // 関係ない書籍が表示されないことを確認
    await expect(searchResults.getByText('Java入門')).not.toBeVisible();
  });

  test('複数条件でフィルタリング', async ({ page }) => {
    const bookshelfPage = new BookshelfPage(page);

    await bookshelfPage.goto();
    
    // フィルターパネルを開く
    await bookshelfPage.openFilterPanel();
    
    // 複数条件設定
    await bookshelfPage.setFilters({
      status: ['READING'],
      bookType: ['PHYSICAL'],
      genre: ['技術書'],
      rating: [4, 5],
    });
    
    // フィルター適用
    await bookshelfPage.applyFilters();
    
    // フィルター結果確認
    const filteredBooks = bookshelfPage.bookGrid.getByTestId('book-card');
    await expect(filteredBooks).toHaveCount(3); // 期待される件数
    
    // 各書籍がフィルター条件を満たすことを確認
    await expect(filteredBooks.first().getByTestId('status-badge')).toContainText('読書中');
    await expect(filteredBooks.first().getByTestId('book-type-badge')).toContainText('物理本');
  });

  test('ソート機能', async ({ page }) => {
    const bookshelfPage = new BookshelfPage(page);

    await bookshelfPage.goto();
    
    // 作成日順（新しい順）でソート
    await bookshelfPage.sortBy('createdAt', 'desc');
    
    // ソート結果確認
    const bookCards = bookshelfPage.bookGrid.getByTestId('book-card');
    const firstBookTitle = await bookCards.first().getByTestId('book-title').textContent();
    const lastBookTitle = await bookCards.last().getByTestId('book-title').textContent();
    
    // 最新の書籍が最初に表示されることを確認
    expect(firstBookTitle).toBe('最近追加した書籍');
    
    // 評価順でソート
    await bookshelfPage.sortBy('rating', 'desc');
    
    // 高評価の書籍が上位に表示されることを確認
    const topRatedBook = bookCards.first();
    await expect(topRatedBook.getByTestId('rating')).toContainText('★★★★★');
  });
});
```

## 4. クロスブラウザテスト

### 4.1 ブラウザ互換性テスト
```typescript
// tests/e2e/cross-browser.spec.ts
import { test, expect, devices } from '@playwright/test';

const browsers = [
  { name: 'Chrome', device: devices['Desktop Chrome'] },
  { name: 'Firefox', device: devices['Desktop Firefox'] },
  { name: 'Safari', device: devices['Desktop Safari'] },
  { name: 'Mobile Chrome', device: devices['Pixel 5'] },
  { name: 'Mobile Safari', device: devices['iPhone 12'] },
];

browsers.forEach(({ name, device }) => {
  test.describe(`${name} ブラウザテスト`, () => {
    test.use(device);

    test('基本機能が正常に動作する', async ({ page }) => {
      await loginAsTestUser(page);
      
      // ダッシュボード表示確認
      await page.goto('/dashboard');
      await expect(page.getByTestId('welcome-message')).toBeVisible();
      
      // 本棚ページ遷移確認
      await page.click('[data-testid=books-nav-link]');
      await expect(page).toHaveURL('/books');
      
      // 書籍カード表示確認
      await expect(page.getByTestId('book-card')).toBeVisible();
    });

    test('レスポンシブレイアウト', async ({ page }) => {
      await page.goto('/books');
      
      const viewport = page.viewportSize();
      
      if (viewport && viewport.width < 768) {
        // モバイル: ハンバーガーメニューが表示される
        await expect(page.getByTestId('mobile-menu-button')).toBeVisible();
        await expect(page.getByTestId('desktop-sidebar')).not.toBeVisible();
      } else {
        // デスクトップ: サイドバーが表示される
        await expect(page.getByTestId('desktop-sidebar')).toBeVisible();
        await expect(page.getByTestId('mobile-menu-button')).not.toBeVisible();
      }
    });
  });
});
```

## 5. パフォーマンステスト

### 5.1 ページ読み込み速度テスト
```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('パフォーマンステスト', () => {
  test('ページ読み込み速度', async ({ page }) => {
    // パフォーマンス測定開始
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    
    // Core Web Vitals取得
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics = {};
          
          entries.forEach((entry) => {
            metrics[entry.name] = entry.value;
          });
          
          resolve(metrics);
        }).observe({ entryTypes: ['measure', 'navigation'] });
      });
    });
    
    // LCP (Largest Contentful Paint) 確認
    expect(metrics['largest-contentful-paint']).toBeLessThan(2500);
    
    // FID (First Input Delay) 確認
    expect(metrics['first-input-delay']).toBeLessThan(100);
  });

  test('大量データの表示パフォーマンス', async ({ page }) => {
    // 大量の書籍データがある状態でテスト
    await page.goto('/books?limit=1000');
    
    const startTime = Date.now();
    
    // 仮想スクロールの確認
    await expect(page.getByTestId('book-card')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3秒以内
    
    // スクロールパフォーマンス確認
    await page.evaluate(() => {
      window.scrollTo(0, 5000);
    });
    
    // 新しい書籍カードが追加で読み込まれる
    await expect(page.getByTestId('book-card')).toHaveCount(50); // 期待される表示数
  });
});
```

## 6. アクセシビリティテスト

### 6.1 A11yテスト
```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('アクセシビリティテスト', () => {
  test('ダッシュボードのアクセシビリティ', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('キーボードナビゲーション', async ({ page }) => {
    await page.goto('/books');
    
    // Tabキーでフォーカス移動
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('search-input')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('filter-button')).toBeFocused();
    
    // Enterキーで要素をアクティベート
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('filter-panel')).toBeVisible();
  });

  test('スクリーンリーダー対応', async ({ page }) => {
    await page.goto('/books/test-book-id');
    
    // aria-label属性の確認
    const progressBar = page.getByTestId('reading-progress');
    await expect(progressBar).toHaveAttribute('aria-label', /読書進捗.*%/);
    
    // role属性の確認
    const bookCard = page.getByTestId('book-card');
    await expect(bookCard).toHaveAttribute('role', 'button');
    
    // alt属性の確認
    const coverImage = page.getByTestId('book-cover');
    await expect(coverImage).toHaveAttribute('alt', /.*の表紙/);
  });
});
```

## 7. テストデータ管理

### 7.1 テストデータのセットアップ・クリーンアップ
```typescript
// tests/e2e/helpers/test-data-manager.ts
export class TestDataManager {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.TEST_SUPABASE_URL!,
      process.env.TEST_SUPABASE_SERVICE_KEY!
    );
  }

  async setupTestUser(userData: Partial<User> = {}) {
    const testUser = {
      id: 'test-user-id',
      email: 'testuser@example.com',
      username: 'testuser',
      ...userData,
    };

    await this.supabase.from('users').upsert(testUser);
    return testUser;
  }

  async setupTestBooks(userId: string, booksData: Partial<Book>[] = []) {
    const testBooks = booksData.map((book, index) => ({
      id: `test-book-${index}`,
      user_id: userId,
      title: `テスト書籍${index + 1}`,
      author: 'テスト著者',
      ...book,
    }));

    await this.supabase.from('books').upsert(testBooks);
    return testBooks;
  }

  async cleanupTestData() {
    // テストデータの削除
    await this.supabase.from('reading_records').delete().like('id', 'test-%');
    await this.supabase.from('books').delete().like('id', 'test-%');
    await this.supabase.from('users').delete().like('id', 'test-%');
  }
}

// グローバルセットアップ
export async function globalSetup() {
  const testDataManager = new TestDataManager();
  
  // テストユーザーとサンプルデータを準備
  const testUser = await testDataManager.setupTestUser();
  await testDataManager.setupTestBooks(testUser.id, [
    { title: 'TypeScript実践入門', author: '山田太郎' },
    { title: 'React開発ガイド', author: '田中花子' },
  ]);
}

// グローバルクリーンアップ
export async function globalTeardown() {
  const testDataManager = new TestDataManager();
  await testDataManager.cleanupTestData();
}
```

この包括的なE2Eテスト設計により、ユーザー体験の品質と信頼性を確保できます。