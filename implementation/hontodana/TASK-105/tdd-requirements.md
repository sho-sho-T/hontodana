# TASK-105: ウィッシュリスト機能 - 詳細要件定義

## 概要

読みたい書籍を管理するウィッシュリスト機能を実装する。優先度管理、本棚への移動、価格アラート機能を含む。

## 機能要件

### 1. WishlistItem モデル

**目的**: ウィッシュリストアイテムの管理

**データ構造** (既存のPrismaスキーマより):
```typescript
interface WishlistItem {
  id: string
  userId: string       // ユーザーID
  bookId: string       // 書籍ID
  priority: WishlistPriority // 優先度: low, medium, high, urgent
  reason?: string      // 追加理由
  targetDate?: Date    // 目標読書日
  priceAlert?: Decimal // 価格アラート設定
  createdAt: Date
  updatedAt: Date
}
```

**優先度レベル**:
- `low`: 低優先度（いつか読みたい）
- `medium`: 中優先度（デフォルト）
- `high`: 高優先度（近いうちに読みたい）
- `urgent`: 緊急（すぐに読みたい）

### 2. ウィッシュリスト管理 Server Actions

**2.1 addToWishlist**

**目的**: 書籍をウィッシュリストに追加

**引数**:
```typescript
interface AddToWishlistInput {
  bookId: string
  priority?: WishlistPriority
  reason?: string
  targetDate?: Date
  priceAlert?: number
}
```

**処理フロー**:
1. 認証チェック
2. 書籍存在確認
3. 重複チェック（既に本棚にある場合はエラー）
4. ウィッシュリストアイテムの作成

**戻り値**:
```typescript
interface AddToWishlistResult {
  success: boolean
  data?: WishlistItemWithBook
  error?: string
}
```

**2.2 removeFromWishlist**

**目的**: ウィッシュリストから書籍を削除

**引数**:
```typescript
interface RemoveFromWishlistInput {
  wishlistItemId: string
}
```

**2.3 updateWishlistPriority**

**目的**: ウィッシュリストアイテムの優先度を更新

**引数**:
```typescript
interface UpdatePriorityInput {
  wishlistItemId: string
  priority: WishlistPriority
}
```

**2.4 moveToLibrary**

**目的**: ウィッシュリストアイテムを本棚に移動

**引数**:
```typescript
interface MoveToLibraryInput {
  wishlistItemId: string
  bookType?: BookType
  status?: BookStatus
}
```

**処理フロー**:
1. ウィッシュリストアイテムの取得
2. UserBook の作成
3. ウィッシュリストアイテムの削除
4. トランザクション処理

### 3. ウィッシュリスト取得機能

**3.1 getUserWishlist**

**目的**: ユーザーのウィッシュリストを取得

**引数**:
```typescript
interface GetWishlistInput {
  priority?: WishlistPriority
  sortBy?: 'createdAt' | 'priority' | 'targetDate' | 'title'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}
```

**ソート機能**:
- 作成日順（新しい順/古い順）
- 優先度順（高い順/低い順）
- 目標日順（近い順/遠い順）
- タイトル順（あいうえお順/逆順）

### 4. 優先度管理システム

**優先度の視覚的表現**:
- `urgent`: 🔴 赤色、太字
- `high`: 🟡 オレンジ色
- `medium`: 🟢 グリーン色（デフォルト）
- `low`: ⚪ グレー色

**優先度による自動ソート**:
- urgent → high → medium → low の順

### 5. 価格アラート機能（オプション）

**目的**: 書籍価格の変動を監視（将来的な拡張）

**基本機能**:
- 希望価格の設定
- 価格降下時の通知（実装は将来）

## 非機能要件

### パフォーマンス
- ウィッシュリスト表示は 2秒以内
- 追加・削除操作は 1秒以内
- 100件のアイテムまで快適に表示

### ユーザビリティ
- 直感的な優先度変更（ドラッグ&ドロップまたはボタン）
- ワンクリックでの本棚移動
- 視覚的に分かりやすい優先度表示

### データ整合性
- 同一書籍の重複防止
- 本棚とウィッシュリストの排他制御
- ユーザー間のデータ分離

## UI/UX要件

### ウィッシュリスト表示画面
- カード形式またはリスト形式の選択可能
- 優先度による色分け表示
- ソート・フィルタリング機能

### 書籍追加フロー
1. 書籍検索から「ウィッシュリストに追加」ボタン
2. 優先度・理由・目標日の入力モーダル
3. 追加完了の確認メッセージ

### 本棚移動フロー
1. ウィッシュリストアイテムから「本棚に移動」ボタン
2. 書籍タイプ・ステータスの選択
3. 移動完了の確認メッセージ

## エラーハンドリング

### エラーケース
1. **重複追加**: 既に本棚にある書籍の追加
2. **権限エラー**: 他のユーザーのウィッシュリストへのアクセス
3. **存在しない書籍**: 無効な bookId
4. **データベースエラー**: 接続失敗、制約違反

### エラーメッセージ
- 「この書籍は既に本棚に登録されています」
- 「ウィッシュリストに追加できませんでした」
- 「本棚への移動に失敗しました」

## 受け入れ基準

### 機能面
1. ✅ 書籍をウィッシュリストに追加できる
2. ✅ 優先度を設定・変更できる
3. ✅ ウィッシュリストを表示・ソートできる
4. ✅ ウィッシュリストから書籍を削除できる
5. ✅ ウィッシュリストから本棚に移動できる

### UI/UX面
1. ✅ 優先度が視覚的に分かりやすい
2. ✅ 操作が直感的で分かりやすい
3. ✅ レスポンシブ対応
4. ✅ アクセシビリティ対応

### エラーハンドリング
1. ✅ 重複追加の防止
2. ✅ 適切なエラーメッセージ表示
3. ✅ データ整合性の確保

## 技術的制約

### データベース設計
- WishlistItem テーブルは既存
- Book テーブルとの外部キー制約
- ユニーク制約: (userId, bookId)

### 認証・認可
- Supabase Auth による認証
- RLS による行レベルセキュリティ
- ユーザー間のデータ分離

## 実装優先度

1. **High**: 基本的な追加・削除・表示機能
2. **High**: 優先度管理システム
3. **Medium**: 本棚移動機能
4. **Medium**: ソート・フィルタリング
5. **Low**: 価格アラート機能（将来的な拡張）

## テスト要件

### 単体テスト
- ウィッシュリスト管理ロジック
- 優先度変更機能
- バリデーション機能

### 統合テスト
- Server Actions の動作
- データベース操作
- 認証・認可機能

### E2Eテスト
- ウィッシュリスト管理フロー
- 本棚移動フロー
- エラーハンドリング

## 参考資料

- 既存の書籍管理機能 (TASK-102)
- データベーススキーマ: `prisma/schema.prisma`
- UI コンポーネント: 既存の BookCard, BookList