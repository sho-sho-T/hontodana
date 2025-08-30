# TASK-403: エラーハンドリング・ロギング - Test Cases Phase

## テストケース仕様書

### テスト対象コンポーネント

#### 1. エラー管理システム (`lib/errors/`)
- **AppError クラス**: カスタムエラークラス
- **ErrorHandler**: エラー処理ユーティリティ  
- **ErrorMapper**: エラーマッピング機能

#### 2. ログシステム (`lib/logging/`)
- **Logger クラス**: ログ出力機能
- **LogFormatter**: ログフォーマット機能
- **LogLevel**: ログレベル管理

#### 3. エラー境界 (`components/errors/`)
- **ErrorBoundary**: React エラー境界コンポーネント
- **ErrorFallback**: フォールバック UI

#### 4. トースト通知 (`lib/notifications/`)
- **NotificationManager**: 通知管理
- **ToastQueue**: 通知キュー管理

## 単体テストケース

### 1. AppError クラステスト (`__tests__/errors/app-error.test.ts`)

#### TC-001: エラーオブジェクト生成
```typescript
describe('AppError', () => {
  test('should create error with required fields', () => {
    // Given
    const errorType = ErrorType.VALIDATION;
    const code = 'INVALID_INPUT';
    const message = 'Invalid input provided';
    
    // When  
    const error = new AppError(errorType, code, message);
    
    // Then
    expect(error.id).toBeDefined();
    expect(error.type).toBe(errorType);
    expect(error.code).toBe(code);  
    expect(error.message).toBe(message);
    expect(error.timestamp).toBeInstanceOf(Date);
  });
});
```

#### TC-002: エラーメタデータ設定
```typescript
test('should include metadata when provided', () => {
  // Given
  const context = { field: 'email', value: 'invalid-email' };
  
  // When
  const error = new AppError(
    ErrorType.VALIDATION, 
    'INVALID_EMAIL', 
    'Invalid email format',
    { context }
  );
  
  // Then
  expect(error.context).toEqual(context);
});
```

#### TC-003: スタックトレース処理
```typescript
test('should capture stack trace in development', () => {
  // Given
  process.env.NODE_ENV = 'development';
  
  // When
  const error = new AppError(ErrorType.INTERNAL, 'DEV_ERROR', 'Dev error');
  
  // Then
  expect(error.stack).toBeDefined();
  expect(typeof error.stack).toBe('string');
});

test('should not include stack trace in production', () => {
  // Given
  process.env.NODE_ENV = 'production';
  
  // When
  const error = new AppError(ErrorType.INTERNAL, 'PROD_ERROR', 'Prod error');
  
  // Then
  expect(error.stack).toBeUndefined();
});
```

### 2. Logger クラステスト (`__tests__/logging/logger.test.ts`)

#### TC-004: ログレベル管理
```typescript
describe('Logger', () => {
  test('should log at correct level', () => {
    // Given
    const logger = new Logger('test');
    const consoleSpy = jest.spyOn(console, 'log');
    
    // When
    logger.info('Test message');
    
    // Then
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LogLevel.INFO,
        message: 'Test message'
      })
    );
  });
});
```

#### TC-005: ログエントリ構造
```typescript
test('should format log entry correctly', () => {
  // Given
  const logger = new Logger('test');
  const consoleSpy = jest.spyOn(console, 'log');
  
  // When
  logger.error('Error occurred', { userId: 'user123' });
  
  // Then
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      id: expect.any(String),
      level: LogLevel.ERROR,
      message: 'Error occurred',
      timestamp: expect.any(Date),
      metadata: { userId: 'user123' }
    })
  );
});
```

#### TC-006: 機密情報マスキング
```typescript
test('should mask sensitive information', () => {
  // Given
  const logger = new Logger('test');
  const consoleSpy = jest.spyOn(console, 'log');
  
  // When
  logger.info('User login', { 
    email: 'user@example.com',
    password: 'secret123',
    token: 'jwt-token-here'
  });
  
  // Then
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      metadata: {
        email: 'user@example.com',
        password: '***MASKED***',
        token: '***MASKED***'
      }
    })
  );
});
```

### 3. ErrorBoundary コンポーネントテスト (`__tests__/components/error-boundary.test.tsx`)

#### TC-007: エラーキャッチ機能
```typescript
describe('ErrorBoundary', () => {
  test('should catch and display error fallback', () => {
    // Given
    const ThrowError = () => {
      throw new Error('Test error');
    };
    
    // When
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    // Then
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
```

#### TC-008: エラーリセット機能
```typescript
test('should reset error state when retry clicked', () => {
  // Given
  let shouldThrow = true;
  const ConditionalError = () => {
    if (shouldThrow) throw new Error('Test error');
    return <div>Content loaded</div>;
  };
  
  render(
    <ErrorBoundary>
      <ConditionalError />
    </ErrorBoundary>
  );
  
  // When
  shouldThrow = false;
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  
  // Then
  expect(screen.getByText('Content loaded')).toBeInTheDocument();
});
```

### 4. NotificationManager テスト (`__tests__/notifications/manager.test.ts`)

#### TC-009: 通知表示機能
```typescript
describe('NotificationManager', () => {
  test('should display error notification', () => {
    // Given
    const manager = new NotificationManager();
    const mockToast = jest.fn();
    manager.setToastImplementation(mockToast);
    
    // When
    manager.showError('Operation failed');
    
    // Then
    expect(mockToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'Operation failed',
      duration: 5000
    });
  });
});
```

#### TC-010: 通知キュー管理
```typescript
test('should queue multiple notifications', () => {
  // Given
  const manager = new NotificationManager();
  const notifications: any[] = [];
  manager.setToastImplementation((notification) => {
    notifications.push(notification);
  });
  
  // When
  manager.showInfo('Info message');
  manager.showWarning('Warning message');
  manager.showError('Error message');
  
  // Then
  expect(notifications).toHaveLength(3);
  expect(notifications[0].type).toBe('info');
  expect(notifications[1].type).toBe('warning');
  expect(notifications[2].type).toBe('error');
});
```

## 統合テストケース

### 5. API エラーハンドリング統合テスト (`__tests__/integration/api-error-handling.test.ts`)

#### TC-011: ネットワークエラー処理
```typescript
describe('API Error Handling Integration', () => {
  test('should handle network connection failure', async () => {
    // Given
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network Error'));
    global.fetch = mockFetch;
    
    // When
    const result = await searchBooks('test query');
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.NETWORK,
        code: 'NETWORK_ERROR',
        message: '通信エラーが発生しました。インターネット接続を確認してください。'
      }
    });
  });
});
```

#### TC-012: API レート制限エラー処理
```typescript
test('should handle API rate limit exceeded', async () => {
  // Given
  const mockFetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 429,
    statusText: 'Too Many Requests'
  });
  global.fetch = mockFetch;
  
  // When  
  const result = await searchBooks('test query');
  
  // Then
  expect(result).toEqual({
    success: false,
    error: {
      type: ErrorType.RATE_LIMIT,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'リクエスト制限を超えました。しばらく待ってから再試行してください。'
    }
  });
});
```

### 6. データベースエラー処理統合テスト (`__tests__/integration/database-error-handling.test.ts`)

#### TC-013: データベース接続エラー
```typescript
describe('Database Error Handling Integration', () => {
  test('should handle database connection failure', async () => {
    // Given
    const mockPrisma = {
      book: {
        create: jest.fn().mockRejectedValue(new Error('Connection failed'))
      }
    };
    
    // When
    const result = await addBookToLibrary(mockBookData);
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.DATABASE,
        code: 'CONNECTION_FAILED',
        message: 'データベースに接続できませんでした。'
      }
    });
  });
});
```

#### TC-014: 一意制約違反エラー
```typescript
test('should handle unique constraint violation', async () => {
  // Given
  const mockPrisma = {
    book: {
      create: jest.fn().mockRejectedValue({
        code: 'P2002',
        meta: { target: ['isbn'] }
      })
    }
  };
  
  // When
  const result = await addBookToLibrary(mockBookData);
  
  // Then
  expect(result).toEqual({
    success: false,
    error: {
      type: ErrorType.CONFLICT,
      code: 'BOOK_ALREADY_EXISTS',
      message: 'この書籍は既に登録されています。'
    }
  });
});
```

## エラーテストケース

### 7. 境界値・異常系テスト (`__tests__/edge-cases/error-handling.test.ts`)

#### TC-015: 大量エラー発生時の処理
```typescript
describe('Edge Cases - Error Handling', () => {
  test('should handle burst of errors without memory leak', () => {
    // Given
    const logger = new Logger('test');
    const initialMemory = process.memoryUsage().heapUsed;
    
    // When
    for (let i = 0; i < 1000; i++) {
      logger.error(`Error ${i}`, { index: i });
    }
    
    // Then  
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB未満
  });
});
```

#### TC-016: 循環参照オブジェクトのログ処理
```typescript
test('should handle circular reference in log metadata', () => {
  // Given
  const logger = new Logger('test');
  const circularObj: any = { name: 'test' };
  circularObj.self = circularObj;
  
  // When & Then
  expect(() => {
    logger.info('Circular reference test', { data: circularObj });
  }).not.toThrow();
});
```

#### TC-017: 深いネストオブジェクトのログ処理
```typescript
test('should handle deeply nested objects in logs', () => {
  // Given
  const logger = new Logger('test');
  const deepObj = createDeepObject(100); // 100レベルのネスト
  
  // When & Then
  expect(() => {
    logger.info('Deep object test', { data: deepObj });
  }).not.toThrow();
});
```

## パフォーマンステストケース

### 8. ログ出力パフォーマンステスト (`__tests__/performance/logging.test.ts`)

#### TC-018: ログ出力速度テスト
```typescript
describe('Performance - Logging', () => {
  test('should log within performance requirements', () => {
    // Given
    const logger = new Logger('perf-test');
    
    // When
    const startTime = performance.now();
    for (let i = 0; i < 100; i++) {
      logger.info(`Performance test ${i}`);
    }
    const endTime = performance.now();
    
    // Then
    const avgTime = (endTime - startTime) / 100;
    expect(avgTime).toBeLessThan(50); // 50ms未満
  });
});
```

#### TC-019: エラー処理パフォーマンステスト  
```typescript
test('should handle errors within performance requirements', () => {
  // Given
  const errorHandler = new ErrorHandler();
  
  // When
  const startTime = performance.now();
  for (let i = 0; i < 100; i++) {
    const error = new AppError(ErrorType.VALIDATION, 'TEST', 'Test error');
    errorHandler.handleError(error);
  }
  const endTime = performance.now();
  
  // Then
  const avgTime = (endTime - startTime) / 100;
  expect(avgTime).toBeLessThan(100); // 100ms未満
});
```

## E2Eテストケース

### 9. エラーフロー E2E テスト (`__tests__/e2e/error-flow.test.ts`)

#### TC-020: ネットワークエラー時のユーザー体験
```typescript
describe('E2E - Error Flow', () => {
  test('should show appropriate error message when network fails', async () => {
    // Given
    page.route('**/api/books/search*', route => route.abort());
    
    // When
    await page.fill('[data-testid=search-input]', 'test query');
    await page.click('[data-testid=search-button]');
    
    // Then
    await expect(page.locator('[data-testid=error-message]')).toHaveText(
      '通信エラーが発生しました。インターネット接続を確認してください。'
    );
    await expect(page.locator('[data-testid=retry-button]')).toBeVisible();
  });
});
```

#### TC-021: エラー回復フロー
```typescript
test('should recover from error when retry succeeds', async () => {
  // Given
  let failCount = 0;
  page.route('**/api/books/search*', route => {
    failCount++;
    if (failCount <= 1) {
      route.abort();
    } else {
      route.continue();
    }
  });
  
  // When
  await page.fill('[data-testid=search-input]', 'test query');
  await page.click('[data-testid=search-button]');
  
  // Error state
  await expect(page.locator('[data-testid=error-message]')).toBeVisible();
  
  // Retry
  await page.click('[data-testid=retry-button]');
  
  // Then
  await expect(page.locator('[data-testid=search-results]')).toBeVisible();
  await expect(page.locator('[data-testid=error-message]')).not.toBeVisible();
});
```

## テストデータ・モック定義

### Mock データ
```typescript
// エラーテスト用のモックデータ
export const mockErrors = {
  networkError: new Error('Network Error'),
  databaseError: { code: 'P1001', message: 'Connection failed' },
  validationError: { field: 'email', message: 'Invalid format' },
  authError: { code: 'UNAUTHORIZED', message: 'Invalid credentials' }
};

// APIレスポンスモック
export const mockApiResponses = {
  rateLimit: { ok: false, status: 429, statusText: 'Too Many Requests' },
  serverError: { ok: false, status: 500, statusText: 'Internal Server Error' },
  notFound: { ok: false, status: 404, statusText: 'Not Found' }
};
```

## テスト実行要件

### 実行環境
- **Node.js**: v18以上
- **Jest**: v29以上  
- **React Testing Library**: v13以上
- **Playwright**: v1.40以上（E2Eテスト）

### カバレッジ目標
- **行カバレッジ**: 90%以上
- **関数カバレッジ**: 95%以上
- **分岐カバレッジ**: 85%以上

### CI/CD 統合
- 全テスト通過必須
- カバレッジ基準未満でビルド失敗
- E2Eテストは本番デプロイ前必須

## 次フェーズ: Red Phase

テストケース作成完了後、失敗テストを実装して TDD Red フェーズに移行します。