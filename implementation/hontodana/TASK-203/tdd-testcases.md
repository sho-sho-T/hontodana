# TASK-203: コレクション管理機能 - テストケース

## Server Actions テストケース

### 1. createCollection テスト

#### 1.1 正常系テスト
```javascript
describe('createCollection', () => {
  test('should create collection with valid data', async () => {
    const collectionData = {
      name: 'お気に入りの本',
      description: '特に印象深い本のコレクション',
      color: '#FF5733',
      icon: '⭐',
      isPublic: false
    };
    
    const result = await createCollection(collectionData);
    
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('お気に入りの本');
    expect(result.data.color).toBe('#FF5733');
    expect(result.data.userId).toBeDefined();
  });

  test('should create collection with minimal data', async () => {
    const collectionData = {
      name: 'テスト',
    };
    
    const result = await createCollection(collectionData);
    
    expect(result.success).toBe(true);
    expect(result.data.color).toBe('#3B82F6'); // デフォルト値
    expect(result.data.icon).toBe('📚'); // デフォルト値
    expect(result.data.isPublic).toBe(false); // デフォルト値
  });
});
```

#### 1.2 異常系テスト
```javascript
describe('createCollection - error cases', () => {
  test('should fail with empty name', async () => {
    const collectionData = { name: '' };
    
    const result = await createCollection(collectionData);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('名前は必須');
  });

  test('should fail with duplicate name', async () => {
    // 既に存在するコレクション名
    const collectionData = { name: '既存のコレクション' };
    
    const result = await createCollection(collectionData);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('既に存在する');
  });

  test('should fail with name too long', async () => {
    const collectionData = { 
      name: 'a'.repeat(101) // 101文字
    };
    
    const result = await createCollection(collectionData);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('100文字以下');
  });
});
```

### 2. updateCollection テスト

#### 2.1 正常系テスト
```javascript
describe('updateCollection', () => {
  test('should update collection successfully', async () => {
    const updateData = {
      name: '更新されたコレクション',
      description: '新しい説明',
      color: '#00FF00'
    };
    
    const result = await updateCollection('collection-id', updateData);
    
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('更新されたコレクション');
  });

  test('should update only provided fields', async () => {
    const updateData = { name: '部分更新' };
    
    const result = await updateCollection('collection-id', updateData);
    
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('部分更新');
    // 他のフィールドは変更されない
  });
});
```

#### 2.2 異常系テスト
```javascript
describe('updateCollection - error cases', () => {
  test('should fail with non-existent collection', async () => {
    const updateData = { name: 'テスト' };
    
    const result = await updateCollection('non-existent-id', updateData);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('見つかりません');
  });

  test('should fail with duplicate name', async () => {
    const updateData = { name: '他の既存コレクション名' };
    
    const result = await updateCollection('collection-id', updateData);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('既に存在する');
  });
});
```

### 3. deleteCollection テスト

#### 3.1 正常系テスト
```javascript
describe('deleteCollection', () => {
  test('should delete empty collection', async () => {
    const result = await deleteCollection('empty-collection-id');
    
    expect(result.success).toBe(true);
  });

  test('should delete collection with books (cascade)', async () => {
    const result = await deleteCollection('collection-with-books-id');
    
    expect(result.success).toBe(true);
    // CollectionBookも削除されることを確認
  });
});
```

#### 3.2 異常系テスト
```javascript
describe('deleteCollection - error cases', () => {
  test('should fail with non-existent collection', async () => {
    const result = await deleteCollection('non-existent-id');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('見つかりません');
  });

  test('should fail when user is not owner', async () => {
    const result = await deleteCollection('other-user-collection-id');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('権限がありません');
  });
});
```

### 4. addBookToCollection テスト

#### 4.1 正常系テスト
```javascript
describe('addBookToCollection', () => {
  test('should add book to collection successfully', async () => {
    const result = await addBookToCollection('collection-id', 'userbook-id');
    
    expect(result.success).toBe(true);
    expect(result.data.collectionId).toBe('collection-id');
    expect(result.data.userBookId).toBe('userbook-id');
  });

  test('should set correct sort order for new book', async () => {
    // コレクションに既に2冊ある場合
    const result = await addBookToCollection('collection-id', 'new-book-id');
    
    expect(result.success).toBe(true);
    expect(result.data.sortOrder).toBe(2); // 3番目（0-indexed）
  });
});
```

#### 4.2 異常系テスト
```javascript
describe('addBookToCollection - error cases', () => {
  test('should fail when book already in collection', async () => {
    const result = await addBookToCollection('collection-id', 'existing-book-id');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('既に追加されています');
  });

  test('should fail with non-existent collection', async () => {
    const result = await addBookToCollection('non-existent-collection', 'book-id');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('コレクションが見つかりません');
  });

  test('should fail with non-existent book', async () => {
    const result = await addBookToCollection('collection-id', 'non-existent-book');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('書籍が見つかりません');
  });
});
```

### 5. updateBookOrderInCollection テスト

#### 5.1 正常系テスト
```javascript
describe('updateBookOrderInCollection', () => {
  test('should update book order successfully', async () => {
    const bookOrders = [
      { userBookId: 'book1', sortOrder: 2 },
      { userBookId: 'book2', sortOrder: 0 },
      { userBookId: 'book3', sortOrder: 1 }
    ];
    
    const result = await updateBookOrderInCollection('collection-id', bookOrders);
    
    expect(result.success).toBe(true);
  });

  test('should handle single book order update', async () => {
    const bookOrders = [
      { userBookId: 'book1', sortOrder: 5 }
    ];
    
    const result = await updateBookOrderInCollection('collection-id', bookOrders);
    
    expect(result.success).toBe(true);
  });
});
```

## UI コンポーネントテストケース

### 1. CollectionCard テスト

#### 1.1 レンダリングテスト
```javascript
describe('CollectionCard', () => {
  test('should render collection information correctly', () => {
    const collection = {
      id: '1',
      name: 'テストコレクション',
      description: '説明文',
      color: '#FF5733',
      icon: '📚',
      booksCount: 5
    };
    
    render(<CollectionCard collection={collection} />);
    
    expect(screen.getByText('テストコレクション')).toBeInTheDocument();
    expect(screen.getByText('説明文')).toBeInTheDocument();
    expect(screen.getByText('📚')).toBeInTheDocument();
    expect(screen.getByText('5冊')).toBeInTheDocument();
  });

  test('should render empty state when no description', () => {
    const collection = {
      id: '1',
      name: 'テストコレクション',
      color: '#FF5733',
      icon: '📚',
      booksCount: 0
    };
    
    render(<CollectionCard collection={collection} />);
    
    expect(screen.getByText('まだ書籍がありません')).toBeInTheDocument();
  });
});
```

#### 1.2 インタラクションテスト
```javascript
describe('CollectionCard - interactions', () => {
  test('should call onClick when card is clicked', async () => {
    const handleClick = jest.fn();
    const collection = { /* ... */ };
    
    render(<CollectionCard collection={collection} onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledWith(collection.id);
  });

  test('should show edit menu when menu button is clicked', async () => {
    const collection = { /* ... */ };
    
    render(<CollectionCard collection={collection} />);
    
    await user.click(screen.getByLabelText('メニューを開く'));
    
    expect(screen.getByText('編集')).toBeInTheDocument();
    expect(screen.getByText('削除')).toBeInTheDocument();
  });
});
```

### 2. CreateCollectionDialog テスト

#### 2.1 フォームテスト
```javascript
describe('CreateCollectionDialog', () => {
  test('should submit form with valid data', async () => {
    const handleCreate = jest.fn();
    
    render(<CreateCollectionDialog open={true} onCreateCollection={handleCreate} />);
    
    await user.type(screen.getByLabelText('コレクション名'), 'テストコレクション');
    await user.type(screen.getByLabelText('説明'), 'テスト説明');
    await user.click(screen.getByText('作成'));
    
    expect(handleCreate).toHaveBeenCalledWith({
      name: 'テストコレクション',
      description: 'テスト説明',
      color: '#3B82F6',
      icon: '📚',
      isPublic: false
    });
  });

  test('should show validation error for empty name', async () => {
    render(<CreateCollectionDialog open={true} />);
    
    await user.click(screen.getByText('作成'));
    
    expect(screen.getByText('コレクション名は必須です')).toBeInTheDocument();
  });

  test('should allow color selection', async () => {
    render(<CreateCollectionDialog open={true} />);
    
    await user.click(screen.getByLabelText('色を選択'));
    await user.click(screen.getByTitle('#FF5733'));
    
    expect(screen.getByTitle('#FF5733')).toHaveClass('selected');
  });
});
```

### 3. ドラッグ&ドロップテスト

#### 3.1 BookCollectionDropzone テスト
```javascript
describe('BookCollectionDropzone', () => {
  test('should accept book drop', async () => {
    const handleDrop = jest.fn();
    
    render(<BookCollectionDropzone onDrop={handleDrop} />);
    
    const dropzone = screen.getByLabelText('書籍をドロップ');
    
    // ドラッグ&ドロップのシミュレーション
    fireEvent.dragEnter(dropzone);
    expect(dropzone).toHaveClass('drag-over');
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        getData: () => 'book-id'
      }
    });
    
    expect(handleDrop).toHaveBeenCalledWith('book-id');
  });

  test('should show visual feedback during drag', async () => {
    render(<BookCollectionDropzone />);
    
    const dropzone = screen.getByLabelText('書籍をドロップ');
    
    fireEvent.dragEnter(dropzone);
    expect(dropzone).toHaveClass('drag-over');
    
    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveClass('drag-over');
  });
});
```

## 統合テストケース

### 1. コレクション管理フローテスト
```javascript
describe('Collection Management Flow', () => {
  test('should create, edit, and delete collection', async () => {
    // コレクション作成
    await user.click(screen.getByText('新しいコレクション'));
    await user.type(screen.getByLabelText('コレクション名'), 'テストコレクション');
    await user.click(screen.getByText('作成'));
    
    // 作成されたコレクションが一覧に表示される
    expect(screen.getByText('テストコレクション')).toBeInTheDocument();
    
    // コレクション編集
    await user.click(screen.getByLabelText('メニューを開く'));
    await user.click(screen.getByText('編集'));
    await user.clear(screen.getByLabelText('コレクション名'));
    await user.type(screen.getByLabelText('コレクション名'), '更新されたコレクション');
    await user.click(screen.getByText('更新'));
    
    // 更新が反映される
    expect(screen.getByText('更新されたコレクション')).toBeInTheDocument();
    
    // コレクション削除
    await user.click(screen.getByLabelText('メニューを開く'));
    await user.click(screen.getByText('削除'));
    await user.click(screen.getByText('削除する')); // 確認ダイアログ
    
    // コレクションが一覧から削除される
    expect(screen.queryByText('更新されたコレクション')).not.toBeInTheDocument();
  });
});
```

### 2. 書籍のコレクション追加フローテスト
```javascript
describe('Book to Collection Flow', () => {
  test('should add book to collection via dropdown', async () => {
    // 書籍カードのメニューを開く
    await user.click(screen.getAllByLabelText('メニューを開く')[0]);
    await user.click(screen.getByText('コレクションに追加'));
    
    // コレクション選択
    await user.click(screen.getByText('お気に入り'));
    
    // 追加完了のトースト表示
    expect(screen.getByText('コレクションに追加しました')).toBeInTheDocument();
  });

  test('should add book to collection via drag and drop', async () => {
    const bookCard = screen.getByTestId('book-card-1');
    const collectionCard = screen.getByTestId('collection-card-1');
    
    // ドラッグ開始
    fireEvent.dragStart(bookCard, {
      dataTransfer: { setData: jest.fn() }
    });
    
    // ドロップ
    fireEvent.drop(collectionCard, {
      dataTransfer: { getData: () => 'book-1' }
    });
    
    // 追加完了のトースト表示
    expect(screen.getByText('コレクションに追加しました')).toBeInTheDocument();
  });
});
```

## E2Eテストケース

### 1. コレクション管理シナリオ
```javascript
// Playwright E2E テスト
test('Collection management end-to-end', async ({ page }) => {
  await page.goto('/dashboard');
  
  // コレクション一覧ページに移動
  await page.click('text=コレクション');
  
  // 新しいコレクションを作成
  await page.click('text=新しいコレクション');
  await page.fill('[placeholder="コレクション名を入力"]', 'E2Eテストコレクション');
  await page.fill('[placeholder="説明（オプション）"]', 'E2Eテスト用のコレクション');
  await page.click('button:has-text("作成")');
  
  // 作成されたコレクションが表示されることを確認
  await expect(page.locator('text=E2Eテストコレクション')).toBeVisible();
  
  // コレクション詳細ページに移動
  await page.click('text=E2Eテストコレクション');
  
  // 本棚ページに戻って書籍を追加
  await page.click('text=本棚');
  
  // 書籍カードからコレクションに追加
  await page.click('.book-card >> text=メニュー');
  await page.click('text=コレクションに追加');
  await page.click('text=E2Eテストコレクション');
  
  // 追加完了の確認
  await expect(page.locator('.toast >> text=コレクションに追加しました')).toBeVisible();
  
  // コレクション詳細で書籍が表示されることを確認
  await page.click('text=コレクション');
  await page.click('text=E2Eテストコレクション');
  await expect(page.locator('.book-card')).toBeVisible();
});
```

### 2. レスポンシブテストシナリオ
```javascript
test('Collection management on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  
  await page.goto('/collections');
  
  // モバイルでのコレクション表示確認
  await expect(page.locator('.collection-card')).toBeVisible();
  
  // ハンバーガーメニューからの操作
  await page.click('[data-testid="hamburger-menu"]');
  await page.click('text=新しいコレクション');
  
  // モバイル用ダイアログの確認
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  
  // フォーム入力（モバイル）
  await page.fill('input[name="name"]', 'モバイルテスト');
  await page.click('button:has-text("作成")');
  
  // 作成完了の確認
  await expect(page.locator('text=モバイルテスト')).toBeVisible();
});
```

## パフォーマンステストケース

### 1. 大量コレクション表示テスト
```javascript
describe('Performance Tests', () => {
  test('should load 50 collections within 1 second', async () => {
    const startTime = performance.now();
    
    render(<CollectionList collections={generate50Collections()} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(1000); // 1秒以内
  });

  test('should handle drag and drop at 60fps', async () => {
    // 60FPS監視の実装
    const frameDrops = await measureDragPerformance();
    
    expect(frameDrops).toBeLessThan(5); // フレームドロップ5回以下
  });
});
```

## アクセシビリティテストケース

### 1. キーボード操作テスト
```javascript
describe('Accessibility Tests', () => {
  test('should navigate collections with keyboard', async () => {
    render(<CollectionList collections={mockCollections} />);
    
    // タブキーでナビゲーション
    await user.tab();
    expect(screen.getAllByRole('button')[0]).toHaveFocus();
    
    // エンターキーで選択
    await user.keyboard('{Enter}');
    expect(mockOnClick).toHaveBeenCalled();
    
    // 矢印キーでの移動
    await user.keyboard('{ArrowRight}');
    expect(screen.getAllByRole('button')[1]).toHaveFocus();
  });

  test('should have proper ARIA labels', () => {
    const collection = {
      name: 'テストコレクション',
      booksCount: 5
    };
    
    render(<CollectionCard collection={collection} />);
    
    expect(screen.getByLabelText('テストコレクション、5冊の書籍')).toBeInTheDocument();
  });
});
```

### 2. スクリーンリーダーテスト
```javascript
test('should provide proper screen reader experience', async () => {
  render(<CreateCollectionDialog open={true} />);
  
  // フォームラベルの確認
  expect(screen.getByLabelText('コレクション名')).toHaveAttribute('aria-required', 'true');
  
  // エラーメッセージのaria-describedby
  await user.click(screen.getByText('作成'));
  const nameInput = screen.getByLabelText('コレクション名');
  const errorMessage = screen.getByText('コレクション名は必須です');
  
  expect(nameInput).toHaveAttribute('aria-describedby', errorMessage.id);
});
```

## テスト実行基準

### カバレッジ要件
- 単体テスト: 90%以上
- 統合テスト: 主要フロー100%
- E2Eテスト: ユーザーシナリオ100%

### 実行環境
- Jest + React Testing Library (単体・統合)
- Playwright (E2E)
- Axe-core (アクセシビリティ)

### CI/CD統合
- プルリクエスト時に全テスト実行
- カバレッジレポート生成
- パフォーマンス回帰テスト