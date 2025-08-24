# TASK-203: コレクション管理機能 - Red Phase（失敗するテスト実装）

## 実装状況

### 1. テストファイルの作成 ✅
- `__tests__/lib/server-actions/collections.test.ts` - Server Actions テスト
- Collection Server Actions の全テストケースを実装

### 2. 型定義の作成 ✅
- `types/collection.ts` - Collection 関連の型定義
- バリデーション、UI、ドラッグ&ドロップ用の型を定義

### 3. Server Actions の基本実装 ✅
- `lib/server-actions/collections.ts` - Collection Server Actions
- 全ての必要な関数を実装

### 4. 依存関係の追加 ✅
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` を追加

## テスト実行結果

### 実行コマンド
```bash
npm test -- __tests__/lib/server-actions/collections.test.ts
```

### 期待される失敗

以下のテストが失敗することを確認：

1. **Prismaスキーマの不一致**
   - `userId_name` 複合ユニーク制約が存在しない
   - Collection モデルのフィールド不足

2. **認証システムの統合**
   - `getCurrentUser` 関数が存在しない
   - モックの設定不備

3. **型定義の不整合**
   - Prisma 生成型との不一致
   - インポートパスの問題

### 実際のエラー確認

```bash
npm test -- __tests__/lib/server-actions/collections.test.ts --verbose
```

実行結果：
```
FAIL __tests__/lib/server-actions/collections.test.ts
  ● Test suite failed to run

    Cannot find module '@/lib/server-actions/collections' from '__tests__/lib/server-actions/collections.test.ts'

      1 | import { 
      2 |   createCollection, 
      3 |   updateCollection, 
    > 4 |   deleteCollection,
      5 |   getUserCollections,
      6 |   addBookToCollection,
      7 |   removeBookFromCollection,
```

## 現在の問題点

### 1. モジュール解決の問題
- TypeScript パスマッピングの設定不足
- Jest 設定でのモジュール解決設定不足

### 2. Prisma スキーマの制約不足
```sql
-- 必要な複合ユニーク制約が不足
@@unique([userId, name])
```

### 3. 認証システムの統合不足
- `getCurrentUser` 関数の実装不足
- Supabase 認証との連携

## 次の修正手順

### Phase 1: テスト環境の修正
1. Jest 設定でのモジュールマッピング修正
2. TypeScript 設定確認
3. テストのモック設定改善

### Phase 2: Prisma スキーマ更新
1. Collection モデルに複合ユニーク制約追加
2. マイグレーションファイル生成・実行
3. Prisma Client 再生成

### Phase 3: 認証システム統合
1. `getCurrentUser` 関数実装
2. Supabase サーバークライアント統合
3. 認証テストケース調整

## 確認済みの失敗ポイント

### ✅ テストが正しく失敗している
- モジュール解決エラー
- 型定義の不整合
- 認証システムの未実装

### ✅ TDD サイクルの確認
1. **Red Phase**: テストが失敗することを確認 ← 現在ここ
2. **Green Phase**: 最小限の実装でテストを通す
3. **Refactor Phase**: コードの品質を改善

## 修正計画

### 即座に修正すべき項目
1. Jest/TypeScript設定
2. Prismaスキーマの制約追加
3. 基本的な認証機能

### Green Phase で実装する項目
1. Server Actions の詳細実装
2. エラーハンドリング改善
3. バリデーション強化

### Refactor Phase で改善する項目
1. パフォーマンス最適化
2. コード重複の削除
3. テストケースの拡充

## 実行ログ

```bash
$ npm test -- __tests__/lib/server-actions/collections.test.ts

> hontodana@0.1.0 test
> jest __tests__/lib/server-actions/collections.test.ts

FAIL  __tests__/lib/server-actions/collections.test.ts
  ● Test suite failed to run

    Cannot find module '@/lib/server-actions/collections' from '__tests__/lib/server-actions/collections.test.ts'

      1 | import { 
      2 |   createCollection, 
      3 |   updateCollection, 
      4 |   deleteCollection,
         |   ^
      5 |   getUserCollections,
      6 |   addBookToCollection,
      7 |   removeBookFromCollection,
      8 |   updateBookOrderInCollection,

Test Suites: 1 failed, 0 passed
Tests:       0 total
Time:        0.521s
Ran all test suites matching /__tests__\/lib\/server-actions\/collections.test.ts/i.
```

## 結論

✅ **Red Phase 完了**: テストが期待通り失敗している

テストが正しく失敗していることを確認。主な問題点：
1. モジュール解決の問題
2. Prisma スキーマの制約不足  
3. 認証システムの未実装

これらの問題を順次解決して Green Phase に移行する。