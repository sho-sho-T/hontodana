# プロジェクト概要

## プロジェクト名
hontodana

## プロジェクトの目的
Next.jsベースのウェブアプリケーション。認証機能（Supabase）とデータベース（PostgreSQL + Prisma）を含む本棚管理アプリケーションと推測される。

## 技術スタック

### フロントエンド
- **Next.js 15.3.5** (App Router)
- **React 19.0.0** + React DOM
- **TypeScript 5**
- **Tailwind CSS 4** + PostCSS
- **shadcn/ui** (New York style) + Radix UI コンポーネント
- **Lucide React** (アイコン)
- **GSAP** (アニメーション)

### バックエンド/データベース
- **Prisma** (ORM) + PostgreSQL
- **Supabase** (認証・データベースホスティング)
- **NextAuth.js** (認証)

### 開発ツール
- **Biome** (リンター・フォーマッター)
- **tsx** (TypeScript実行)

### UI/UX
- **Geist フォント**
- **shadcn/ui** コンポーネントライブラリ
- **class-variance-authority** + **clsx** + **tailwind-merge** (スタイリング)

## アーキテクチャ
- Next.js App Router構造
- コンポーネントベースアーキテクチャ
- Prismaクライアントは `lib/generated/prisma` に生成される
- Supabaseクライアントは `lib/supabase/` に配置