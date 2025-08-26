# TASK-301: ユーザープロフィール・設定画面 - 詳細要件定義

## 概要

ユーザーが自分のプロフィール情報と表示設定を管理できる包括的な設定画面を実装します。

## 要件リンク

- **REQ-201**: ユーザープロフィール管理
- **NFR-201**: ユーザビリティ要件

## 前提条件

- ユーザーは認証済みである
- UserProfileモデルは既にデータベースに存在している
- Supabase認証システムが動作している

## 機能要件

### F301-01: ユーザープロフィール表示・編集

**画面構成:**
- プロフィール画像表示エリア
- 基本情報編集フォーム
- 保存・キャンセルボタン

**編集可能項目:**
- 表示名（name）
- アバター画像URL（avatarUrl）
- 読書目標設定（readingGoal）

**バリデーション:**
- 表示名: 必須、1-50文字
- 読書目標: 任意、1-365冊/年

### F301-02: テーマ設定機能

**選択肢:**
- Light（明るいテーマ）
- Dark（暗いテーマ）  
- System（システム設定に従う）

**実装要件:**
- 設定変更は即座に反映
- ページリロード後も設定を保持
- CSS変数を使用したテーマ切り替え

### F301-03: 表示設定管理

**本棚表示設定:**
- 表示モード: Grid（グリッド） / List（リスト）
- 1ページあたりの表示冊数: 10, 20, 50, 100冊
- デフォルト書籍種類: physical, kindle, epub, audiobook, other

**保存要件:**
- 設定変更時に自動保存
- UserProfileテーブルに永続化

### F301-04: アバター画像アップロード

**対応形式:**
- JPEG, PNG, WebP
- 最大ファイルサイズ: 2MB
- 推奨解像度: 256x256px

**処理フロー:**
1. ファイル選択・バリデーション
2. Supabase Storageにアップロード
3. UserProfile.avatarUrlを更新
4. 画像プレビューを表示

## 非機能要件

### NFR301-01: パフォーマンス

- 設定画面の初期表示: 2秒以内
- 設定保存処理: 1秒以内
- 画像アップロード: ファイルサイズに応じた適切なレスポンス

### NFR301-02: ユーザビリティ

- 直感的なUI設計
- リアルタイムな設定プレビュー
- 適切なフィードバックメッセージ
- モバイル対応（レスポンシブデザイン）

### NFR301-03: アクセシビリティ

- WCAG 2.1 AA準拠
- キーボード操作対応
- スクリーンリーダー対応
- 適切なコントラスト比

## データモデル

### 既存UserProfileモデル活用

```prisma
model UserProfile {
  id               String    @id @db.Uuid
  name             String                     // 編集対象
  avatarUrl        String?                    // 編集対象
  theme            String    @default("system") // 編集対象
  displayMode      String    @default("grid")   // 編集対象
  booksPerPage     Int       @default(20)       // 編集対象
  defaultBookType  BookType  @default(physical) // 編集対象
  readingGoal      Int?                       // 編集対象
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  // リレーション
  userBooks        UserBook[]
  wishlistItems    WishlistItem[]
  collections      Collection[]
}
```

### 追加型定義

```typescript
// プロフィール更新用の型
interface UserProfileUpdateData {
  name: string
  avatarUrl?: string | null
  readingGoal?: number | null
}

// 設定更新用の型
interface UserSettingsUpdateData {
  theme: 'light' | 'dark' | 'system'
  displayMode: 'grid' | 'list'
  booksPerPage: 10 | 20 | 50 | 100
  defaultBookType: BookType
}

// 画像アップロード用の型
interface ImageUploadResult {
  success: boolean
  url?: string
  error?: string
}
```

## API設計

### Server Actions

```typescript
// プロフィール取得
async function getUserProfile(): Promise<ActionResult<UserProfile>>

// プロフィール更新
async function updateUserProfile(data: UserProfileUpdateData): Promise<ActionResult<UserProfile>>

// 設定更新
async function updateUserSettings(data: UserSettingsUpdateData): Promise<ActionResult<UserProfile>>

// アバター画像アップロード
async function uploadAvatarImage(file: File): Promise<ActionResult<ImageUploadResult>>

// アバター画像削除
async function deleteAvatarImage(): Promise<ActionResult<void>>
```

## ページ構成

### `/app/profile/page.tsx`

**メイン設定画面:**
- プロフィール情報編集セクション
- テーマ設定セクション
- 表示設定セクション
- アバター画像管理セクション

### コンポーネント構成

```
components/profile/
├── ProfilePage.tsx           // メインページコンポーネント
├── ProfileForm.tsx           // プロフィール編集フォーム
├── ThemeSelector.tsx         // テーマ選択コンポーネント
├── DisplaySettings.tsx       // 表示設定コンポーネント
├── AvatarUpload.tsx          // アバター画像アップロード
└── index.ts                  // エクスポート
```

## セキュリティ要件

### SEC301-01: 認証・認可

- プロフィール画面は認証が必要
- 自分のプロフィールのみ編集可能
- Supabaseセッションでの認証チェック

### SEC301-02: 入力検証

- サーバーサイドでの厳密なバリデーション
- XSS攻撃対策（入力値のサニタイズ）
- ファイルアップロード時の検証

### SEC301-03: ファイルアップロード

- 許可された拡張子のみ受け入れ
- ファイルサイズ制限の実装
- マルウェアスキャン（将来的に）

## エラーハンドリング

### 想定エラーケース

1. **認証エラー**: ログインページへリダイレクト
2. **バリデーションエラー**: フィールド別エラーメッセージ表示
3. **ネットワークエラー**: 再試行可能な通知表示
4. **ファイルアップロードエラー**: 具体的なエラー原因を表示
5. **サーバーエラー**: 汎用エラーメッセージ表示

### エラーメッセージ例

```typescript
const PROFILE_ERROR_MESSAGES = {
  NAME_REQUIRED: '表示名は必須です',
  NAME_TOO_LONG: '表示名は50文字以内で入力してください',
  READING_GOAL_INVALID: '読書目標は1-365冊の範囲で設定してください',
  FILE_TOO_LARGE: 'ファイルサイズは2MB以下にしてください',
  INVALID_FILE_TYPE: 'JPEG、PNG、WebP形式のファイルのみアップロード可能です',
  UPLOAD_FAILED: '画像のアップロードに失敗しました',
  SAVE_FAILED: '設定の保存に失敗しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。しばらく経ってからお試しください'
} as const
```

## テスト要件

### 単体テスト

- プロフィール更新ロジック
- 設定値のバリデーション
- ファイルアップロード処理
- エラーハンドリング

### 統合テスト

- Server Actionsのデータベース連携
- Supabase Storageとの連携
- 認証フローの確認

### E2Eテスト

- プロフィール編集フロー全体
- テーマ切り替えの動作確認
- 画像アップロード・削除フロー
- エラーケースの動作確認

## 受け入れ基準

### ✅ 完了条件

1. **基本機能**
   - [x] プロフィール情報の表示・編集ができる
   - [x] テーマ設定の切り替えが動作する
   - [x] 表示設定の変更が反映される
   - [x] アバター画像のアップロード・削除ができる

2. **データ永続化**
   - [x] 設定変更がデータベースに保存される
   - [x] ページリロード後も設定が保持される

3. **ユーザー体験**
   - [x] 直感的でわかりやすいUI
   - [x] 適切なフィードバックメッセージ
   - [x] レスポンシブデザイン対応

4. **品質**
   - [x] 単体テスト: カバレッジ80%以上
   - [x] エラーハンドリングが適切に動作
   - [x] アクセシビリティ要件を満たす

## 実装順序

1. **Phase 1**: データ構造・Server Actions
2. **Phase 2**: 基本UI・プロフィール編集
3. **Phase 3**: テーマ切り替え機能
4. **Phase 4**: 表示設定管理
5. **Phase 5**: アバター画像アップロード
6. **Phase 6**: エラーハンドリング・最適化

## 依存関係

### 技術的依存

- Next.js App Router
- Supabase Auth & Storage
- Prisma ORM
- shadcn/ui コンポーネント
- Tailwind CSS

### 機能的依存

- TASK-003 (Supabase Auth設定) ✅
- 既存UserProfileモデル ✅
- 認証システム ✅

---

**作成日**: 2025-08-25  
**最終更新**: 2025-08-25  
**レビュー状況**: 初版作成完了