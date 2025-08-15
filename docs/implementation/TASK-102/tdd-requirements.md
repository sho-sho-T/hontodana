# TASK-102: 書籍データモデルとServer Actions - 詳細要件定義

## 概要
書籍データモデルとServer Actions実装により、Google Books APIから取得した書籍データの永続化と管理機能を提供する。

## 詳細要件

### 1. 書籍データモデル (Book)

#### 1.1 データ構造
```typescript
interface Book {
  id: string                    // UUID (自動生成)
  googleBooksId: string        // Google Books ID (重複チェック用)
  title: string                // タイトル
  authors: string[]            // 著者リスト
  publisher?: string           // 出版社
  publishedDate?: string       // 出版日 (YYYY-MM-DD形式)
  description?: string         // 説明文
  isbn?: string                // ISBN (存在する場合)
  pageCount?: number          // ページ数
  categories: string[]         // カテゴリリスト
  thumbnail?: string          // 書影URL
  language: string            // 言語コード (デフォルト: 'ja')
  status: BookStatus          // 読書ステータス
  createdAt: Date             // 作成日時
  updatedAt: Date             // 更新日時
  userId: string              // ユーザーID (外部キー)
}

enum BookStatus {
  WANT_TO_READ = 'want_to_read'    // 読みたい
  READING = 'reading'              // 読書中
  READ = 'read'                    // 読了
}
```

#### 1.2 データベース制約
- `googleBooksId + userId` の組み合わせで一意制約
- `title`, `userId`, `status` は必須
- `authors` は空配列でも可 (不明な場合)
- `categories` は空配列でも可

### 2. Server Actions

#### 2.1 addBookToLibrary
```typescript
async function addBookToLibrary(
  bookData: GoogleBooksApiResponse,
  status: BookStatus = BookStatus.WANT_TO_READ
): Promise<Book | { error: string }>
```

**機能:**
- Google Books APIレスポンスから書籍データを正規化
- 重複チェック (同一ユーザー・同一Google Books ID)
- データベースへの保存
- 認証チェック

**入力:**
- `bookData`: Google Books APIからの生レスポンス
- `status`: 初期読書ステータス (デフォルト: want_to_read)

**処理フロー:**
1. ユーザー認証確認
2. Google Books APIレスポンスの正規化
3. 重複チェック (googleBooksId + userId)
4. 既存の場合はエラー返却
5. 新規の場合はデータ保存
6. 保存済み書籍データを返却

**エラーハンドリング:**
- 未認証ユーザー: `{ error: 'Authentication required' }`
- 重複書籍: `{ error: 'Book already exists in library' }`
- 無効データ: `{ error: 'Invalid book data' }`
- データベースエラー: `{ error: 'Database error occurred' }`

#### 2.2 updateBookStatus
```typescript
async function updateBookStatus(
  bookId: string,
  status: BookStatus
): Promise<Book | { error: string }>
```

**機能:**
- 書籍の読書ステータス更新
- 認証・認可チェック

#### 2.3 removeBookFromLibrary
```typescript
async function removeBookFromLibrary(
  bookId: string
): Promise<{ success: boolean } | { error: string }>
```

**機能:**
- 書籍をライブラリから削除
- 認証・認可チェック

#### 2.4 getUserBooks
```typescript
async function getUserBooks(
  status?: BookStatus,
  limit?: number,
  offset?: number
): Promise<Book[] | { error: string }>
```

**機能:**
- ユーザーの書籍リスト取得
- ステータスフィルタリング対応
- ページネーション対応

### 3. データ正規化ユーティリティ

#### 3.1 normalizeBookData
```typescript
function normalizeBookData(
  googleBookData: GoogleBooksApiResponse,
  userId: string,
  status: BookStatus
): Omit<Book, 'id' | 'createdAt' | 'updatedAt'>
```

**機能:**
- Google Books APIレスポンスをBookモデルに変換
- 不正なデータのサニタイズ
- デフォルト値の設定

**変換ルール:**
- `title`: volumeInfo.title || 'Unknown Title'
- `authors`: volumeInfo.authors || []
- `publisher`: volumeInfo.publisher || undefined
- `publishedDate`: volumeInfo.publishedDate (YYYY-MM-DD形式に正規化)
- `pageCount`: volumeInfo.pageCount || undefined
- `isbn`: volumeInfo.industryIdentifiers から ISBN_13 優先で取得
- `thumbnail`: imageLinks.thumbnail (https強制)

### 4. バリデーション

#### 4.1 書籍データバリデーション
- `title`: 1文字以上500文字以下
- `authors`: 各要素が500文字以下
- `publisher`: 500文字以下
- `description`: 10000文字以下
- `isbn`: ISBN-10 or ISBN-13 形式
- `pageCount`: 1以上10000以下
- `thumbnail`: 有効なURL形式

#### 4.2 ステータスバリデーション
- BookStatusエnumの有効な値のみ許可

### 5. セキュリティ要件

#### 5.1 認証・認可
- 全てのServer Actionsで認証必須
- ユーザーは自分の書籍のみアクセス可能

#### 5.2 データサニタイゼーション
- HTML/ScriptタグはXSS対策で除去
- SQLインジェクション対策はPrismaで自動対応

### 6. パフォーマンス要件

#### 6.1 レスポンス時間
- addBookToLibrary: 500ms以下
- getUserBooks: 200ms以下 (100件まで)
- updateBookStatus: 200ms以下

#### 6.2 同時実行
- 同一ユーザーの重複追加を適切にハンドリング

### 7. 受け入れ基準

#### 7.1 機能要件
- [ ] Google Books APIレスポンスから正しくBookモデルに変換できる
- [ ] 重複書籍の追加が適切に拒否される
- [ ] 認証されたユーザーのみがServer Actionsを実行できる
- [ ] 書籍ステータスの更新が正常に動作する
- [ ] 書籍の削除が正常に動作する
- [ ] ページネーション付きで書籍リストが取得できる

#### 7.2 非機能要件  
- [ ] 全てのServer Actionsが指定時間内にレスポンスを返す
- [ ] 不正なデータでもアプリケーションクラッシュしない
- [ ] XSS攻撃に対する適切な防御機能がある
- [ ] 同時実行時でもデータ整合性が保たれる

#### 7.3 テスト要件
- [ ] 単体テスト: データ正規化ロジック
- [ ] 単体テスト: バリデーションロジック  
- [ ] 統合テスト: Server Actions
- [ ] 統合テスト: データベース操作
- [ ] エラーテスト: 各種例外ケース

## 実装対象ファイル

### 新規作成ファイル
- `lib/models/book.ts` - Bookモデル型定義
- `lib/server-actions/books.ts` - Server Actions実装
- `lib/utils/book-normalizer.ts` - データ正規化ユーティリティ
- `lib/validation/book-validation.ts` - バリデーション関数
- `prisma/schema.prisma` - Prismaスキーマ (Book テーブル追加)

### テストファイル
- `__tests__/lib/server-actions/books.test.ts`
- `__tests__/lib/utils/book-normalizer.test.ts`
- `__tests__/lib/validation/book-validation.test.ts`