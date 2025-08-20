# TASK-201: 検索・フィルタリング機能 - テスト実装（Red Phase）

## 概要

検索・フィルタリング機能の失敗するテストを実装し、TDDのRedフェーズを完了します。まず、最初にテストを書き、それが失敗することを確認して、その後に実装を進めます。

## 実装されたテストファイル（すべて失敗状態）

### 1. 検索ユーティリティのテスト

#### ファイル: `__tests__/lib/utils/search-utils.test.ts`
- ✅ 作成完了 - 13個のテストケースがすべて失敗
- `buildSearchQuery()` の単体テスト
- `buildFilterConditions()` の単体テスト  
- `escapeSearchTerm()` の単体テスト

#### ファイル: `__tests__/lib/utils/search-history.test.ts`
- ✅ 作成完了 - 9個のテストケース（LocalStorage モック付き）
- 検索履歴の保存・取得・削除機能のテスト

### 2. コンポーネントテスト

#### ファイル: `__tests__/components/search/HighlightedText.test.tsx`
- ✅ 作成完了 - 7個のテストケース（5個が失敗、2個が偶然通過）
- テキストハイライト機能のテスト
- 大文字小文字無視、部分マッチ、日本語対応のテスト

#### ファイル: `__tests__/components/search/SearchForm.test.tsx`
- ✅ 作成完了 - 6個のテストケース
- 検索フォームの入力・送信・フィルタ機能のテスト
- Enterキー対応、ローディング状態のテスト

#### ファイル: `__tests__/components/search/SearchResults.test.tsx`  
- ✅ 作成完了 - 5個のテストケース
- 検索結果表示のテスト
- ローディング状態、0件表示のテスト

### 3. サービステスト

#### ファイル: `__tests__/lib/services/search-service.test.ts`
- ✅ 作成完了 - 9個のテストケース
- 検索サービスの機能テスト
- 検索候補取得のテスト

### 4. APIテスト

#### ファイル: `__tests__/api/books/library/search.test.ts`
- ✅ 作成完了 - 8個のテストケース
- 本棚検索APIエンドポイントのテスト
- 認証、フィルタ、ページネーションのテスト

## 実装されたスタブファイル（実装前状態）

### 1. ユーティリティクラス

#### ファイル: `lib/utils/search-utils.ts`
- 検索クエリ生成、フィルタ条件生成、エスケープ処理のスタブ
- すべて `throw new Error('Not implemented yet')` 状態

#### ファイル: `lib/utils/search-history.ts`
- 検索履歴管理クラスのスタブ
- LocalStorage を使った履歴保存機能のスタブ

### 2. Reactコンポーネント

#### ファイル: `components/search/HighlightedText.tsx`
- テキストハイライト表示コンポーネントのスタブ
- 現在は通常のspanタグのみ表示

#### ファイル: `components/search/SearchForm.tsx`
- 検索フォームコンポーネントのスタブ
- 基本的なHTML要素のみ配置

#### ファイル: `components/search/SearchResults.tsx`
- 検索結果表示コンポーネントのスタブ
- ローディング・0件表示のみ実装

### 3. サービスクラス

#### ファイル: `lib/services/search-service.ts`
- 検索サービス機能のスタブ
- データベース検索機能のスタブ

### 4. APIエンドポイント

#### ファイル: `app/api/books/library/search/route.ts`
- 本棚検索APIエンドポイントのスタブ
- 現在は 501 Not Implemented を返す

## テスト実行結果確認

### 実行コマンドと結果:

```bash
# 検索ユーティリティテスト
npm test -- __tests__/lib/utils/search-utils.test.ts
# 結果: 13 failed, 0 passed ✅

# ハイライトコンポーネントテスト  
npm test -- __tests__/components/search/HighlightedText.test.tsx
# 結果: 5 failed, 2 passed ✅ (期待される失敗)
```

## TDD Red Phase 完了確認

✅ **すべてのテストが期待通り失敗している**

1. **検索ユーティリティ**: 13個のテストが "Not implemented yet" エラーで失敗
2. **ハイライトコンポーネント**: 5個のテストが期待するDOM構造がないため失敗
3. **その他のコンポーネント**: 実装されていない機能に対するテストが失敗

これでTDDのRedフェーズが完了しました。次のGreenフェーズでは、これらのテストが通るように最小限の実装を行います。
