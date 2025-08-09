# 開発ガイドライン

## 設計パターンとアーキテクチャ

### コンポーネント設計
- **Server Components** をデフォルトで使用
- **Client Components** は必要な場合のみ `"use client"` で明示
- shadcn/ui コンポーネントを基盤とした一貫したUI

### ファイル構造規則
- `app/`: ページとルーティング（App Router）
- `components/`: 再利用可能コンポーネント
- `components/ui/`: shadcn/uiベースコンポーネント
- `lib/`: ユーティリティと共通ロジック

### データベース設計原則
- **UUIDをプライマリキー**として使用
- **snake_case** でテーブル・カラム名
- **camelCase** でPrismaモデルフィールド名
- `@map` でPrismaとDB間のマッピング

## 認証・セキュリティ

### Supabase認証フロー
- Row Level Security (RLS) 活用
- NextAuth.jとの連携でセッション管理
- 環境変数での設定管理

### セキュリティベストプラクティス
- 環境変数は `.env.local` で管理
- APIキーは必ず環境変数から取得
- クライアントサイドでの機密情報露出を避ける

## パフォーマンス考慮事項

### Next.js最適化
- **Turbopack** を開発時に使用
- 静的生成 (SSG) を可能な限り活用
- 画像最適化 (`next/image`) を使用

### データベース最適化
- Prisma Accelerate 設定済み
- 適切なインデックス設定
- N+1クエリ問題を避ける

## UI/UXガイドライン

### デザインシステム
- **shadcn/ui New York style** 統一
- **Slate** カラーパレット使用
- **Lucide React** アイコン統一
- **Geist フォント** 使用

### レスポンシブデザイン
- Tailwind CSS レスポンシブクラス活用
- モバイルファースト設計

## エラーハンドリング

### クライアントサイド
- React Error Boundaries 使用
- ユーザーフレンドリーなエラーメッセージ

### サーバーサイド
- Zod でバリデーション
- 適切なHTTPステータスコード返却