# TASK-303: データエクスポート・インポート機能 - テストケース

## テスト戦略

### テストレベル
- **単体テスト**: 各変換ロジック、ユーティリティ関数
- **統合テスト**: API エンドポイント、データベース操作
- **E2E テスト**: ユーザーフロー全体
- **パフォーマンステスト**: 大量データ処理

### テスト環境
- **テストDB**: PostgreSQL テストインスタンス
- **モックデータ**: 様々なパターンの書籍・ユーザーデータ
- **ファイル**: 一時ディレクトリでのファイル操作

## 単体テスト

### 1. データ変換ロジック

#### 1.1 JSON エクスポート変換
```typescript
describe('ExportService - JSON変換', () => {
  test('完全なユーザーデータをJSON形式に変換', () => {
    // Arrange: モックユーザーデータを準備
    const userData = createMockUserData();
    
    // Act: JSON変換実行
    const result = exportToJson(userData);
    
    // Assert: 期待する構造とデータ
    expect(result.metadata.format).toBe('hontodana-v1');
    expect(result.userBooks).toHaveLength(userData.userBooks.length);
    expect(result.collections).toHaveLength(userData.collections.length);
  });

  test('空のデータでもエラーなく変換', () => {
    const emptyData = createEmptyUserData();
    const result = exportToJson(emptyData);
    
    expect(result.metadata).toBeDefined();
    expect(result.userBooks).toEqual([]);
    expect(result.wishlistItems).toEqual([]);
  });

  test('日付範囲フィルタリング', () => {
    const userData = createMockUserData();
    const dateRange = { from: new Date('2024-01-01'), to: new Date('2024-12-31') };
    
    const result = exportToJson(userData, { dateRange });
    
    // 指定期間内の読書セッションのみ含まれることを確認
    result.readingSessions.forEach(session => {
      expect(new Date(session.sessionDate)).toBeWithinRange(dateRange);
    });
  });
});
```

#### 1.2 CSV エクスポート変換
```typescript
describe('ExportService - CSV変換', () => {
  test('本棚データをCSV形式に変換', () => {
    const userData = createMockUserData();
    
    const csvContent = exportToCsv(userData);
    
    // CSVヘッダーの確認
    const lines = csvContent.split('\n');
    expect(lines[0]).toContain('Title,Authors,Status,CurrentPage,Rating');
    
    // データ行の確認
    expect(lines.length).toBe(userData.userBooks.length + 1); // +1 for header
  });

  test('特殊文字のエスケープ処理', () => {
    const bookWithSpecialChars = {
      title: 'Book with "quotes" and, commas',
      authors: ['Author, Name'],
    };
    
    const csvContent = exportToCsv({ userBooks: [bookWithSpecialChars] });
    
    expect(csvContent).toContain('"Book with ""quotes"" and, commas"');
  });
});
```

#### 1.3 インポート変換
```typescript
describe('ImportService - データ変換', () => {
  test('有効なJSONファイルの解析', async () => {
    const jsonData = createValidJsonExport();
    
    const result = await parseImportFile(jsonData, 'json');
    
    expect(result.isValid).toBe(true);
    expect(result.data.userBooks).toBeDefined();
    expect(result.errors).toHaveLength(0);
  });

  test('無効なJSONファイルでエラー検出', async () => {
    const invalidJson = '{"invalid": json}';
    
    const result = await parseImportFile(invalidJson, 'json');
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid JSON format');
  });

  test('CSVファイルの解析', async () => {
    const csvContent = createValidCsvExport();
    
    const result = await parseImportFile(csvContent, 'csv');
    
    expect(result.isValid).toBe(true);
    expect(result.data.userBooks.length).toBeGreaterThan(0);
  });

  test('Goodreads形式の変換', async () => {
    const goodreadsData = createGoodreadsCsvExport();
    
    const result = await parseImportFile(goodreadsData, 'goodreads');
    
    expect(result.isValid).toBe(true);
    // Goodreads特有のフィールドマッピング確認
    expect(result.data.userBooks[0].rating).toBeDefined();
  });
});
```

### 2. ユーティリティ関数

#### 2.1 データバリデーション
```typescript
describe('ValidationUtils', () => {
  test('書籍データの妥当性検証', () => {
    const validBook = createValidBookData();
    expect(validateBookData(validBook)).toBe(true);
    
    const invalidBook = { ...validBook, title: '' };
    expect(validateBookData(invalidBook)).toBe(false);
  });

  test('ページ数の範囲チェック', () => {
    expect(validatePageNumber(100, 200)).toBe(true);
    expect(validatePageNumber(-1, 200)).toBe(false);
    expect(validatePageNumber(300, 200)).toBe(false);
  });
});
```

#### 2.2 重複データ処理
```typescript
describe('DuplicateHandler', () => {
  test('同じISBNの書籍の重複検出', () => {
    const existingBooks = [{ isbn13: '9781234567890', title: 'Existing Book' }];
    const newBook = { isbn13: '9781234567890', title: 'New Book' };
    
    const isDuplicate = checkBookDuplicate(newBook, existingBooks);
    
    expect(isDuplicate).toBe(true);
  });

  test('タイトルと著者での類似度判定', () => {
    const book1 = { title: 'JavaScript: The Good Parts', authors: ['Douglas Crockford'] };
    const book2 = { title: 'Javascript: The Good Parts', authors: ['Douglas Crockford'] }; // 大文字小文字違い
    
    const similarity = calculateBookSimilarity(book1, book2);
    
    expect(similarity).toBeGreaterThan(0.9);
  });
});
```

## 統合テスト

### 3. API エンドポイント

#### 3.1 エクスポート API
```typescript
describe('POST /api/export', () => {
  test('認証済みユーザーのデータエクスポート', async () => {
    const user = await createTestUser();
    await createTestUserBooks(user.id, 10);
    
    const response = await request(app)
      .post('/api/export')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        format: 'json',
        dataTypes: ['userBooks', 'wishlist']
      });
    
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    
    const exportData = JSON.parse(response.body);
    expect(exportData.metadata.userId).toBe(user.id);
    expect(exportData.userBooks).toHaveLength(10);
  });

  test('未認証ユーザーは401エラー', async () => {
    const response = await request(app)
      .post('/api/export')
      .send({ format: 'json' });
    
    expect(response.status).toBe(401);
  });

  test('不正な形式指定で400エラー', async () => {
    const user = await createTestUser();
    
    const response = await request(app)
      .post('/api/export')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ format: 'invalid' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid format');
  });
});
```

#### 3.2 インポート API
```typescript
describe('POST /api/import', () => {
  test('有効なJSONファイルのインポート', async () => {
    const user = await createTestUser();
    const exportData = createValidJsonExport();
    
    const response = await request(app)
      .post('/api/import')
      .set('Authorization', `Bearer ${user.token}`)
      .attach('file', Buffer.from(JSON.stringify(exportData)), 'export.json');
    
    expect(response.status).toBe(200);
    expect(response.body.jobId).toBeDefined();
    
    // ジョブ完了まで待機
    await waitForJobCompletion(response.body.jobId);
    
    // データベースに正しくインポートされているか確認
    const userBooks = await getUserBooks(user.id);
    expect(userBooks.length).toBe(exportData.userBooks.length);
  });

  test('ファイルサイズ制限超過で413エラー', async () => {
    const user = await createTestUser();
    const largeFile = Buffer.alloc(100 * 1024 * 1024); // 100MB
    
    const response = await request(app)
      .post('/api/import')
      .set('Authorization', `Bearer ${user.token}`)
      .attach('file', largeFile, 'large.json');
    
    expect(response.status).toBe(413);
  });

  test('重複データのマージ処理', async () => {
    const user = await createTestUser();
    const existingBook = await createTestUserBook(user.id);
    
    const importData = {
      userBooks: [{ 
        ...existingBook,
        rating: 5,
        review: 'Updated review'
      }]
    };
    
    const response = await request(app)
      .post('/api/import')
      .set('Authorization', `Bearer ${user.token}`)
      .attach('file', Buffer.from(JSON.stringify(importData)), 'update.json');
    
    await waitForJobCompletion(response.body.jobId);
    
    const updatedBook = await getUserBook(user.id, existingBook.bookId);
    expect(updatedBook.rating).toBe(5);
    expect(updatedBook.review).toBe('Updated review');
  });
});
```

### 4. ジョブ処理

#### 4.1 非同期処理
```typescript
describe('ImportJob', () => {
  test('大量データの段階的処理', async () => {
    const importData = createLargeImportData(1000); // 1000冊
    const job = new ImportJob(importData, userId);
    
    const progressUpdates = [];
    job.on('progress', (progress) => progressUpdates.push(progress));
    
    await job.execute();
    
    // 進捗が段階的に更新されることを確認
    expect(progressUpdates.length).toBeGreaterThan(5);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
  });

  test('エラー時のロールバック', async () => {
    const importData = createImportDataWithError();
    const job = new ImportJob(importData, userId);
    
    await expect(job.execute()).rejects.toThrow();
    
    // データベースに不正なデータが残っていないことを確認
    const userBooks = await getUserBooks(userId);
    expect(userBooks).toHaveLength(0);
  });
});
```

## パフォーマンステスト

### 5. 大量データ処理

#### 5.1 エクスポート性能
```typescript
describe('Export Performance', () => {
  test('1000冊データのエクスポートが30秒以内', async () => {
    const user = await createTestUser();
    await createTestUserBooks(user.id, 1000);
    
    const startTime = Date.now();
    
    const response = await request(app)
      .post('/api/export')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ format: 'json', dataTypes: ['userBooks'] });
    
    const duration = Date.now() - startTime;
    
    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(30000); // 30秒
  });

  test('メモリ使用量の制限内での処理', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    await performLargeExport();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB以内
  });
});
```

#### 5.2 インポート性能
```typescript
describe('Import Performance', () => {
  test('500冊データのインポートが60秒以内', async () => {
    const importData = createImportData(500);
    const job = new ImportJob(importData, userId);
    
    const startTime = Date.now();
    await job.execute();
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(60000); // 60秒
  });
});
```

## エラーハンドリングテスト

### 6. 異常系テスト

#### 6.1 データベースエラー
```typescript
describe('Database Error Handling', () => {
  test('データベース接続失敗時のエラーハンドリング', async () => {
    // データベース接続を一時的に無効化
    await disconnectDatabase();
    
    const response = await request(app)
      .post('/api/export')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ format: 'json' });
    
    expect(response.status).toBe(500);
    expect(response.body.error).toContain('Database connection failed');
  });

  test('トランザクションロールバック', async () => {
    const importData = createImportDataWithConstraintViolation();
    
    await expect(async () => {
      await importUserData(userId, importData);
    }).rejects.toThrow();
    
    // 部分的なデータも残っていないことを確認
    const userBooks = await getUserBooks(userId);
    expect(userBooks).toHaveLength(0);
  });
});
```

#### 6.2 ファイル処理エラー
```typescript
describe('File Error Handling', () => {
  test('破損したファイルの検出', async () => {
    const corruptedFile = Buffer.from('corrupted data');
    
    const response = await request(app)
      .post('/api/import')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', corruptedFile, 'corrupted.json');
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid file format');
  });

  test('ディスク容量不足の対応', async () => {
    // モックでディスク容量不足をシミュレート
    jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('ENOSPC'));
    
    const response = await request(app)
      .post('/api/export')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ format: 'json' });
    
    expect(response.status).toBe(507); // Insufficient Storage
  });
});
```

## セキュリティテスト

### 7. セキュリティ要件

#### 7.1 アクセス制御
```typescript
describe('Security Tests', () => {
  test('他のユーザーのデータアクセス拒否', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    
    // user1のトークンでuser2のデータをエクスポートしようとする
    const response = await request(app)
      .post('/api/export')
      .set('Authorization', `Bearer ${user1.token}`)
      .send({ 
        format: 'json',
        userId: user2.id // 不正なパラメータ
      });
    
    expect(response.status).toBe(403);
  });

  test('悪意のあるファイルの検出', async () => {
    const maliciousFile = createMaliciousJsonFile();
    
    const response = await request(app)
      .post('/api/import')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', maliciousFile, 'malicious.json');
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Security violation detected');
  });
});
```

#### 7.2 Rate Limiting
```typescript
describe('Rate Limiting', () => {
  test('エクスポート頻度制限', async () => {
    const user = await createTestUser();
    
    // 1回目は成功
    const response1 = await request(app)
      .post('/api/export')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ format: 'json' });
    expect(response1.status).toBe(200);
    
    // 即座に2回目は制限される
    const response2 = await request(app)
      .post('/api/export')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ format: 'json' });
    expect(response2.status).toBe(429);
  });
});
```

## テストデータ設定

### 8. モックデータ作成

```typescript
// テストユーティリティ関数
function createMockUserData() {
  return {
    userProfile: {
      id: 'user-1',
      name: 'Test User',
      theme: 'light',
      displayMode: 'grid'
    },
    books: [
      {
        id: 'book-1',
        title: 'Test Book 1',
        authors: ['Author 1'],
        isbn13: '9781234567890',
        pageCount: 200
      }
    ],
    userBooks: [
      {
        id: 'userbook-1',
        userId: 'user-1',
        bookId: 'book-1',
        status: 'reading',
        currentPage: 100,
        rating: 4
      }
    ],
    readingSessions: [
      {
        id: 'session-1',
        userBookId: 'userbook-1',
        startPage: 80,
        endPage: 100,
        sessionDate: '2024-01-15'
      }
    ],
    wishlistItems: [],
    collections: []
  };
}

function createValidJsonExport() {
  return {
    metadata: {
      version: '1.0.0',
      exportDate: '2024-01-15T10:00:00.000Z',
      userId: 'user-1',
      format: 'hontodana-v1'
    },
    ...createMockUserData()
  };
}
```

## テスト実行計画

### Phase 1: 基本機能テスト
- [ ] 単体テスト: データ変換ロジック
- [ ] 統合テスト: 基本的なエクスポート・インポート
- [ ] エラーハンドリングテスト

### Phase 2: 高度な機能テスト
- [ ] パフォーマンステスト
- [ ] セキュリティテスト
- [ ] 重複データ処理テスト

### Phase 3: E2E テスト
- [ ] ユーザーフロー全体
- [ ] モバイル対応
- [ ] アクセシビリティテスト

## カバレッジ目標
- **行カバレッジ**: 90%以上
- **分岐カバレッジ**: 85%以上
- **関数カバレッジ**: 95%以上