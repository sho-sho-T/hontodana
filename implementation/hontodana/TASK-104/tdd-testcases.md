# TASK-104: 読書進捗管理システム - テストケース設計

## テスト戦略

### テスト分類
1. **単体テスト**: 個別機能の動作確認
2. **統合テスト**: データベース連携を含む全体フロー
3. **境界値テスト**: エッジケースの処理
4. **エラーテスト**: 異常系の処理

## 単体テストケース

### 1. 進捗率計算ロジック (calculateProgressPercentage)

#### TC-PR-001: 正常な進捗率計算
```typescript
describe('進捗率計算 - 正常系', () => {
  test('半分読了の場合、50%を返す', () => {
    const result = calculateProgressPercentage(150, 300)
    expect(result).toBe(50.0)
  })

  test('全て読了の場合、100%を返す', () => {
    const result = calculateProgressPercentage(300, 300)
    expect(result).toBe(100.0)
  })

  test('開始前の場合、0%を返す', () => {
    const result = calculateProgressPercentage(0, 300)
    expect(result).toBe(0.0)
  })

  test('小数点以下の計算が正確', () => {
    const result = calculateProgressPercentage(100, 300)
    expect(result).toBe(33.3)
  })
})
```

#### TC-PR-002: 境界値テスト
```typescript
describe('進捗率計算 - 境界値', () => {
  test('総ページ数が0の場合、0%を返す', () => {
    const result = calculateProgressPercentage(50, 0)
    expect(result).toBe(0.0)
  })

  test('総ページ数がnullの場合、0%を返す', () => {
    const result = calculateProgressPercentage(50, null)
    expect(result).toBe(0.0)
  })

  test('現在ページが総ページ数を超える場合、100%を返す', () => {
    const result = calculateProgressPercentage(350, 300)
    expect(result).toBe(100.0)
  })
})
```

### 2. 進捗バリデーション (validateProgressInput)

#### TC-PV-001: 正常なバリデーション
```typescript
describe('進捗バリデーション - 正常系', () => {
  test('有効な進捗データが通る', async () => {
    const input = {
      userBookId: 'valid-id',
      currentPage: 150,
      sessionNotes: 'メモ'
    }
    const result = await validateProgressInput(input)
    expect(result.isValid).toBe(true)
  })
})
```

#### TC-PV-002: 無効なデータのバリデーション
```typescript
describe('進捗バリデーション - 異常系', () => {
  test('無効なuserBookIdでエラー', async () => {
    const input = {
      userBookId: '',
      currentPage: 150
    }
    const result = await validateProgressInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('userBookIdが無効です')
  })

  test('負のページ数でエラー', async () => {
    const input = {
      userBookId: 'valid-id',
      currentPage: -10
    }
    const result = await validateProgressInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('ページ数は1以上である必要があります')
  })

  test('0ページでエラー', async () => {
    const input = {
      userBookId: 'valid-id',
      currentPage: 0
    }
    const result = await validateProgressInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('ページ数は1以上である必要があります')
  })
})
```

### 3. セッション時間計算 (calculateSessionDuration)

#### TC-SD-001: セッション時間計算
```typescript
describe('セッション時間計算', () => {
  test('1時間のセッション', () => {
    const startTime = new Date('2024-01-01T10:00:00Z')
    const endTime = new Date('2024-01-01T11:00:00Z')
    const duration = calculateSessionDuration(startTime, endTime)
    expect(duration).toBe(60)
  })

  test('30分のセッション', () => {
    const startTime = new Date('2024-01-01T10:00:00Z')
    const endTime = new Date('2024-01-01T10:30:00Z')
    const duration = calculateSessionDuration(startTime, endTime)
    expect(duration).toBe(30)
  })

  test('同じ時刻の場合、0分', () => {
    const time = new Date('2024-01-01T10:00:00Z')
    const duration = calculateSessionDuration(time, time)
    expect(duration).toBe(0)
  })
})
```

## 統合テストケース

### 4. updateReadingProgress Server Action

#### TC-UP-001: 正常な進捗更新
```typescript
describe('進捗更新 - 正常系', () => {
  test('初回進捗更新が成功', async () => {
    // 準備
    const userBook = await createTestUserBook({
      progress: 0,
      status: BookStatus.WANT_TO_READ
    })

    // 実行
    const result = await updateReadingProgress({
      userBookId: userBook.id,
      currentPage: 50,
      sessionNotes: 'chapter 3まで読了'
    })

    // 検証
    expect(result.success).toBe(true)
    expect(result.updatedUserBook.progress).toBe(50)
    expect(result.updatedUserBook.status).toBe(BookStatus.READING)
    expect(result.newSession.startPage).toBe(1)
    expect(result.newSession.endPage).toBe(50)
    expect(result.progressPercentage).toBe(16.7) // 50/300
  })

  test('継続的な進捗更新が成功', async () => {
    // 準備
    const userBook = await createTestUserBook({
      progress: 100,
      status: BookStatus.READING
    })

    // 実行
    const result = await updateReadingProgress({
      userBookId: userBook.id,
      currentPage: 150,
      sessionNotes: 'chapter 5まで読了'
    })

    // 検証
    expect(result.success).toBe(true)
    expect(result.updatedUserBook.progress).toBe(150)
    expect(result.newSession.startPage).toBe(101)
    expect(result.newSession.endPage).toBe(150)
    expect(result.progressPercentage).toBe(50.0)
  })

  test('読了完了時の処理', async () => {
    // 準備
    const userBook = await createTestUserBook({
      progress: 250,
      status: BookStatus.READING,
      book: { pageCount: 300 }
    })

    // 実行
    const result = await updateReadingProgress({
      userBookId: userBook.id,
      currentPage: 300,
      sessionNotes: '読了！'
    })

    // 検証
    expect(result.success).toBe(true)
    expect(result.updatedUserBook.progress).toBe(300)
    expect(result.updatedUserBook.status).toBe(BookStatus.READ)
    expect(result.isCompleted).toBe(true)
    expect(result.progressPercentage).toBe(100.0)
  })
})
```

#### TC-UP-002: エラーケース
```typescript
describe('進捗更新 - エラー系', () => {
  test('存在しないuserBookIdでエラー', async () => {
    const result = await updateReadingProgress({
      userBookId: 'non-existent-id',
      currentPage: 50
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('指定された書籍が見つかりません')
  })

  test('進捗の逆行でエラー', async () => {
    // 準備
    const userBook = await createTestUserBook({
      progress: 100,
      status: BookStatus.READING
    })

    // 実行
    const result = await updateReadingProgress({
      userBookId: userBook.id,
      currentPage: 50  // 逆行
    })

    // 検証
    expect(result.success).toBe(false)
    expect(result.error).toBe('進捗を逆行させることはできません')
  })

  test('総ページ数の超過でエラー', async () => {
    // 準備
    const userBook = await createTestUserBook({
      progress: 200,
      status: BookStatus.READING,
      book: { pageCount: 300 }
    })

    // 実行
    const result = await updateReadingProgress({
      userBookId: userBook.id,
      currentPage: 350  // 超過
    })

    // 検証
    expect(result.success).toBe(false)
    expect(result.error).toBe('総ページ数を超えています')
  })
})
```

### 5. 統計データ生成 (generateReadingStats)

#### TC-RS-001: 基本統計データ
```typescript
describe('統計データ生成', () => {
  test('基本統計が正しく計算される', async () => {
    // 準備：複数のセッションデータを作成
    await createTestSessions([
      { duration: 30, pagesRead: 20 },
      { duration: 45, pagesRead: 30 },
      { duration: 60, pagesRead: 25 }
    ])

    // 実行
    const stats = await generateReadingStats('user-id')

    // 検証
    expect(stats.totalReadingTime).toBe(135) // 30+45+60
    expect(stats.averageSessionTime).toBe(45) // 135/3
    expect(stats.averagePagesPerDay).toBeCloseTo(25.0, 1) // 75/3
  })

  test('データがない場合の統計', async () => {
    const stats = await generateReadingStats('user-with-no-data')

    expect(stats.totalReadingTime).toBe(0)
    expect(stats.averageSessionTime).toBe(0)
    expect(stats.averagePagesPerDay).toBe(0)
    expect(stats.dailyPagesRead).toEqual([])
  })
})
```

## エラーテストケース

### 6. データベース関連エラー

#### TC-DB-001: データベース接続エラー
```typescript
describe('データベースエラー処理', () => {
  test('データベース接続失敗時の処理', async () => {
    // モック：データベース接続を失敗させる
    jest.spyOn(prisma, '$connect').mockRejectedValue(
      new Error('Database connection failed')
    )

    const result = await updateReadingProgress({
      userBookId: 'valid-id',
      currentPage: 50
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('データベースエラーが発生しました')
  })

  test('トランザクション失敗時の処理', async () => {
    // モック：トランザクションを失敗させる
    jest.spyOn(prisma, '$transaction').mockRejectedValue(
      new Error('Transaction failed')
    )

    const result = await updateReadingProgress({
      userBookId: 'valid-id',
      currentPage: 50
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('進捗の更新に失敗しました')
  })
})
```

### 7. 同時更新競合

#### TC-CC-001: 競合状態の処理
```typescript
describe('同時更新競合', () => {
  test('同時更新時の競合処理', async () => {
    const userBookId = 'test-book-id'
    
    // 並行して進捗更新を実行
    const [result1, result2] = await Promise.all([
      updateReadingProgress({
        userBookId,
        currentPage: 100
      }),
      updateReadingProgress({
        userBookId,
        currentPage: 120
      })
    ])

    // 一つが成功し、一つが競合エラーになること
    const successCount = [result1, result2].filter(r => r.success).length
    expect(successCount).toBe(1)
  })
})
```

## パフォーマンステストケース

### 8. レスポンス時間テスト

#### TC-PT-001: パフォーマンス要件
```typescript
describe('パフォーマンステスト', () => {
  test('進捗更新が1秒以内に完了', async () => {
    const startTime = Date.now()
    
    await updateReadingProgress({
      userBookId: 'valid-id',
      currentPage: 50
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(1000)
  })

  test('統計データ生成が3秒以内に完了', async () => {
    const startTime = Date.now()
    
    await generateReadingStats('user-id')
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(3000)
  })

  test('大量データでの統計処理', async () => {
    // 1000件のセッションデータを作成
    await createBulkTestSessions(1000)
    
    const startTime = Date.now()
    const stats = await generateReadingStats('user-id')
    const endTime = Date.now()
    
    expect(endTime - startTime).toBeLessThan(5000)
    expect(stats.totalReadingTime).toBeGreaterThan(0)
  })
})
```

## テスト実行戦略

### テスト分類別実行

1. **Fast Tests** (単体テスト): 0.1秒以内
   - 計算ロジック
   - バリデーション
   - データ変換

2. **Integration Tests** (統合テスト): 1秒以内
   - Server Actions
   - データベース操作
   - API エンドポイント

3. **Slow Tests** (E2Eテスト): 5秒以内
   - フロー全体
   - パフォーマンステスト

### テストデータ管理

- **セットアップ**: 各テストで独立したテストデータ作成
- **クリーンアップ**: テスト完了後のデータ削除
- **モック**: 外部依存の適切なモック化

### カバレッジ目標

- **ライン カバレッジ**: 90%以上
- **ブランチ カバレッジ**: 85%以上
- **機能 カバレッジ**: 100%（全機能のテスト）