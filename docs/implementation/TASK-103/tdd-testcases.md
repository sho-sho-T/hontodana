# TASK-103: 本棚表示コンポーネント（グリッド・リスト）- テストケース定義

## 1. テスト戦略概要

### テスト層構成
```
E2E Tests (Playwright)
├── ユーザーシナリオテスト
└── アクセシビリティテスト

Integration Tests (Jest + RTL) 
├── コンポーネント統合テスト
└── Server Actions連携テスト

Unit Tests (Jest + RTL)
├── コンポーネント個別テスト
├── カスタムフック テスト
└── ユーティリティ関数テスト
```

### カバレッジ目標
- **単体テスト**: 95%以上
- **統合テスト**: 80%以上  
- **E2Eテスト**: 主要ユーザーフロー100%

## 2. 単体テストケース

### 2.1 BookCard コンポーネント

#### TC-BC-001: 基本表示テスト
```typescript
describe('BookCard - 基本表示', () => {
  test('書籍の基本情報が正しく表示される', () => {
    // Given: 有効な書籍データ
    // When: BookCard をレンダリング
    // Then: タイトル、著者、出版社が表示される
  })

  test('書影が正しく表示される', () => {
    // Given: 書影URLを持つ書籍データ
    // When: BookCard をレンダリング  
    // Then: 画像要素が適切なsrc属性で表示される
  })

  test('書影がない場合はfallback画像が表示される', () => {
    // Given: 書影URLがnullの書籍データ
    // When: BookCard をレンダリング
    // Then: デフォルト画像が表示される
  })
})
```

#### TC-BC-002: ステータス表示テスト
```typescript
describe('BookCard - ステータス表示', () => {
  test('読みたい本のステータスが表示される', () => {
    // Given: WANT_TO_READ ステータスの書籍
    // When: BookCard をレンダリング
    // Then: "読みたい"バッジが表示される
  })

  test('読書中のステータスと進捗バーが表示される', () => {
    // Given: READING ステータス、50%進捗の書籍
    // When: BookCard をレンダリング
    // Then: "読書中"バッジと50%進捗バーが表示される
  })

  test('読了のステータスが表示される', () => {
    // Given: READ ステータスの書籍
    // When: BookCard をレンダリング
    // Then: "読了"バッジが表示される
  })
})
```

#### TC-BC-003: インタラクションテスト
```typescript
describe('BookCard - インタラクション', () => {
  test('カードクリック時に詳細画面に遷移する', () => {
    // Given: BookCard がレンダリングされた状態
    // When: カードをクリック
    // Then: router.push が正しいパスで呼ばれる
  })

  test('ステータス変更ボタンクリック時にコールバックが実行される', () => {
    // Given: onStatusChange コールバック
    // When: ステータス変更ボタンをクリック
    // Then: onStatusChange が正しい引数で呼ばれる
  })

  test('削除ボタンクリック時にコールバックが実行される', () => {
    // Given: onRemove コールバック
    // When: 削除ボタンをクリック
    // Then: onRemove が正しい引数で呼ばれる
  })
})
```

#### TC-BC-004: ホバー効果テスト
```typescript
describe('BookCard - ホバー効果', () => {
  test('マウスホバー時にスタイルが変更される', () => {
    // Given: BookCard がレンダリングされた状態
    // When: カードにマウスホバー
    // Then: ホバー時のCSSクラスが適用される
  })

  test('マウスリーブ時にスタイルが元に戻る', () => {
    // Given: ホバー状態のカード
    // When: マウスリーブ
    // Then: 通常時のCSSクラスに戻る
  })
})
```

### 2.2 BookList コンポーネント

#### TC-BL-001: 基本表示テスト
```typescript
describe('BookList - 基本表示', () => {
  test('書籍リストが正しく表示される', () => {
    // Given: 複数の書籍データの配列
    // When: BookList をレンダリング
    // Then: 全ての書籍が表形式で表示される
  })

  test('空の書籍リストの場合、適切なメッセージが表示される', () => {
    // Given: 空の書籍配列
    // When: BookList をレンダリング
    // Then: "書籍がありません"メッセージが表示される
  })

  test('各書籍項目の詳細情報が正しく表示される', () => {
    // Given: 詳細情報を持つ書籍データ
    // When: BookList をレンダリング
    // Then: タイトル、著者、ページ数、読書開始日が表示される
  })
})
```

#### TC-BL-002: ソート機能テスト
```typescript
describe('BookList - ソート機能', () => {
  test('タイトル昇順ソートが正しく動作する', () => {
    // Given: タイトルでソートされていない書籍リスト
    // When: タイトル列ヘッダーをクリック
    // Then: タイトル昇順でソートされる
  })

  test('タイトル降順ソートが正しく動作する', () => {
    // Given: タイトル昇順でソート済みのリスト
    // When: タイトル列ヘッダーを再度クリック
    // Then: タイトル降順でソートされる
  })

  test('著者名ソートが正しく動作する', () => {
    // Given: 著者名でソートされていない書籍リスト
    // When: 著者列ヘッダーをクリック
    // Then: 著者名昇順でソートされる
  })

  test('追加日ソートが正しく動作する', () => {
    // Given: 追加日でソートされていない書籍リスト
    // When: 追加日列ヘッダーをクリック
    // Then: 追加日昇順でソートされる
  })

  test('更新日ソートが正しく動作する', () => {
    // Given: 更新日でソートされていない書籍リスト
    // When: 更新日列ヘッダーをクリック
    // Then: 更新日昇順でソートされる
  })
})
```

#### TC-BL-003: フィルタ表示テスト
```typescript
describe('BookList - フィルタ表示', () => {
  test('適用中のステータスフィルタが表示される', () => {
    // Given: READING ステータスでフィルタされたリスト
    // When: BookList をレンダリング
    // Then: "読書中"フィルタ表示が見える
  })

  test('複数フィルタが同時に表示される', () => {
    // Given: ステータスと著者の複数フィルタ適用状態
    // When: BookList をレンダリング
    // Then: 両方のフィルタ表示が見える
  })

  test('フィルタクリア機能が動作する', () => {
    // Given: フィルタが適用された状態
    // When: フィルタクリアボタンをクリック
    // Then: 全てのフィルタが解除される
  })
})
```

### 2.3 ViewToggle コンポーネント

#### TC-VT-001: 基本表示テスト
```typescript
describe('ViewToggle - 基本表示', () => {
  test('グリッド/リスト切り替えボタンが表示される', () => {
    // Given: ViewToggle コンポーネント
    // When: レンダリング
    // Then: グリッド・リスト両方のボタンが表示される
  })

  test('現在選択されているモードがハイライトされる', () => {
    // Given: グリッドモードが選択されている状態
    // When: ViewToggle をレンダリング
    // Then: グリッドボタンがアクティブ状態で表示される
  })
})
```

#### TC-VT-002: 切り替え機能テスト
```typescript
describe('ViewToggle - 切り替え機能', () => {
  test('グリッドからリストへの切り替えが動作する', () => {
    // Given: グリッドモードが選択されている状態
    // When: リストボタンをクリック
    // Then: onViewChange が 'list' で呼ばれる
  })

  test('リストからグリッドへの切り替えが動作する', () => {
    // Given: リストモードが選択されている状態
    // When: グリッドボタンをクリック
    // Then: onViewChange が 'grid' で呼ばれる
  })
})
```

#### TC-VT-003: 永続化テスト
```typescript
describe('ViewToggle - 永続化', () => {
  test('選択されたモードがlocalStorageに保存される', () => {
    // Given: ViewToggle コンポーネント
    // When: リストモードを選択
    // Then: localStorage に 'list' が保存される
  })

  test('初期表示時にlocalStorageから設定が読み込まれる', () => {
    // Given: localStorage に 'list' が保存されている状態
    // When: ViewToggle をレンダリング
    // Then: リストモードが選択状態で表示される
  })
})
```

### 2.4 ProgressBar コンポーネント

#### TC-PB-001: 基本表示テスト
```typescript
describe('ProgressBar - 基本表示', () => {
  test('進捗率が正しく表示される', () => {
    // Given: 50%の進捗率
    // When: ProgressBar をレンダリング
    // Then: "50%" テキストと50%幅のバーが表示される
  })

  test('0%の進捗率が正しく表示される', () => {
    // Given: 0%の進捗率
    // When: ProgressBar をレンダリング
    // Then: "0%" テキストと0%幅のバーが表示される
  })

  test('100%の進捗率が正しく表示される', () => {
    // Given: 100%の進捗率
    // When: ProgressBar をレンダリング
    // Then: "100%" テキストと100%幅のバーが表示される
  })
})
```

#### TC-PB-002: 境界値テスト
```typescript
describe('ProgressBar - 境界値テスト', () => {
  test('負の進捗率は0%として表示される', () => {
    // Given: -10%の進捗率
    // When: ProgressBar をレンダリング
    // Then: "0%" テキストと0%幅のバーが表示される
  })

  test('100%を超える進捗率は100%として表示される', () => {
    // Given: 120%の進捗率
    // When: ProgressBar をレンダリング
    // Then: "100%" テキストと100%幅のバーが表示される
  })

  test('小数点を含む進捗率が正しく四捨五入される', () => {
    // Given: 33.7%の進捗率
    // When: ProgressBar をレンダリング
    // Then: "34%" テキストが表示される
  })
})
```

### 2.5 BookSkeleton コンポーネント

#### TC-BS-001: 基本表示テスト
```typescript
describe('BookSkeleton - 基本表示', () => {
  test('グリッドモード用スケルトンが正しく表示される', () => {
    // Given: グリッドモードのスケルトン
    // When: BookSkeleton をレンダリング
    // Then: カード形式のスケルトンが表示される
  })

  test('リストモード用スケルトンが正しく表示される', () => {
    // Given: リストモードのスケルトン
    // When: BookSkeleton をレンダリング
    // Then: 行形式のスケルトンが表示される
  })

  test('複数のスケルトン項目が表示される', () => {
    // Given: count=5 のスケルトン
    // When: BookSkeleton をレンダリング
    // Then: 5個のスケルトン項目が表示される
  })
})
```

#### TC-BS-002: アニメーションテスト
```typescript
describe('BookSkeleton - アニメーション', () => {
  test('パルスアニメーションが適用される', () => {
    // Given: BookSkeleton コンポーネント
    // When: レンダリング
    // Then: animate-pulse クラスが適用される
  })
})
```

## 3. カスタムフック テストケース

### 3.1 useViewMode フック

#### TC-UVM-001: 基本機能テスト
```typescript
describe('useViewMode - 基本機能', () => {
  test('初期値がgridモードである', () => {
    // Given: useViewMode フック
    // When: フックを実行
    // Then: viewMode が 'grid' である
  })

  test('表示モードを変更できる', () => {
    // Given: useViewMode フック
    // When: setViewMode('list') を実行
    // Then: viewMode が 'list' に変更される
  })
})
```

#### TC-UVM-002: 永続化テスト
```typescript
describe('useViewMode - 永続化', () => {
  test('初期化時にlocalStorageから読み込まれる', () => {
    // Given: localStorage に 'list' が保存されている
    // When: useViewMode フックを初期化
    // Then: viewMode が 'list' になる
  })

  test('モード変更時にlocalStorageに保存される', () => {
    // Given: useViewMode フック
    // When: setViewMode('list') を実行
    // Then: localStorage に 'list' が保存される
  })

  test('無効な値はデフォルト値にフォールバックする', () => {
    // Given: localStorage に 'invalid' が保存されている
    // When: useViewMode フックを初期化
    // Then: viewMode が 'grid' になる
  })
})
```

### 3.2 useBookActions フック

#### TC-UBA-001: ステータス更新テスト
```typescript
describe('useBookActions - ステータス更新', () => {
  test('書籍ステータスが正常に更新される', () => {
    // Given: useBookActions フック
    // When: updateStatus('book-id', BookStatus.READ) を実行
    // Then: updateBookStatus Server Action が正しく呼ばれる
  })

  test('ステータス更新エラー時にエラーが返される', () => {
    // Given: updateBookStatus がエラーを返す設定
    // When: updateStatus を実行
    // Then: エラーオブジェクトが返される
  })

  test('更新中はloading状態になる', () => {
    // Given: useBookActions フック
    // When: updateStatus を実行中
    // Then: isLoading が true になる
  })
})
```

#### TC-UBA-002: 書籍削除テスト
```typescript
describe('useBookActions - 書籍削除', () => {
  test('書籍が正常に削除される', () => {
    // Given: useBookActions フック
    // When: removeBook('book-id') を実行
    // Then: removeBookFromLibrary Server Action が正しく呼ばれる
  })

  test('削除エラー時にエラーが返される', () => {
    // Given: removeBookFromLibrary がエラーを返す設定
    // When: removeBook を実行
    // Then: エラーオブジェクトが返される
  })
})
```

## 4. 統合テストケース

### 4.1 LibraryView コンポーネント統合

#### TC-LV-001: 全体連携テスト
```typescript
describe('LibraryView - 全体連携', () => {
  test('初期表示時に書籍一覧とビュー切り替えが表示される', () => {
    // Given: 書籍データとLibraryView
    // When: コンポーネントをレンダリング
    // Then: 書籍一覧とViewToggleが表示される
  })

  test('ビュー切り替え時に表示形式が変更される', () => {
    // Given: グリッド表示のLibraryView
    // When: リストモードに切り替え
    // Then: BookList コンポーネントが表示される
  })

  test('書籍操作時に一覧が更新される', () => {
    // Given: 書籍一覧が表示された状態
    // When: 書籍のステータスを更新
    // Then: 更新された情報が一覧に反映される
  })
})
```

### 4.2 Server Actions 連携テスト

#### TC-SA-001: データ取得連携
```typescript
describe('Server Actions 連携 - データ取得', () => {
  test('書籍一覧が Server Actions から正しく取得される', () => {
    // Given: getUserBooks Server Action のモック
    // When: LibraryView をレンダリング
    // Then: Server Actions が呼ばれ、結果が表示される
  })

  test('データ取得エラー時にエラーメッセージが表示される', () => {
    // Given: getUserBooks がエラーを返す設定
    // When: LibraryView をレンダリング
    // Then: エラーメッセージが表示される
  })
})
```

#### TC-SA-002: データ更新連携
```typescript
describe('Server Actions 連携 - データ更新', () => {
  test('ステータス更新がサーバーに正しく送信される', () => {
    // Given: BookCard からステータス更新操作
    // When: ステータス変更ボタンをクリック
    // Then: updateBookStatus Server Action が呼ばれる
  })

  test('書籍削除がサーバーに正しく送信される', () => {
    // Given: BookCard から削除操作
    // When: 削除ボタンをクリック
    // Then: removeBookFromLibrary Server Action が呼ばれる
  })
})
```

## 5. E2Eテストケース

### 5.1 ユーザーシナリオテスト

#### TC-E2E-001: 基本利用フロー
```typescript
describe('E2E - 基本利用フロー', () => {
  test('書籍一覧表示からステータス更新まで', () => {
    // Given: ログイン済みユーザー
    // When: 1. ライブラリページを開く
    //       2. 書籍のステータスを変更
    //       3. 変更を確認
    // Then: ステータス更新が反映される
  })

  test('表示切り替え機能の利用', () => {
    // Given: ライブラリページが開かれた状態
    // When: 1. グリッド表示を確認
    //       2. リスト表示に切り替え
    //       3. グリッド表示に戻す
    // Then: 各表示モードが正しく動作する
  })
})
```

#### TC-E2E-002: エラーハンドリング
```typescript
describe('E2E - エラーハンドリング', () => {
  test('ネットワークエラー時の挙動', () => {
    // Given: ネットワークエラーが発生する環境
    // When: 書籍ステータスを更新
    // Then: 適切なエラーメッセージが表示される
  })

  test('サーバーエラー時の挙動', () => {
    // Given: サーバーが5xxエラーを返す設定
    // When: 書籍データを取得
    // Then: リトライ機能とエラー表示が動作する
  })
})
```

### 5.2 レスポンシブテスト

#### TC-E2E-003: デバイス別表示テスト
```typescript
describe('E2E - レスポンシブ', () => {
  test('モバイル端末での表示と操作', () => {
    // Given: スマートフォン画面サイズ (375px幅)
    // When: ライブラリページを表示
    // Then: 2カラムグリッドで適切に表示される
  })

  test('タブレット端末での表示と操作', () => {
    // Given: タブレット画面サイズ (768px幅)
    // When: ライブラリページを表示
    // Then: 3カラムグリッドで適切に表示される
  })

  test('デスクトップでの表示と操作', () => {
    // Given: デスクトップ画面サイズ (1024px幅)
    // When: ライブラリページを表示
    // Then: 4カラムグリッドで適切に表示される
  })
})
```

## 6. アクセシビリティテストケース

### 6.1 キーボード操作テスト

#### TC-A11Y-001: キーボードナビゲーション
```typescript
describe('アクセシビリティ - キーボード操作', () => {
  test('Tab キーでフォーカス移動が正しく動作する', () => {
    // Given: LibraryView が表示された状態
    // When: Tab キーを複数回押下
    // Then: 論理的な順序でフォーカスが移動する
  })

  test('Enter キーで書籍詳細に遷移できる', () => {
    // Given: 書籍カードにフォーカスが当たっている状態
    // When: Enter キーを押下
    // Then: 書籍詳細ページに遷移する
  })

  test('Space キーでボタン操作ができる', () => {
    // Given: ステータス変更ボタンにフォーカス
    // When: Space キーを押下
    // Then: ステータス変更処理が実行される
  })
})
```

### 6.2 スクリーンリーダー対応テスト

#### TC-A11Y-002: ARIA属性とセマンティック
```typescript
describe('アクセシビリティ - スクリーンリーダー', () => {
  test('適切な ARIA ラベルが設定されている', () => {
    // Given: BookCard コンポーネント
    // When: レンダリング
    // Then: aria-label が適切に設定される
  })

  test('読書進捗がアクセシブルに伝えられる', () => {
    // Given: 進捗バー付きの書籍
    // When: スクリーンリーダーでアクセス
    // Then: 進捗率が音声で読み上げられる
  })

  test('ライブリージョンでの状態変更通知', () => {
    // Given: ステータス更新処理
    // When: ステータスが変更される
    // Then: aria-live で変更が通知される
  })
})
```

## 7. パフォーマンステストケース

### 7.1 レンダリング性能テスト

#### TC-PERF-001: レンダリング時間
```typescript
describe('パフォーマンス - レンダリング', () => {
  test('100冊の書籍表示が2秒以内で完了する', () => {
    // Given: 100冊の書籍データ
    // When: LibraryView をレンダリング
    // Then: 2秒以内で表示が完了する
  })

  test('表示切り替えが300ms以内で完了する', () => {
    // Given: グリッド表示の状態
    // When: リスト表示に切り替え
    // Then: 300ms以内で切り替わる
  })
})
```

### 7.2 メモリ使用量テスト

#### TC-PERF-002: メモリリーク
```typescript
describe('パフォーマンス - メモリ', () => {
  test('長時間利用でメモリリークが発生しない', () => {
    // Given: LibraryView が長時間表示される
    // When: 複数回の操作を実行
    // Then: メモリ使用量が異常増加しない
  })

  test('大量画像読み込み時のメモリ管理', () => {
    // Given: 多数の書影を持つ書籍リスト
    // When: スクロールして画像を読み込み
    // Then: 適切にメモリが解放される
  })
})
```

## 8. エラーケーステスト

### 8.1 データエラーテスト

#### TC-ERR-001: データ取得エラー
```typescript
describe('エラーケース - データ取得', () => {
  test('書籍データ取得失敗時の表示', () => {
    // Given: Server Actions がエラーを返す
    // When: LibraryView を初期表示
    // Then: エラーメッセージと再試行ボタンが表示される
  })

  test('空のデータセット時の表示', () => {
    // Given: 空の書籍配列
    // When: LibraryView をレンダリング
    // Then: "書籍がありません"メッセージが表示される
  })
})
```

### 8.2 操作エラーテスト

#### TC-ERR-002: ユーザー操作エラー
```typescript
describe('エラーケース - 操作エラー', () => {
  test('ステータス更新失敗時の処理', () => {
    // Given: updateBookStatus がエラーを返す
    // When: ステータス変更を試行
    // Then: エラーメッセージが表示され、元の状態に戻る
  })

  test('削除操作失敗時の処理', () => {
    // Given: removeBookFromLibrary がエラーを返す
    // When: 書籍削除を試行
    // Then: エラーメッセージが表示され、書籍は残る
  })
})
```

## 9. テスト実行戦略

### 9.1 実行順序
```bash
# 1. 単体テスト実行（高速フィードバック）
npm test -- --testPathPattern=components/library

# 2. 統合テスト実行
npm test -- --testPathPattern=__tests__/integration

# 3. E2Eテスト実行
npm run test:e2e

# 4. アクセシビリティテスト実行
npm run test:a11y

# 5. パフォーマンステスト実行
npm run test:perf
```

### 9.2 継続的テスト

#### 開発時
- **Watch モード**: 変更時の自動テスト実行
- **カバレッジ**: リアルタイムカバレッジ表示
- **Lint**: コード品質チェック

#### CI/CD
- **並列実行**: テスト種別ごとの並列実行
- **失敗時停止**: クリティカルテスト失敗時の早期停止
- **レポート**: 統合されたテスト結果レポート

### 9.3 テストデータ管理

#### モックデータ
```typescript
// __tests__/fixtures/bookData.ts
export const mockBooks: UserBookWithBook[] = [
  {
    id: 'user-book-1',
    userId: 'user-1',
    bookId: 'book-1',
    status: BookStatus.READING,
    bookType: BookType.PHYSICAL,
    progress: 150,
    startDate: new Date('2024-01-01'),
    book: {
      id: 'book-1',
      googleBooksId: 'google-1',
      title: 'テスト書籍1',
      authors: ['テスト著者1'],
      // ... その他のフィールド
    }
  }
  // ... 追加のテストデータ
]
```

#### ファクトリー関数
```typescript
export const createMockBook = (overrides?: Partial<UserBookWithBook>): UserBookWithBook => {
  return {
    ...defaultMockBook,
    ...overrides
  }
}
```

## 10. 品質ゲート

### 10.1 テストカバレッジ基準
- **単体テスト**: 95%以上
- **分岐カバレッジ**: 90%以上
- **ステートメントカバレッジ**: 95%以上
- **関数カバレッジ**: 100%

### 10.2 パフォーマンス基準
- **First Contentful Paint**: 1.5秒以下
- **Largest Contentful Paint**: 2秒以下
- **Cumulative Layout Shift**: 0.1以下
- **First Input Delay**: 100ms以下

### 10.3 アクセシビリティ基準
- **axe-core 違反**: 0件
- **WCAG 2.1 AA準拠**: 100%
- **キーボード操作**: 全機能対応
- **カラーコントラスト比**: 4.5:1以上

## テストケース実装準備完了
これらのテストケースに基づき、次のステップ「テスト実装（失敗）」でRed Phaseを開始します。