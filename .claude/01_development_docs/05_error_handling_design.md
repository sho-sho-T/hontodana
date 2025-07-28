# エラーハンドリング設計書

## 1. エラーハンドリング全体戦略

### 1.1 設計原則
- **ユーザーフレンドリー**: 技術的な詳細を隠し、分かりやすいメッセージを表示
- **開発者フレンドリー**: デバッグに必要な情報を適切にログ出力
- **段階的劣化**: 一部の機能が失敗しても、他の機能は継続して動作
- **回復可能性**: 可能な限り自動復旧やリトライ機能を提供

### 1.2 エラー処理の階層
```
Presentation Layer  → ユーザー向けエラーメッセージ表示
Application Layer   → エラーの変換・ログ出力
Domain Layer        → ビジネスルール例外の定義
Infrastructure Layer → 外部サービスエラーのハンドリング
```

## 2. エラーの分類体系

### 2.1 エラーカテゴリ

#### ValidationError（バリデーションエラー）
```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// 使用例
throw new ValidationError(
  '書籍タイトルは必須です',
  'title',
  'REQUIRED_FIELD'
);
```

#### AuthenticationError（認証エラー）
```typescript
class AuthenticationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// 使用例
throw new AuthenticationError(
  'セッションが無効です。再度ログインしてください',
  'INVALID_SESSION'
);
```

#### AuthorizationError（認可エラー）
```typescript
class AuthorizationError extends Error {
  constructor(message: string, public resource: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// 使用例
throw new AuthorizationError(
  'この書籍を編集する権限がありません',
  'book:edit'
);
```

#### NotFoundError（リソース未存在エラー）
```typescript
class NotFoundError extends Error {
  constructor(message: string, public resourceType: string, public resourceId: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// 使用例
throw new NotFoundError(
  '指定された書籍が見つかりません',
  'book',
  bookId
);
```

#### ExternalApiError（外部API連携エラー）
```typescript
class ExternalApiError extends Error {
  constructor(
    message: string,
    public apiName: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ExternalApiError';
  }
}

// 使用例
throw new ExternalApiError(
  'Google Books APIでエラーが発生しました',
  'GoogleBooksAPI',
  500,
  originalError
);
```

#### SystemError（システム内部エラー）
```typescript
class SystemError extends Error {
  constructor(message: string, public code: string, public originalError?: Error) {
    super(message);
    this.name = 'SystemError';
  }
}

// 使用例
throw new SystemError(
  'データベース接続エラー',
  'DB_CONNECTION_FAILED',
  originalError
);
```

### 2.2 エラーコード体系

#### バリデーションエラーコード
```typescript
const ValidationErrorCodes = {
  REQUIRED_FIELD: 'この項目は必須です',
  INVALID_FORMAT: '形式が正しくありません',
  TOO_LONG: '文字数が上限を超えています',
  TOO_SHORT: '文字数が不足しています',
  INVALID_EMAIL: 'メールアドレスの形式が正しくありません',
  INVALID_ISBN: 'ISBNの形式が正しくありません',
  INVALID_DATE: '日付の形式が正しくありません',
  PAGE_OUT_OF_RANGE: 'ページ数が範囲外です',
  RATING_OUT_OF_RANGE: '評価は1-5の範囲で入力してください',
} as const;
```

#### システムエラーコード
```typescript
const SystemErrorCodes = {
  DB_CONNECTION_FAILED: 'データベース接続に失敗しました',
  DB_QUERY_FAILED: 'データベースクエリに失敗しました',
  FILE_UPLOAD_FAILED: 'ファイルのアップロードに失敗しました',
  FILE_SIZE_TOO_LARGE: 'ファイルサイズが上限を超えています',
  UNSUPPORTED_FILE_TYPE: 'サポートされていないファイル形式です',
  RATE_LIMIT_EXCEEDED: 'リクエスト制限を超えました',
  SERVICE_UNAVAILABLE: 'サービスが一時的に利用できません',
} as const;
```

## 3. レイヤー別エラーハンドリング

### 3.1 Domain Layer（ドメイン層）
```typescript
// domain/entities/Book.ts
export class Book {
  constructor(
    public id: string,
    public title: string,
    public author: string,
    public pageCount?: number
  ) {
    this.validateTitle(title);
    this.validateAuthor(author);
    if (pageCount !== undefined) {
      this.validatePageCount(pageCount);
    }
  }

  private validateTitle(title: string): void {
    if (!title.trim()) {
      throw new ValidationError('書籍タイトルは必須です', 'title', 'REQUIRED_FIELD');
    }
    if (title.length > 200) {
      throw new ValidationError('書籍タイトルは200文字以内で入力してください', 'title', 'TOO_LONG');
    }
  }

  private validatePageCount(pageCount: number): void {
    if (pageCount <= 0) {
      throw new ValidationError('ページ数は1以上の数値を入力してください', 'pageCount', 'PAGE_OUT_OF_RANGE');
    }
    if (pageCount > 10000) {
      throw new ValidationError('ページ数が上限を超えています', 'pageCount', 'PAGE_OUT_OF_RANGE');
    }
  }
}
```

### 3.2 Application Layer（アプリケーション層）
```typescript
// lib/book-service.ts
import { Logger } from '@/lib/logger';

export class BookService {
  constructor(
    private bookRepository: BookRepository,
    private logger: Logger
  ) {}

  async createBook(bookData: CreateBookData): Promise<Book> {
    try {
      const book = new Book(
        generateId(),
        bookData.title,
        bookData.author,
        bookData.pageCount
      );

      const savedBook = await this.bookRepository.save(book);
      this.logger.info('Book created successfully', { bookId: savedBook.id });
      
      return savedBook;
    } catch (error) {
      this.logger.error('Failed to create book', {
        error: error.message,
        bookData,
        stack: error.stack,
      });

      // ドメインエラーはそのまま再スロー
      if (error instanceof ValidationError) {
        throw error;
      }

      // その他のエラーはSystemErrorに変換
      throw new SystemError(
        '書籍の登録に失敗しました',
        'BOOK_CREATION_FAILED',
        error
      );
    }
  }
}
```

### 3.3 Infrastructure Layer（インフラストラクチャ層）
```typescript
// infrastructure/repositories/supabase-book-repository.ts
export class SupabaseBookRepository implements BookRepository {
  constructor(private supabase: SupabaseClient) {}

  async save(book: Book): Promise<Book> {
    try {
      const { data, error } = await this.supabase
        .from('books')
        .insert({
          id: book.id,
          title: book.title,
          author: book.author,
          page_count: book.pageCount,
        })
        .select()
        .single();

      if (error) {
        throw new SystemError(
          'データベースへの保存に失敗しました',
          'DB_INSERT_FAILED',
          error
        );
      }

      return this.mapToBook(data);
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }

      throw new SystemError(
        'データベース操作でエラーが発生しました',
        'DB_OPERATION_FAILED',
        error
      );
    }
  }
}
```

### 3.4 Presentation Layer（プレゼンテーション層）
```typescript
// components/BookForm.tsx
export function BookForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: BookFormData) => {
    try {
      setIsSubmitting(true);
      setErrors({});

      await bookService.createBook(data);
      toast.success('書籍を登録しました');
      router.push('/books');
    } catch (error) {
      handleFormError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormError = (error: Error) => {
    if (error instanceof ValidationError) {
      setErrors({ [error.field]: error.message });
    } else if (error instanceof SystemError) {
      toast.error(error.message);
    } else {
      toast.error('予期しないエラーが発生しました');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        error={errors.title}
        // ...other props
      />
      {/* その他のフィールド */}
    </form>
  );
}
```

## 4. グローバルエラーハンドリング

### 4.1 React Error Boundary
```typescript
// components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // エラー報告サービスに送信
    reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 4.2 Next.js エラーページ
```typescript
// app/error.tsx
'use client';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    logger.error('Next.js error page', {
      error: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          エラーが発生しました
        </h1>
        <p className="text-gray-600 mb-6">
          予期しないエラーが発生しました。しばらくしてから再度お試しください。
        </p>
        <div className="space-x-4">
          <Button onClick={reset}>
            再試行
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            ホームに戻る
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 4.3 API エラーハンドリング
```typescript
// app/api/books/route.ts
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const book = await bookService.createBook(data);
    
    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

function handleApiError(error: Error): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { 
        error: 'Validation Error',
        message: error.message,
        field: error.field,
        code: error.code,
      },
      { status: 400 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: 'Not Found', message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: 'Authentication Error', message: error.message },
      { status: 401 }
    );
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: 'Authorization Error', message: error.message },
      { status: 403 }
    );
  }

  // SystemErrorやその他のエラー
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
  });

  return NextResponse.json(
    { error: 'Internal Server Error', message: 'サーバーエラーが発生しました' },
    { status: 500 }
  );
}
```

## 5. ログ出力設計

### 5.1 ログレベル定義
```typescript
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}
```

### 5.2 ログ出力実装
```typescript
// lib/logger.ts
export class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  error(message: string, metadata?: Record<string, any>): void {
    const logEntry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.output(logEntry);
    this.sendToExternalService(logEntry);
  }

  private output(logEntry: LogEntry): void {
    if (this.isDevelopment) {
      console.error(JSON.stringify(logEntry, null, 2));
    } else {
      console.error(JSON.stringify(logEntry));
    }
  }

  private async sendToExternalService(logEntry: LogEntry): Promise<void> {
    // 本番環境では外部ログサービスに送信
    if (!this.isDevelopment && logEntry.level === LogLevel.ERROR) {
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry),
        });
      } catch (error) {
        // ログ送信の失敗は無視（無限ループを避ける）
        console.error('Failed to send log to external service');
      }
    }
  }
}
```

## 6. ユーザー向けエラーメッセージ

### 6.1 エラーメッセージの原則
- **具体的**: 何が問題なのかを明確に説明
- **アクション可能**: ユーザーが取るべき行動を示す
- **丁寧**: 責任を押し付けない、謝罪の言葉を含む
- **簡潔**: 技術的な詳細は避ける

### 6.2 エラーメッセージ例
```typescript
const UserErrorMessages = {
  // バリデーションエラー
  REQUIRED_FIELD: '必須項目です',
  INVALID_EMAIL: 'メールアドレスの形式で入力してください',
  INVALID_ISBN: 'ISBNは10桁または13桁の数字で入力してください',
  
  // 認証エラー
  INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
  SESSION_EXPIRED: 'セッションが期限切れです。再度ログインしてください',
  
  // 権限エラー
  ACCESS_DENIED: 'この操作を行う権限がありません',
  
  // システムエラー
  SERVER_ERROR: '一時的にサーバーエラーが発生しています。しばらくしてから再度お試しください',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。インターネット接続を確認してください',
  
  // 外部APIエラー
  GOOGLE_BOOKS_ERROR: '書籍情報の取得に失敗しました。手動で入力してください',
} as const;
```

## 7. エラー回復・リトライ戦略

### 7.1 自動リトライ実装
```typescript
// lib/retry.ts
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // リトライ対象外のエラーは即座に投げる
      if (shouldNotRetry(error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}

function shouldNotRetry(error: Error): boolean {
  return error instanceof ValidationError ||
         error instanceof AuthenticationError ||
         error instanceof AuthorizationError ||
         error instanceof NotFoundError;
}
```

### 7.2 楽観的更新とロールバック
```typescript
// hooks/useOptimisticUpdate.ts
export function useOptimisticUpdate<T>() {
  const [data, setData] = useState<T>();
  const [previousData, setPreviousData] = useState<T>();

  const performOptimisticUpdate = async (
    newData: T,
    operation: () => Promise<T>
  ) => {
    setPreviousData(data);
    setData(newData);

    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (error) {
      // ロールバック
      setData(previousData);
      throw error;
    }
  };

  return { data, performOptimisticUpdate };
}
```

## 8. エラー監視・分析

### 8.1 エラー報告サービス連携
```typescript
// lib/error-reporting.ts
export function reportError(error: Error, context?: Record<string, any>): void {
  if (process.env.NODE_ENV === 'production') {
    // Sentryやその他のエラー報告サービスに送信
    // Sentry.captureException(error, { extra: context });
  }
}
```

### 8.2 エラーメトリクス
```typescript
// エラー発生頻度の監視指標
const ErrorMetrics = {
  totalErrors: 0,
  errorsByType: new Map<string, number>(),
  errorsByPage: new Map<string, number>(),
  errorsByUser: new Map<string, number>(),
};
```

## 9. テスト戦略

### 9.1 エラーハンドリングのテスト
```typescript
// __tests__/book-service.test.ts
describe('BookService', () => {
  it('should throw ValidationError for invalid title', async () => {
    const invalidData = { title: '', author: 'Author' };
    
    await expect(bookService.createBook(invalidData))
      .rejects
      .toThrow(ValidationError);
  });

  it('should handle database errors gracefully', async () => {
    jest.spyOn(bookRepository, 'save').mockRejectedValue(new Error('DB Error'));
    
    await expect(bookService.createBook(validData))
      .rejects
      .toThrow(SystemError);
  });
});
```