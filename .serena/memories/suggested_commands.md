# 推奨コマンド一覧

## 開発サーバー
```bash
npm run dev          # Next.js開発サーバー（Turbopack使用）
```

## ビルド・デプロイ
```bash
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
```

## コード品質
```bash
npm run lint         # Next.jsリンター実行
npx biome check      # Biomeによるリント・フォーマットチェック
npx biome check --fix # Biomeによる自動修正
```

## データベース管理

### マイグレーション
```bash
npm run db:migrate         # 開発環境マイグレーション実行
npm run db:migrate:init    # 初期マイグレーション作成
npm run db:migrate:reset   # マイグレーションリセット
npm run db:migrate:deploy  # 本番環境マイグレーション
npm run db:migrate:status  # マイグレーション状態確認
```

### Prisma操作
```bash
npm run db:generate  # Prismaクライアント生成
npm run db:studio    # Prisma Studio起動
npm run db:push      # スキーマをDBにプッシュ
npm run db:pull      # DBからスキーマを取得
npm run db:seed      # シードデータ実行
```

### データベースリセット・セットアップ
```bash
npm run db:reset     # 完全リセット + シード実行
npm run db:setup     # 初期セットアップ（マイグレーション + 生成 + シード）
```

## Supabase（ローカル開発）
```bash
npx supabase start   # ローカルSupabase起動
npx supabase stop    # ローカルSupabase停止
npx supabase status  # Supabase状態確認
```

## システム固有コマンド（macOS）
```bash
ls -la              # ファイル一覧（隠しファイル含む）
find . -name "*.ts" # TypeScriptファイル検索
grep -r "pattern"   # パターン検索
```