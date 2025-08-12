# TASK-101: 書籍検索API実装 - 要件定義

## 概要
Google Books APIと連携し、書籍検索機能を提供するサーバーサイドAPIエンドポイントを実装する。

## 機能要件

### 1. API エンドポイント
- **パス**: `/api/books/search`
- **メソッド**: GET
- **認証**: 必要（Supabase Auth）

### 2. 検索パラメータ
- `q` (required): 検索クエリ文字列
- `maxResults` (optional): 取得件数 (デフォルト: 10, 最大: 40)
- `startIndex` (optional): 開始インデックス (デフォルト: 0)
- `langRestrict` (optional): 言語制限 (デフォルト: ja)

### 3. レスポンス形式
```typescript
interface SearchResponse {
  items: Book[]
  totalItems: number
  hasMore: boolean
}

interface Book {
  id: string
  title: string
  authors?: string[]
  publisher?: string
  publishedDate?: string
  description?: string
  pageCount?: number
  categories?: string[]
  averageRating?: number
  ratingsCount?: number
  imageLinks: {
    thumbnail?: string
    small?: string
    medium?: string
    large?: string
  }
  language: string
  isbn?: {
    isbn10?: string
    isbn13?: string
  }
}
```

### 4. エラーハンドリング
- 400: 不正なパラメータ
- 401: 認証エラー
- 429: レート制限超過
- 500: Google Books API エラー
- 503: サービス利用不可

### 5. レート制限対応
- APIキー無し: 適切な間隔でリクエスト
- 429エラー時: 指数バックオフで再試行
- 最大3回まで再試行

## 非機能要件

### パフォーマンス
- レスポンス時間: 3秒以内
- 同時接続: 10接続まで対応

### セキュリティ
- 認証必須
- CSRF対策
- 入力値サニタイゼーション

### 可用性
- Google Books API ダウン時のエラーハンドリング
- タイムアウト設定（10秒）

## 受け入れ基準

### 基本機能
- [ ] 書籍タイトルで検索ができる
- [ ] 著者名で検索ができる
- [ ] ISBNで検索ができる
- [ ] 検索結果が正規化された形式で返される
- [ ] ページネーションが動作する

### エラーハンドリング
- [ ] 不正なパラメータでエラーが返される
- [ ] 認証エラーが適切に処理される
- [ ] Google Books API エラーが適切にハンドリングされる
- [ ] ネットワークエラーが適切に処理される

### パフォーマンス
- [ ] 検索処理が3秒以内で完了する
- [ ] レート制限が適切に動作する
- [ ] 再試行ロジックが動作する

### セキュリティ
- [ ] 未認証ユーザーがアクセスできない
- [ ] SQLインジェクション対策済み
- [ ] XSS対策済み

## テストデータ
```javascript
// 有効な検索クエリ
const validQueries = [
  { q: "JavaScript", expected: "プログラミング関連書籍" },
  { q: "村上春樹", expected: "日本文学" },
  { q: "9784873115658", expected: "ISBN検索" }
]

// 無効なパラメータ
const invalidParams = [
  { q: "", error: "検索クエリが空" },
  { maxResults: 100, error: "最大件数超過" },
  { maxResults: -1, error: "負の値" }
]
```

## 実装方針
1. Google Books APIクライアントの実装
2. パラメータバリデーション
3. レート制限・再試行ロジック
4. レスポンスデータ正規化
5. エラーハンドリング
6. 認証ミドルウェア統合

## API仕様参考
- Google Books API: https://developers.google.com/books/docs/v1/using
- レート制限: 100リクエスト/分（認証時）