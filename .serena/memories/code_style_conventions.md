# コードスタイルと規約

## リンター・フォーマッター
- **Biome 2.0.6** を使用（ESLint + Prettierの代替）
- VSCodeでBiomeがデフォルトフォーマッターとして設定済み

## TypeScript設定
- `strict: true` で厳密なTypeScriptモード
- `target: ES2017`
- パスエイリアス: `@/*` で プロジェクトルートを指定

## コンポーネント規約

### shadcn/ui設定
- スタイル: **New York**
- RSC (React Server Components) 有効
- CSS Variables 使用
- Base color: **slate**
- アイコン: **Lucide React**

### ファイル命名規約
- React コンポーネント: `kebab-case.tsx`
- ユーティリティ: `kebab-case.ts`
- API routes: `route.ts`

### スタイリング
- **Tailwind CSS 4** 使用
- `clsx` + `tailwind-merge` でクラス結合
- `class-variance-authority` でバリアント管理
- CSS Variables でテーマ対応

## データベース規約

### Prisma
- モデル名: PascalCase (`User`)
- フィールド名: camelCase (`displayName`)
- テーブル名: snake_case (`users`)
- カラム名: snake_case (`display_name`) with `@map`
- UUIDをプライマリキーとして使用
- タイムスタンプは `createdAt`, `updatedAt` で統一

## 認証
- Supabase + NextAuth.js の組み合わせ
- 環境変数で設定管理