# TASK-101: 書籍検索API実装 - Red Phase (失敗するテスト)

## テスト実装結果

### ✅ テスト環境セットアップ完了
- Jest + React Testing Library インストール
- Next.js対応のJest設定ファイル作成
- TypeScript対応のテスト環境構築
- パッケージ.json にテストスクリプト追加

### 🔴 失敗するテスト実装完了

#### 1. パラメータバリデーションテスト
**ファイル**: `lib/google-books/__tests__/validation.test.ts`
- ✅ 有効なパラメータテスト
- ✅ 空のクエリエラーテスト  
- ✅ 最大件数超過エラーテスト
- ✅ 負の値エラーテスト
- ✅ デフォルト値適用テスト

#### 2. レスポンス正規化テスト
**ファイル**: `lib/google-books/__tests__/normalize.test.ts`
- ✅ 正常なレスポンス変換テスト
- ✅ 不完全データ処理テスト

#### 3. 再試行ロジックテスト
**ファイル**: `lib/google-books/__tests__/retry.test.ts`
- ✅ 成功時再試行無しテスト
- ✅ 429エラー時再試行テスト
- ✅ 最大回数後エラーテスト

#### 4. APIエンドポイントテスト
**ファイル**: `__tests__/api/books/search.test.ts`
- ✅ 認証済みユーザー検索成功テスト
- ✅ 未認証ユーザー401エラーテスト
- ✅ 不正パラメータ400エラーテスト

### 📊 テスト実行結果
```
Test Suites: 4 failed, 4 total
Tests:       0 total
Snapshots:   0 total
Time:        1.273 s

ERRORS:
- Cannot find module '../validation'
- Cannot find module '../normalize' 
- Cannot find module '../retry'
- Cannot find module '@/lib/supabase/server'
```

### ✅ 期待された失敗
全てのテストが期待通り失敗しています：
- 実装ファイルがまだ存在しない
- モジュールが見つからないエラー
- これがTDDのRed phaseの正常な状態

### 🎯 次のステップ（Green Phase）
1. `lib/google-books/validation.ts` - パラメータバリデーション
2. `lib/google-books/normalize.ts` - レスポンス正規化
3. `lib/google-books/retry.ts` - 再試行ロジック  
4. `lib/google-books/client.ts` - Google Books APIクライアント
5. `app/api/books/search/route.ts` - APIエンドポイント

### 📝 実装予定のインターfaces
```typescript
// 検索パラメータ
interface SearchParams {
  q: string
  maxResults?: number
  startIndex?: number
  langRestrict?: string
}

// 正規化された書籍データ
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

// 検索レスポンス
interface SearchResponse {
  items: Book[]
  totalItems: number
  hasMore: boolean
}
```

### ⚠️ 注意事項
- 全テストが失敗している状態は正常
- 実装ファイルを作成後、テストが段階的に通るように実装
- エラーハンドリングも含めて実装予定

## Red Phase 完了 ✅
失敗するテストの実装が完了しました。次はGreen Phaseでテストを通す最小実装を行います。