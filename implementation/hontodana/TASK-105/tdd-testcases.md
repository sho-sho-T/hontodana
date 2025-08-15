# TASK-105: ウィッシュリスト機能 - テストケース設計

## テスト戦略

### テスト分類
1. **単体テスト**: ウィッシュリスト管理ロジック
2. **統合テスト**: Server Actions とデータベース連携
3. **UI テスト**: コンポーネントの動作確認
4. **エラーテスト**: 異常系の処理

## 単体テストケース

### 1. ウィッシュリスト優先度管理 (wishlist-utils)

#### TC-WU-001: 優先度ソート機能
```typescript
describe('wishlist-utils', () => {
  describe('sortByPriority', () => {
    test('優先度順で正しくソートされる', () => {
      const items = [
        { priority: 'medium', title: 'Book B' },
        { priority: 'urgent', title: 'Book A' },
        { priority: 'low', title: 'Book D' },
        { priority: 'high', title: 'Book C' }
      ]
      
      const sorted = sortByPriority(items)
      
      expect(sorted[0].priority).toBe('urgent')
      expect(sorted[1].priority).toBe('high')
      expect(sorted[2].priority).toBe('medium')
      expect(sorted[3].priority).toBe('low')
    })

    test('同じ優先度の場合はタイトル順', () => {
      const items = [
        { priority: 'medium', title: 'Book C' },
        { priority: 'medium', title: 'Book A' },
        { priority: 'medium', title: 'Book B' }
      ]
      
      const sorted = sortByPriority(items, { secondarySort: 'title' })
      
      expect(sorted[0].title).toBe('Book A')
      expect(sorted[1].title).toBe('Book B')
      expect(sorted[2].title).toBe('Book C')
    })
  })
})
```

#### TC-WU-002: 優先度表示ユーティリティ
```typescript
describe('getPriorityDisplay', () => {
  test('各優先度の表示情報が正しい', () => {
    expect(getPriorityDisplay('urgent')).toEqual({
      label: '緊急',
      color: 'red',
      icon: '🔴',
      weight: 4
    })
    
    expect(getPriorityDisplay('high')).toEqual({
      label: '高',
      color: 'orange', 
      icon: '🟡',
      weight: 3
    })
    
    expect(getPriorityDisplay('medium')).toEqual({
      label: '中',
      color: 'green',
      icon: '🟢', 
      weight: 2
    })
    
    expect(getPriorityDisplay('low')).toEqual({
      label: '低',
      color: 'gray',
      icon: '⚪',
      weight: 1
    })
  })
})
```

### 2. バリデーション機能

#### TC-VL-001: ウィッシュリスト入力バリデーション
```typescript
describe('validateWishlistInput', () => {
  test('有効な入力データが通る', () => {
    const input = {
      bookId: 'valid-book-id',
      priority: 'medium',
      reason: '面白そうだから',
      targetDate: new Date('2024-12-31')
    }
    
    const result = validateWishlistInput(input)
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
  })

  test('必須フィールドが不足でエラー', () => {
    const input = { bookId: '' }
    
    const result = validateWishlistInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('書籍IDが必要です')
  })

  test('無効な優先度でエラー', () => {
    const input = {
      bookId: 'valid-book-id',
      priority: 'invalid-priority'
    }
    
    const result = validateWishlistInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('無効な優先度です')
  })

  test('過去の目標日でエラー', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    
    const input = {
      bookId: 'valid-book-id',
      targetDate: pastDate
    }
    
    const result = validateWishlistInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('目標日は未来の日付である必要があります')
  })
})
```

## 統合テストケース

### 3. addToWishlist Server Action

#### TC-AW-001: 正常な追加処理
```typescript
describe('addToWishlist Server Action', () => {
  test('新しい書籍がウィッシュリストに追加される', async () => {
    // 準備
    const book = await createTestBook()
    const user = await createTestUser()
    
    // 実行
    const result = await addToWishlist({
      bookId: book.id,
      priority: 'high',
      reason: 'レビューが良かった'
    })
    
    // 検証
    expect(result.success).toBe(true)
    expect(result.data.bookId).toBe(book.id)
    expect(result.data.priority).toBe('high')
    expect(result.data.reason).toBe('レビューが良かった')
  })

  test('デフォルト優先度で追加される', async () => {
    const book = await createTestBook()
    
    const result = await addToWishlist({
      bookId: book.id
    })
    
    expect(result.success).toBe(true)
    expect(result.data.priority).toBe('medium')
  })

  test('目標日付きで追加される', async () => {
    const book = await createTestBook()
    const targetDate = new Date('2024-12-31')
    
    const result = await addToWishlist({
      bookId: book.id,
      targetDate
    })
    
    expect(result.success).toBe(true)
    expect(result.data.targetDate).toEqual(targetDate)
  })
})
```

#### TC-AW-002: エラーケース
```typescript
describe('addToWishlist エラーケース', () => {
  test('認証なしでエラー', async () => {
    mockAuth(null)
    
    const result = await addToWishlist({
      bookId: 'some-book-id'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('認証が必要です')
  })

  test('存在しない書籍でエラー', async () => {
    const result = await addToWishlist({
      bookId: 'non-existent-book-id'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('指定された書籍が見つかりません')
  })

  test('既に本棚にある書籍でエラー', async () => {
    const book = await createTestBook()
    await createTestUserBook({ bookId: book.id })
    
    const result = await addToWishlist({
      bookId: book.id
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('この書籍は既に本棚に登録されています')
  })

  test('既にウィッシュリストにある書籍でエラー', async () => {
    const book = await createTestBook()
    await createTestWishlistItem({ bookId: book.id })
    
    const result = await addToWishlist({
      bookId: book.id
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('この書籍は既にウィッシュリストに登録されています')
  })
})
```

### 4. updateWishlistPriority Server Action

#### TC-UP-001: 優先度更新処理
```typescript
describe('updateWishlistPriority', () => {
  test('優先度が正しく更新される', async () => {
    const wishlistItem = await createTestWishlistItem({
      priority: 'medium'
    })
    
    const result = await updateWishlistPriority({
      wishlistItemId: wishlistItem.id,
      priority: 'urgent'
    })
    
    expect(result.success).toBe(true)
    expect(result.data.priority).toBe('urgent')
  })

  test('他のユーザーのアイテム更新でエラー', async () => {
    const otherUserItem = await createTestWishlistItem({
      userId: 'other-user-id'
    })
    
    const result = await updateWishlistPriority({
      wishlistItemId: otherUserItem.id,
      priority: 'high'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('アクセス権限がありません')
  })
})
```

### 5. moveToLibrary Server Action

#### TC-ML-001: 本棚移動処理
```typescript
describe('moveToLibrary', () => {
  test('ウィッシュリストから本棚に移動される', async () => {
    const wishlistItem = await createTestWishlistItem()
    
    const result = await moveToLibrary({
      wishlistItemId: wishlistItem.id,
      bookType: 'physical',
      status: 'want_to_read'
    })
    
    expect(result.success).toBe(true)
    expect(result.data.userBook.bookId).toBe(wishlistItem.bookId)
    expect(result.data.userBook.bookType).toBe('physical')
    expect(result.data.userBook.status).toBe('want_to_read')
    
    // ウィッシュリストから削除されていることを確認
    const deletedItem = await prisma.wishlistItem.findUnique({
      where: { id: wishlistItem.id }
    })
    expect(deletedItem).toBeNull()
  })

  test('デフォルト値で本棚に移動される', async () => {
    const wishlistItem = await createTestWishlistItem()
    
    const result = await moveToLibrary({
      wishlistItemId: wishlistItem.id
    })
    
    expect(result.success).toBe(true)
    expect(result.data.userBook.bookType).toBe('physical')
    expect(result.data.userBook.status).toBe('want_to_read')
  })
})
```

### 6. getUserWishlist Server Action

#### TC-GW-001: ウィッシュリスト取得
```typescript
describe('getUserWishlist', () => {
  test('ユーザーのウィッシュリストが取得される', async () => {
    await createTestWishlistItem({ priority: 'urgent' })
    await createTestWishlistItem({ priority: 'medium' })
    await createTestWishlistItem({ priority: 'low' })
    
    const result = await getUserWishlist()
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(3)
    // デフォルトは優先度順
    expect(result.data[0].priority).toBe('urgent')
    expect(result.data[1].priority).toBe('medium')
    expect(result.data[2].priority).toBe('low')
  })

  test('優先度フィルタが動作する', async () => {
    await createTestWishlistItem({ priority: 'urgent' })
    await createTestWishlistItem({ priority: 'medium' })
    await createTestWishlistItem({ priority: 'low' })
    
    const result = await getUserWishlist({
      priority: 'urgent'
    })
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].priority).toBe('urgent')
  })

  test('ソートオプションが動作する', async () => {
    const oldItem = await createTestWishlistItem({ 
      createdAt: new Date('2024-01-01')
    })
    const newItem = await createTestWishlistItem({
      createdAt: new Date('2024-02-01')
    })
    
    const result = await getUserWishlist({
      sortBy: 'createdAt',
      sortOrder: 'asc'
    })
    
    expect(result.success).toBe(true)
    expect(result.data[0].id).toBe(oldItem.id)
    expect(result.data[1].id).toBe(newItem.id)
  })

  test('ページネーションが動作する', async () => {
    // 10件のアイテムを作成
    for (let i = 0; i < 10; i++) {
      await createTestWishlistItem()
    }
    
    const result = await getUserWishlist({
      limit: 5,
      offset: 5
    })
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(5)
  })
})
```

## UIコンポーネントテストケース

### 7. WishlistCard コンポーネント

#### TC-WC-001: 表示テスト
```typescript
describe('WishlistCard', () => {
  test('ウィッシュリストアイテムが正しく表示される', () => {
    const wishlistItem = {
      id: 'item-1',
      priority: 'high',
      reason: 'レビューが良い',
      targetDate: new Date('2024-12-31'),
      book: {
        title: 'テスト書籍',
        authors: ['著者名'],
        thumbnailUrl: '/test-image.jpg'
      }
    }
    
    render(<WishlistCard item={wishlistItem} />)
    
    expect(screen.getByText('テスト書籍')).toBeInTheDocument()
    expect(screen.getByText('著者名')).toBeInTheDocument()
    expect(screen.getByText('レビューが良い')).toBeInTheDocument()
    expect(screen.getByText('🟡')).toBeInTheDocument() // high priority
  })

  test('優先度変更ボタンが動作する', async () => {
    const onPriorityChange = jest.fn()
    const wishlistItem = { 
      id: 'item-1', 
      priority: 'medium',
      book: { title: 'Test Book' }
    }
    
    render(
      <WishlistCard 
        item={wishlistItem} 
        onPriorityChange={onPriorityChange}
      />
    )
    
    const priorityButton = screen.getByRole('button', { name: /優先度変更/i })
    fireEvent.click(priorityButton)
    
    await waitFor(() => {
      expect(onPriorityChange).toHaveBeenCalledWith('item-1', 'high')
    })
  })

  test('本棚移動ボタンが動作する', async () => {
    const onMoveToLibrary = jest.fn()
    const wishlistItem = { 
      id: 'item-1',
      book: { title: 'Test Book' }
    }
    
    render(
      <WishlistCard 
        item={wishlistItem} 
        onMoveToLibrary={onMoveToLibrary}
      />
    )
    
    const moveButton = screen.getByRole('button', { name: /本棚に移動/i })
    fireEvent.click(moveButton)
    
    expect(onMoveToLibrary).toHaveBeenCalledWith('item-1')
  })
})
```

### 8. WishlistView コンポーネント

#### TC-WV-001: フィルタリング・ソート機能
```typescript
describe('WishlistView', () => {
  test('優先度フィルターが動作する', async () => {
    const items = [
      { id: '1', priority: 'urgent', book: { title: 'Book 1' } },
      { id: '2', priority: 'medium', book: { title: 'Book 2' } }
    ]
    
    render(<WishlistView items={items} />)
    
    const priorityFilter = screen.getByRole('combobox', { name: /優先度/i })
    fireEvent.change(priorityFilter, { target: { value: 'urgent' } })
    
    await waitFor(() => {
      expect(screen.getByText('Book 1')).toBeInTheDocument()
      expect(screen.queryByText('Book 2')).not.toBeInTheDocument()
    })
  })

  test('ソート機能が動作する', async () => {
    const onSort = jest.fn()
    
    render(<WishlistView onSort={onSort} />)
    
    const sortButton = screen.getByRole('button', { name: /作成日順/i })
    fireEvent.click(sortButton)
    
    expect(onSort).toHaveBeenCalledWith('createdAt', 'desc')
  })
})
```

## エラーハンドリングテストケース

### 9. データベースエラー処理

#### TC-DB-001: 接続エラー
```typescript
describe('データベースエラー処理', () => {
  test('データベース接続失敗時の処理', async () => {
    jest.spyOn(prisma, '$connect').mockRejectedValue(
      new Error('Database connection failed')
    )
    
    const result = await addToWishlist({
      bookId: 'test-book-id'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('データベースエラーが発生しました')
  })
})
```

### 10. 同時操作エラー

#### TC-CO-001: 競合状態
```typescript
describe('同時操作エラー', () => {
  test('同じ書籍の同時追加処理', async () => {
    const bookId = 'test-book-id'
    
    const [result1, result2] = await Promise.all([
      addToWishlist({ bookId }),
      addToWishlist({ bookId })
    ])
    
    // 一つが成功し、一つが重複エラーになること
    const successCount = [result1, result2].filter(r => r.success).length
    expect(successCount).toBe(1)
  })
})
```

## パフォーマンステストケース

### 11. 大量データ処理

#### TC-PF-001: 大量ウィッシュリスト処理
```typescript
describe('パフォーマンステスト', () => {
  test('100件のウィッシュリスト表示が2秒以内', async () => {
    // 100件のウィッシュリストアイテムを作成
    const items = []
    for (let i = 0; i < 100; i++) {
      items.push(await createTestWishlistItem())
    }
    
    const startTime = Date.now()
    const result = await getUserWishlist({ limit: 100 })
    const endTime = Date.now()
    
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(100)
    expect(endTime - startTime).toBeLessThan(2000)
  })
})
```

## テスト実行戦略

### テスト分類別実行
1. **単体テスト**: 0.1秒以内/テスト
2. **統合テスト**: 1秒以内/テスト
3. **UIテスト**: 2秒以内/テスト

### カバレッジ目標
- **ライン カバレッジ**: 90%以上
- **ブランチ カバレッジ**: 85%以上
- **機能 カバレッジ**: 100%