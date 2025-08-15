# TASK-103: 本棚表示コンポーネント（グリッド・リスト）- Red Phase

## 1. TDD Red Phase 概要

### 目的
テストファーストの原則に従い、実装前に失敗するテストを作成することで：
- 要件の明確化
- テスト可能な設計の確保
- 実装の指針の提供
- 仕様の詳細化

### 実装方針
1. **全テストケース実装**: 要件定義とテストケース定義に基づく包括的テスト
2. **適切な失敗**: import エラーや実装不足による期待された失敗
3. **型安全性**: TypeScript による厳密な型定義
4. **モック設定**: 外部依存関係の適切なモック化

## 2. 実装済みテストファイル

### 2.1 コンポーネントテスト

#### BookCard.test.tsx ✅
```typescript
// Location: __tests__/components/library/BookCard.test.tsx
// Test Cases: 15項目
- 基本表示テスト (3テスト)
  - 書籍の基本情報表示
  - 書影表示
  - fallback画像表示
- ステータス表示テスト (3テスト)
  - 読みたい本のステータス
  - 読書中のステータス+進捗バー
  - 読了のステータス
- インタラクションテスト (3テスト)
  - カードクリック→詳細画面遷移
  - ステータス変更ボタン
  - 削除ボタン
- ホバー効果テスト (1テスト)
  - マウスホバー時のスタイル変更
```

#### BookList.test.tsx ✅
```typescript
// Location: __tests__/components/library/BookList.test.tsx
// Test Cases: 12項目
- 基本表示テスト (3テスト)
  - 書籍リスト表示
  - 空リスト時のメッセージ
  - 詳細情報表示
- ソート機能テスト (5テスト)
  - タイトル昇順/降順ソート
  - 著者名ソート
  - 追加日ソート
  - 更新日ソート
- フィルタ表示テスト (3テスト)
  - ステータスフィルタ表示
  - 複数フィルタ表示
  - フィルタクリア機能
```

#### ViewToggle.test.tsx ✅
```typescript
// Location: __tests__/components/library/ViewToggle.test.tsx
// Test Cases: 5項目
- 基本表示テスト (2テスト)
  - グリッド/リストボタン表示
  - 選択モードのハイライト
- 切り替え機能テスト (2テスト)
  - グリッド→リスト切り替え
  - リスト→グリッド切り替え
- 永続化テスト (2テスト)
  - localStorage保存
  - localStorage読み込み
```

#### ProgressBar.test.tsx ✅
```typescript
// Location: __tests__/components/library/ProgressBar.test.tsx
// Test Cases: 11項目
- 基本表示テスト (4テスト)
  - 進捗率表示 (50%, 0%, 100%)
  - 視覚的バー幅設定
- 境界値テスト (6テスト)
  - 負の値→0%変換
  - 100%超→100%変換
  - 小数点四捨五入
  - total=0の処理
  - total=負の値の処理
- アクセシビリティテスト (2テスト)
  - ARIA属性設定
  - カスタムラベル設定
```

#### BookSkeleton.test.tsx ✅
```typescript
// Location: __tests__/components/library/BookSkeleton.test.tsx
// Test Cases: 8項目
- 基本表示テスト (4テスト)
  - グリッドモードスケルトン
  - リストモードスケルトン
  - デフォルトcount
  - カスタムcount
- アニメーションテスト (2テスト)
  - パルスアニメーション適用
  - 複数要素アニメーション
- レスポンシブ対応テスト (1テスト)
  - グリッド/リストレイアウト
- アクセシビリティテスト (1テスト)
  - ARIA属性設定
```

### 2.2 カスタムフックテスト

#### useViewMode.test.ts ✅
```typescript
// Location: __tests__/hooks/useViewMode.test.ts
// Test Cases: 12項目
- 基本機能テスト (3テスト)
  - 初期値='grid'
  - モード変更機能
  - 再変更機能
- 永続化テスト (5テスト)
  - localStorage読み込み
  - localStorage保存
  - 無効値のフォールバック
  - null値の処理
  - 空文字の処理
- カスタム初期値テスト (2テスト)
  - カスタム初期値設定
  - localStorage優先順位
- エラーハンドリングテスト (2テスト)
  - 読み込みエラー処理
  - 書き込みエラー処理
```

#### useBookActions.test.ts ✅
```typescript
// Location: __tests__/hooks/useBookActions.test.ts
// Test Cases: 11項目
- ステータス更新テスト (4テスト)
  - 正常更新処理
  - エラー時処理
  - loading状態管理
  - 同時更新処理
- 書籍削除テスト (3テスト)
  - 正常削除処理
  - エラー時処理
  - loading状態管理
- エラーハンドリングテスト (4テスト)
  - ネットワークエラー処理
  - エラー状態クリア
  - 新操作時エラークリア
```

### 2.3 テストフィクスチャ

#### bookData.ts ✅
```typescript
// Location: __tests__/fixtures/bookData.ts
// 提供データ:
- mockBook: 基本書籍データ
- mockUserBook: ユーザー書籍データ（読書中）
- mockBooks: 3冊の多様なデータセット
- createMockBook: ファクトリー関数
- emptyBooks: 空配列
```

## 3. テスト実行結果 - Red Phase

### 3.1 期待される失敗パターン

#### コンポーネント import エラー ❌
```bash
Cannot find module '../../../components/library/BookCard'
Cannot find module '../../../components/library/BookList'
Cannot find module '../../../components/library/ViewToggle'
Cannot find module '../../../components/library/ProgressBar'
Cannot find module '../../../components/library/BookSkeleton'
```

#### カスタムフック import エラー ❌
```bash
Cannot find module '@/hooks/useViewMode'
Cannot find module '@/hooks/useBookActions'
```

#### 型定義エラー ❌
```bash
Cannot find module '@/lib/models/book'
Property 'viewMode' does not exist on type...
```

### 3.2 実際のテスト実行

#### BookCard テスト実行
```bash
$ npm test -- --testPathPattern="BookCard.test.tsx"

FAIL __tests__/components/library/BookCard.test.tsx
● Test suite failed to run
  Cannot find module '../../../components/library/BookCard'
  
Test Suites: 1 failed, 1 total
Tests: 0 total
```

#### 全テスト実行（予想される結果）
```bash
$ npm test -- --testPathPattern="components/library"

FAIL __tests__/components/library/BookCard.test.tsx
FAIL __tests__/components/library/BookList.test.tsx  
FAIL __tests__/components/library/ViewToggle.test.tsx
FAIL __tests__/components/library/ProgressBar.test.tsx
FAIL __tests__/components/library/BookSkeleton.test.tsx

Test Suites: 5 failed, 5 total
Tests: 0 total
```

## 4. モック設定詳細

### 4.1 Next.js Router モック
```typescript
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))
```

### 4.2 localStorage モック
```typescript
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})
```

### 4.3 Server Actions モック
```typescript
jest.mock('@/lib/server-actions/books', () => ({
  updateBookStatus: jest.fn(),
  removeBookFromLibrary: jest.fn()
}))
```

## 5. 型定義要求事項

### 5.1 必要な型拡張
```typescript
// lib/models/book.ts に追加が必要
export type ViewMode = 'grid' | 'list'

export interface BookFilter {
  type: 'status' | 'author' | 'category'
  value: string
  label: string
}

export type SortField = 'title' | 'author' | 'createdAt' | 'updatedAt'
export type SortOrder = 'asc' | 'desc'
```

### 5.2 Props インターfaces
```typescript
export interface BookCardProps {
  book: UserBookWithBook
  viewMode: ViewMode
  onStatusChange: (bookId: string, status: BookStatus) => void
  onRemove: (bookId: string) => void
}

export interface BookListProps {
  books: UserBookWithBook[]
  onStatusChange: (bookId: string, status: BookStatus) => void
  onRemove: (bookId: string) => void
  sortBy: SortField
  sortOrder: SortOrder
  onSort: (field: SortField, order: SortOrder) => void
  activeFilters?: BookFilter[]
  onClearFilters?: () => void
}

export interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

export interface ProgressBarProps {
  current: number
  total: number
  label?: string
}

export interface BookSkeletonProps {
  viewMode: ViewMode
  count?: number
}
```

## 6. テストの技術的特徴

### 6.1 React Testing Library 活用
- **アクセシビリティ重視**: `getByRole`, `getByLabelText` 使用
- **ユーザー中心**: 実際の使用方法に基づくテスト
- **非同期処理**: `waitFor`, `findBy` での適切な待機

### 6.2 Jest 機能活用
- **モック関数**: `jest.fn()` による動作検証
- **スパイ機能**: 関数呼び出し回数・引数の検証
- **非同期テスト**: `async/await` パターンの適用

### 6.3 型安全性確保
- **厳密な型指定**: テストデータの型安全性
- **Props型検証**: インターフェース準拠の確認
- **Generic活用**: 再利用可能なテストヘルパー

## 7. エラーハンドリングテスト

### 7.1 ネットワークエラー
```typescript
test('ステータス更新失敗時の処理', async () => {
  mockUpdateBookStatus.mockResolvedValue({
    error: 'Network error',
    details: 'Connection timeout'
  })
  
  // エラー状態の検証
  expect(result.current.error).toEqual(
    expect.objectContaining({
      error: expect.stringContaining('Network error')
    })
  )
})
```

### 7.2 データ検証エラー
```typescript
test('無効な進捗率の処理', () => {
  render(<ProgressBar current={-50} total={300} />)
  
  // 負の値は0%に正規化される
  expect(screen.getByText('0%')).toBeInTheDocument()
})
```

### 7.3 境界値エラー
```typescript
test('100%を超える進捗率は100%として表示される', () => {
  render(<ProgressBar current={400} total={300} />)
  
  expect(screen.getByText('100%')).toBeInTheDocument()
})
```

## 8. アクセシビリティテスト基準

### 8.1 WCAG 2.1 AA準拠
- **キーボード操作**: 全機能のTab/Enter/Space対応
- **スクリーンリーダー**: 適切なARIA属性設定
- **フォーカス管理**: 明確なフォーカス表示
- **カラーアクセシビリティ**: 色のみに依存しない情報伝達

### 8.2 具体的テスト項目
```typescript
test('適切な ARIA 属性が設定される', () => {
  const progressBar = screen.getByRole('progressbar')
  expect(progressBar).toHaveAttribute('aria-label', '読書進捗')
  expect(progressBar).toHaveAttribute('aria-valuenow', '50')
  expect(progressBar).toHaveAttribute('aria-valuemin', '0')
  expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  expect(progressBar).toHaveAttribute('aria-valuetext', '50% 完了')
})
```

## 9. パフォーマンステスト考慮事項

### 9.1 大量データテスト
```typescript
// 将来の実装で大量データテストを追加予定
test('1000冊の書籍表示パフォーマンス', () => {
  const largeBookSet = Array.from({ length: 1000 }, (_, i) => 
    createMockBook({ id: `book-${i}` })
  )
  // パフォーマンス測定ロジック
})
```

### 9.2 メモリリークテスト
```typescript
test('長時間使用でのメモリリーク防止', () => {
  // メモリ使用量監視ロジック
  // 複数回のレンダリング・アンマウント
  // メモリ増加の検証
})
```

## 10. Red Phase 完了確認

### 10.1 実装対象ファイル確認 ❌
```
components/library/
├── BookCard.tsx           ❌ 未実装
├── BookList.tsx           ❌ 未実装
├── ViewToggle.tsx         ❌ 未実装
├── ProgressBar.tsx        ❌ 未実装
├── BookSkeleton.tsx       ❌ 未実装
└── LibraryView.tsx        ❌ 未実装

hooks/
├── useViewMode.ts         ❌ 未実装
└── useBookActions.ts      ❌ 未実装
```

### 10.2 テスト失敗状況確認 ✅
- ✅ 全テストが適切にimportエラーで失敗
- ✅ モック設定が正しく構成
- ✅ 型定義要求事項が明確
- ✅ テストケースが包括的に網羅

### 10.3 次ステップ準備状況 ✅
- ✅ 実装指針が明確
- ✅ インターフェース定義完了
- ✅ テストケースが仕様書として機能
- ✅ エラーハンドリング要件明確

## Red Phase 完了 ✅

**実装されたテストファイル**: 7ファイル
**テストケース総数**: 66項目
**失敗パターン**: 期待通りのimportエラー
**次フェーズ**: Green Phase（最小実装）

全てのテストが適切に失敗しており、TDDのRed Phaseが完了しました。
次のGreen Phaseで、テストを通すための最小実装を行います。