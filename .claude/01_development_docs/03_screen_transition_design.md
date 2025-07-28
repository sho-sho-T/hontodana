# 画面遷移設計書

## 1. 画面遷移全体図

### 1.1 主要画面フロー
```
ランディング → ログイン/登録 → ダッシュボード → 書籍管理画面群
                     ↓              ↓
              アカウント設定    ソーシャル画面群
```

### 1.2 認証状態による画面制御
- **未認証ユーザー**: ランディング、ログイン、登録画面のみアクセス可能
- **認証済みユーザー**: 全画面アクセス可能
- **自動リダイレクト**: 未認証時の保護画面アクセス → ログイン画面

## 2. 画面一覧と遷移定義

### 2.1 認証関連画面

#### ランディング画面 (`/`)
- **目的**: サービス紹介・新規ユーザー獲得
- **遷移元**: 直接アクセス、外部リンク
- **遷移先**:
  - `/auth/login` → ログイン画面
  - `/auth/register` → 新規登録画面
  - `/dashboard` → ダッシュボード（認証済みの場合）

#### ログイン画面 (`/auth/login`)
- **目的**: ユーザー認証
- **遷移元**: ランディング画面、認証が必要な画面からのリダイレクト
- **遷移先**:
  - `/dashboard` → ダッシュボード（認証成功時）
  - `/auth/register` → 新規登録画面
  - `/auth/forgot-password` → パスワードリセット画面
  - `元の画面` → リダイレクト元画面（認証成功時）

#### 新規登録画面 (`/auth/register`)
- **目的**: 新規ユーザー登録
- **遷移元**: ランディング画面、ログイン画面
- **遷移先**:
  - `/auth/onboarding` → 初期設定画面（登録成功時）
  - `/auth/login` → ログイン画面

#### 初期設定画面 (`/auth/onboarding`)
- **目的**: 新規ユーザーの初期設定（プロフィール、読書設定）
- **遷移元**: 新規登録画面
- **遷移先**:
  - `/dashboard` → ダッシュボード（設定完了時）

### 2.2 メイン機能画面

#### ダッシュボード (`/dashboard`)
- **目的**: ユーザーの読書状況概観・最近の活動表示
- **遷移元**: ログイン成功、各画面のナビゲーション
- **遷移先**:
  - `/books` → 本棚一覧画面
  - `/books/add` → 書籍登録画面
  - `/books/{id}` → 書籍詳細画面（現在読書中の本）
  - `/social` → ソーシャル画面
  - `/profile` → プロフィール画面

#### 本棚一覧画面 (`/books`)
- **目的**: 所持書籍一覧表示・管理
- **遷移元**: ダッシュボード、ナビゲーション
- **遷移先**:
  - `/books/{id}` → 書籍詳細画面
  - `/books/add` → 書籍登録画面
  - `/books/search` → 書籍検索画面

#### 書籍詳細画面 (`/books/{id}`)
- **目的**: 個別書籍の詳細情報・読書記録管理
- **遷移元**: 本棚一覧、ダッシュボード、検索結果
- **遷移先**:
  - `/books/{id}/edit` → 書籍編集画面
  - `/books/{id}/reading` → 読書記録入力画面
  - `/books` → 本棚一覧画面（戻る）

#### 書籍登録画面 (`/books/add`)
- **目的**: 新規書籍の登録
- **遷移元**: ダッシュボード、本棚一覧画面
- **遷移先**:
  - `/books/{id}` → 書籍詳細画面（登録成功時）
  - `/books/add/search` → Google Books検索画面
  - `/books` → 本棚一覧画面（キャンセル時）

### 2.3 読書記録関連画面

#### 読書記録入力画面 (`/books/{id}/reading`)
- **目的**: 読書進捗・感想の記録
- **遷移元**: 書籍詳細画面
- **遷移先**:
  - `/books/{id}` → 書籍詳細画面（保存時）
  - `/books/{id}/notes` → 読書メモ一覧画面

#### 読書メモ一覧画面 (`/books/{id}/notes`)
- **目的**: 書籍に関するメモ一覧表示・管理
- **遷移元**: 読書記録入力画面、書籍詳細画面
- **遷移先**:
  - `/books/{id}/notes/add` → メモ作成画面
  - `/books/{id}/notes/{noteId}` → メモ詳細・編集画面
  - `/books/{id}` → 書籍詳細画面（戻る）

### 2.4 ソーシャル機能画面

#### ソーシャル画面 (`/social`)
- **目的**: フォローユーザーの活動・読書記録の閲覧
- **遷移元**: ダッシュボード、ナビゲーション
- **遷移先**:
  - `/social/users/{userId}` → 他ユーザープロフィール画面
  - `/social/discover` → ユーザー発見画面

#### ユーザー発見画面 (`/social/discover`)
- **目的**: 新しいユーザーの発見・フォロー
- **遷移元**: ソーシャル画面
- **遷移先**:
  - `/social/users/{userId}` → 他ユーザープロフィール画面
  - `/social` → ソーシャル画面（戻る）

#### 他ユーザープロフィール画面 (`/social/users/{userId}`)
- **目的**: 他ユーザーの読書状況・プロフィール閲覧
- **遷移元**: ソーシャル画面、ユーザー発見画面、読書記録の共有
- **遷移先**:
  - `/social` → ソーシャル画面（戻る）

### 2.5 設定・管理画面

#### プロフィール画面 (`/profile`)
- **目的**: 自分のプロフィール・読書統計の確認
- **遷移元**: ダッシュボード、ナビゲーション
- **遷移先**:
  - `/profile/edit` → プロフィール編集画面
  - `/profile/settings` → アカウント設定画面
  - `/profile/export` → データエクスポート画面

#### プロフィール編集画面 (`/profile/edit`)
- **目的**: プロフィール情報の編集
- **遷移元**: プロフィール画面
- **遷移先**:
  - `/profile` → プロフィール画面（保存時）

#### アカウント設定画面 (`/profile/settings`)
- **目的**: アカウント設定・プライバシー設定
- **遷移元**: プロフィール画面
- **遷移先**:
  - `/profile` → プロフィール画面（戻る）

## 3. ナビゲーション設計

### 3.1 メインナビゲーション
```typescript
interface NavItem {
  label: string;
  href: string;
  icon: string;
  requiresAuth: boolean;
}

const mainNavigation: NavItem[] = [
  { label: 'ダッシュボード', href: '/dashboard', icon: 'Home', requiresAuth: true },
  { label: '本棚', href: '/books', icon: 'Book', requiresAuth: true },
  { label: 'ソーシャル', href: '/social', icon: 'Users', requiresAuth: true },
  { label: 'プロフィール', href: '/profile', icon: 'User', requiresAuth: true },
];
```

### 3.2 パンくずナビゲーション
- **本棚 > 書籍詳細**: `本棚 > {書籍タイトル}`
- **本棚 > 書籍詳細 > 読書記録**: `本棚 > {書籍タイトル} > 読書記録`
- **プロフィール > 編集**: `プロフィール > 編集`

### 3.3 タブナビゲーション（書籍詳細画面）
```typescript
const bookDetailTabs = [
  { label: '詳細', href: '/books/{id}' },
  { label: '読書記録', href: '/books/{id}/reading' },
  { label: 'メモ', href: '/books/{id}/notes' },
];
```

## 4. 権限制御

### 4.1 認証レベル
- **公開**: 未認証ユーザーもアクセス可能
- **認証必須**: ログインユーザーのみアクセス可能
- **所有者のみ**: データの所有者のみアクセス可能

### 4.2 画面別権限設定
```typescript
interface RoutePermission {
  path: string;
  authRequired: boolean;
  ownershipRequired: boolean;
  roles?: string[];
}

const routePermissions: RoutePermission[] = [
  { path: '/', authRequired: false, ownershipRequired: false },
  { path: '/auth/*', authRequired: false, ownershipRequired: false },
  { path: '/dashboard', authRequired: true, ownershipRequired: false },
  { path: '/books', authRequired: true, ownershipRequired: false },
  { path: '/books/:id', authRequired: true, ownershipRequired: true },
  { path: '/profile', authRequired: true, ownershipRequired: false },
  { path: '/social/users/:userId', authRequired: true, ownershipRequired: false },
];
```

## 5. レスポンシブ対応

### 5.1 モバイル専用画面遷移
- **スライド遷移**: 画面間の移動
- **モーダル表示**: 書籍登録、メモ作成
- **タブ切り替え**: 書籍詳細画面内のタブ

### 5.2 デスクトップ特有の機能
- **サイドバーナビゲーション**: 固定表示
- **マルチペイン表示**: 一覧と詳細の同時表示
- **ドラッグ&ドロップ**: 書籍の並び替え

## 6. SEO対策

### 6.1 動的メタタグ
```typescript
interface PageMeta {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
}

const generatePageMeta = (route: string, data?: any): PageMeta => {
  switch (route) {
    case '/books/:id':
      return {
        title: `${data.title} - ${data.author} | hontodana`,
        description: `${data.title}の読書記録と詳細情報`,
        ogTitle: `${data.title} - hontodana`,
        ogDescription: `${data.author}著「${data.title}」の読書記録`,
        ogImage: data.coverImageUrl,
      };
    // その他のページ...
  }
};
```

### 6.2 構造化データ
- **書籍詳細画面**: Book schema
- **読書記録**: Review schema
- **ユーザープロフィール**: Person schema

## 7. エラーページ設計

### 7.1 エラーページ種別
- **404 Not Found** (`/404`): 存在しないページ
- **403 Forbidden** (`/403`): アクセス権限なし
- **500 Internal Server Error** (`/500`): サーバーエラー

### 7.2 エラー時の遷移
```typescript
const errorRedirects = {
  unauthorized: '/auth/login',
  forbidden: '/dashboard',
  notFound: '/dashboard',
  serverError: '/dashboard',
};
```

## 8. 画面間データ受け渡し

### 8.1 URLパラメータ
- **書籍ID**: `/books/{bookId}`
- **ユーザーID**: `/social/users/{userId}`
- **検索クエリ**: `/books/search?q={query}`

### 8.2 状態管理
```typescript
// 画面間で保持する状態
interface AppState {
  currentUser: User | null;
  selectedBookshelfFilter: BookshelfFilter;
  searchHistory: string[];
  readingSession: ReadingSession | null;
}
```

### 8.3 画面遷移時のデータ保持
- **フォーム入力中のデータ**: LocalStorage
- **検索フィルター状態**: URLクエリパラメータ
- **読書セッション**: Zustand永続化ストア