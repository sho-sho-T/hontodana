# 開発環境セットアップ

## 1. 必要な環境

### 1.1 システム要件
- **Node.js**: v18.17.0 以上
- **npm**: v9.0.0 以上 (または yarn v1.22.0 以上、pnpm v8.0.0 以上)
- **Git**: v2.30.0 以上
- **VS Code**: 推奨エディタ（拡張機能含む）

### 1.2 アカウント準備
- **GitHub**: ソースコード管理
- **Supabase**: バックエンドサービス
- **Vercel**: デプロイ・ホスティング
- **Google Cloud Console**: Google Books API

## 2. プロジェクトセットアップ

### 2.1 リポジトリクローン
```bash
# リポジトリをクローン
git clone https://github.com/[username]/hontodana.git
cd hontodana

# ブランチ確認
git branch -a
git checkout main
```

### 2.2 依存関係インストール
```bash
# Node.js バージョン確認
node --version  # v18.17.0 以上

# 依存関係インストール
npm install

# 開発用依存関係の確認
npm list --depth=0
```

### 2.3 環境変数設定
```bash
# 環境変数ファイルをコピー
cp .env.example .env.local

# 必要な環境変数を設定
# .env.local ファイルを編集
```

#### 環境変数一覧
```bash
# .env.local
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Books API
GOOGLE_BOOKS_API_KEY=your-google-books-api-key

# 認証
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# ログ・監視
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
SENTRY_DSN=your-sentry-dsn

# 開発環境
NODE_ENV=development
```

## 3. Supabase セットアップ

### 3.1 Supabase プロジェクト作成
```bash
# Supabase CLI インストール
npm install -g supabase

# Supabase にログイン
supabase login

# プロジェクト初期化
supabase init

# ローカル開発環境起動
supabase start
```

### 3.2 データベースセットアップ
```bash
# マイグレーション実行
supabase db reset

# シードデータ投入
supabase seed
```

#### 初期マイグレーション
```sql
-- supabase/migrations/001_initial_schema.sql
-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  profile_image_url TEXT,
  bio TEXT,
  reading_preferences JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{"profile_public": true, "reading_records_public": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ポリシー設定
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### 3.3 認証設定
```bash
# Supabase Auth設定確認
supabase settings

# プロバイダー設定（Google OAuth）
# Supabase Dashboard > Authentication > Providers
```

## 4. Google Books API セットアップ

### 4.1 API キー取得
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. Books API を有効化
4. 認証情報 > APIキー を作成
5. APIキーの制限を設定

### 4.2 API テスト
```bash
# API接続テスト
curl "https://www.googleapis.com/books/v1/volumes?q=typescript&key=YOUR_API_KEY"
```

## 5. 開発ツール設定

### 5.1 VS Code 拡張機能
```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-eslint"
  ]
}
```

### 5.2 VS Code 設定
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### 5.3 Git フック設定
```bash
# Husky インストール済みの場合
npm run prepare

# pre-commit フック確認
cat .husky/pre-commit
```

#### pre-commit 設定
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# リント実行
npm run lint

# 型チェック実行
npm run type-check

# テスト実行（変更されたファイルのみ）
npm run test:changed
```

## 6. 開発サーバー起動

### 6.1 基本起動
```bash
# 開発サーバー起動
npm run dev

# ブラウザで確認
# http://localhost:3000
```

### 6.2 並行開発環境
```bash
# Supabase ローカル環境（別ターミナル）
supabase start

# Storybookサーバー（別ターミナル）
npm run storybook

# テスト監視モード（別ターミナル）
npm run test:watch
```

### 6.3 環境確認
```bash
# 環境変数確認
npm run env:check

# データベース接続確認
npm run db:check

# API接続確認
npm run api:check
```

## 7. 初期データセットアップ

### 7.1 シードデータ
```sql
-- supabase/seed.sql
-- テストユーザー作成
INSERT INTO users (id, email, username, display_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'testuser', 'テストユーザー');

-- サンプル書籍データ
INSERT INTO books (user_id, title, author, book_type, page_count) VALUES
  ('00000000-0000-0000-0000-000000000001', 'TypeScript入門', '山田太郎', 'PHYSICAL', 300),
  ('00000000-0000-0000-0000-000000000001', 'React実践ガイド', '田中花子', 'DIGITAL', 250);

-- サンプル読書記録
INSERT INTO reading_records (book_id, user_id, status, current_page, rating) VALUES
  ((SELECT id FROM books WHERE title = 'TypeScript入門'), '00000000-0000-0000-0000-000000000001', 'READING', 150, NULL),
  ((SELECT id FROM books WHERE title = 'React実践ガイド'), '00000000-0000-0000-0000-000000000001', 'COMPLETED', 250, 5);
```

### 7.2 開発データ生成
```bash
# 開発用データ生成スクリプト実行
npm run seed:dev

# 大量データ生成（パフォーマンステスト用）
npm run seed:large
```

## 8. デバッグ設定

### 8.1 Next.js デバッグ
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side",
      "type": "pwa-chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### 8.2 デバッグ実行
```bash
# サーバーサイドデバッグ
NODE_OPTIONS='--inspect' npm run dev

# クライアントサイドデバッグ
# VS Codeのデバッガーを使用
```

## 9. テスト環境セットアップ

### 9.1 テストデータベース
```bash
# テスト用Supabaseインスタンス起動
supabase start --db-port 54322

# テスト環境変数設定
cp .env.test.example .env.test
```

### 9.2 テスト実行
```bash
# 全テスト実行
npm run test

# 単体テスト
npm run test:unit

# 統合テスト
npm run test:integration

# E2Eテスト
npm run test:e2e

# カバレッジ確認
npm run test:coverage
```

## 10. パフォーマンス監視設定

### 10.1 Vercel Analytics
```bash
# Vercel Analytics パッケージインストール済み
# .env.local でIDを設定
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### 10.2 Lighthouse CI
```bash
# Lighthouse CI 実行
npm run lighthouse

# パフォーマンス監視
npm run perf:analyze
```

## 11. ドキュメント生成

### 11.1 型定義ドキュメント
```bash
# TypeDoc実行
npm run docs:generate

# ドキュメント確認
open docs/index.html
```

### 11.2 Storybook
```bash
# Storybook起動
npm run storybook

# Storybook ビルド
npm run build-storybook
```

## 12. トラブルシューティング

### 12.1 よくある問題

#### Node.js バージョン不一致
```bash
# nvmを使用してNode.jsバージョン管理
nvm install 18.17.0
nvm use 18.17.0
```

#### Supabase接続エラー
```bash
# Supabase状態確認
supabase status

# Supabase再起動
supabase stop
supabase start
```

#### 環境変数読み込みエラー
```bash
# 環境変数確認
echo $NEXT_PUBLIC_SUPABASE_URL

# Next.js再起動
npm run dev
```

### 12.2 ログ確認
```bash
# アプリケーションログ
tail -f logs/app.log

# Supabaseログ
supabase logs

# ビルドログ
npm run build 2>&1 | tee build.log
```

## 13. 開発ワークフロー

### 13.1 機能開発フロー
```bash
# 1. 新しいブランチ作成
git checkout -b feature/book-management

# 2. 開発・テスト
npm run dev
npm run test:watch

# 3. コミット前チェック
npm run lint
npm run type-check
npm run test

# 4. コミット
git add .
git commit -m "feat: add book management functionality"

# 5. プッシュ
git push origin feature/book-management
```

### 13.2 プルリクエスト作成
```bash
# GitHub CLI使用
gh pr create --title "書籍管理機能を追加" --body "書籍の登録・編集・削除機能を実装"

# 自動チェック確認
# - CI/CDパイプライン
# - コードレビュー
# - テスト結果
```

## 14. プロダクション準備

### 14.1 ビルド確認
```bash
# プロダクションビルド
npm run build

# ビルド結果確認
npm run start

# バンドルサイズ分析
npm run analyze
```

### 14.2 環境変数設定（本番）
```bash
# Vercel環境変数設定
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GOOGLE_BOOKS_API_KEY
```

これで開発環境のセットアップが完了です。問題が発生した場合は、トラブルシューティングセクションを参考にしてください。