# TASK-102: 書籍データモデルとServer Actions - テスト実装（失敗）

## 実行結果

### ✅ 成功したテスト
- `book-validation.test.ts`: 26/26 テスト成功
- 既存テスト: `validation.test.ts`, `retry.test.ts`, `normalize.test.ts`

### ❌ 失敗したテスト

#### 1. HTMLタグ除去機能の不備 (book-normalizer.test.ts)

**テスト:** HTMLタグを除去する
**期待値:** `"危険なタイトル"`
**実際値:** `"alert(\"xss\")危険なタイトル"`

**問題:** 
`sanitizeString`関数でHTMLタグの除去が正しく実装されていない。`<script>`タグ内のJavaScriptコードが残っている。

**修正必要箇所:** `/lib/utils/book-normalizer.ts`

#### 2. テスト環境設定の問題 (books.test.ts)

**エラー:** `ReferenceError: TextEncoder is not defined`

**問題:** 
Next.jsのサーバーサイド関数をテスト環境で実行する際のPolyfillが不足している。

**修正必要箇所:** 
- Jest設定
- テストファイルのモック設定

## テスト実装状況

### 作成済みテストファイル

#### 1. `/lib/utils/book-normalizer.test.ts`
- **テスト数:** 14個
- **状態:** 13成功、1失敗
- **失敗理由:** HTMLタグ除去機能未実装

**テスト内容:**
- ✅ 完全なデータ正規化
- ✅ 最小データ正規化
- ✅ ISBN優先選択
- ✅ HTTP→HTTPS変換
- ✅ 文字列長制限
- ❌ HTMLタグ除去
- ✅ 無効データエラー処理
- ✅ 日付正規化
- ✅ 範囲外値除外
- ✅ カテゴリ数制限

#### 2. `/lib/validation/book-validation.test.ts`
- **テスト数:** 26個
- **状態:** 全成功
- **カバレッジ:** 完全

**テスト内容:**
- ✅ 有効データ通過
- ✅ 必須フィールドバリデーション
- ✅ 文字列長制限バリデーション  
- ✅ 配列型バリデーション
- ✅ ISBN形式バリデーション
- ✅ URL形式バリデーション
- ✅ 数値範囲バリデーション
- ✅ UserIDバリデーション
- ✅ Enum値バリデーション

#### 3. `/lib/server-actions/books.test.ts`
- **テスト数:** 15個
- **状態:** テスト実行不可
- **問題:** 環境設定エラー

**テスト内容:**
- ❌ addBookToLibrary機能テスト
- ❌ updateBookStatus機能テスト
- ❌ removeBookFromLibrary機能テスト
- ❌ getUserBooks機能テスト

### 実装済みファイル（テスト駆動開発用）

#### 1. `/lib/models/book.ts`
- 型定義完了
- Google Books APIレスポンス型定義
- アプリケーション用データ型定義

#### 2. `/lib/utils/book-normalizer.ts`
- 基本機能実装済み
- **問題:** HTMLタグ除去機能不完全

#### 3. `/lib/validation/book-validation.ts`
- 全機能実装済み
- バリデーションエラークラス実装
- 各種バリデーション関数実装

#### 4. `/lib/server-actions/books.ts`
- 基本構造実装済み
- **問題:** テスト実行時のモック設定未対応

## 次のステップ (Green Phase)

### 優先度1: HTMLタグ除去機能修正

```typescript
// 修正必要: /lib/utils/book-normalizer.ts
function sanitizeString(input?: string, maxLength?: number): string | undefined {
  if (!input) return undefined
  
  // 修正前: 基本的なHTMLタグ除去のみ
  let cleaned = input.replace(/<[^>]*>/g, '').trim()
  
  // 修正後: より厳密なHTMLサニタイゼーション
  // - script/styleタグの中身も除去
  // - HTMLエンティティのデコード
  // - 連続する空白の正規化
}
```

### 優先度2: テスト環境設定修正

```javascript
// jest.config.js に追加
setupFiles: ['<rootDir>/jest.setup.js']

// jest.setup.js に追加  
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
```

### 優先度3: Supabaseクライアント作成

```typescript
// /lib/supabase/server.ts 実装
export async function createClient() {
  // Supabase サーバークライアント実装
}
```

## 技術的債務

1. **HTMLサニタイゼーション**
   - 現在の実装では`<script>`内容が除去されない
   - XSS攻撃の可能性
   - サードパーティライブラリ（DOMPurifyなど）の検討

2. **テスト環境のNext.js対応**
   - Server Actions のテストが困難
   - より軽量なモック設定が必要

3. **エラーハンドリング**
   - データベース接続エラーの詳細区分
   - ユーザー向けエラーメッセージの国際化

## 推定修正時間

- HTMLタグ除去機能修正: 30分
- テスト環境設定修正: 45分  
- Supabaseクライアント実装: 30分
- **合計**: 約1時間45分

## テストカバレッジ目標

- **ライン カバレッジ**: 90%以上
- **分岐カバレッジ**: 85%以上
- **関数カバレッジ**: 100%

現在のカバレッジ（推定）:
- `book-normalizer.ts`: 85%（HTMLサニタイゼーション分岐のみ不足）
- `book-validation.ts`: 100%
- `books.ts`: 0%（テスト未実行のため）