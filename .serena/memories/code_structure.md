# コードベース構造

## ディレクトリ構造

```
hontodana/
├── app/                    # Next.js App Router
│   ├── auth/              # 認証関連ページ
│   │   ├── login/
│   │   ├── sign-up/
│   │   ├── confirm/
│   │   ├── forgot-password/
│   │   └── update-password/
│   ├── protected/         # 保護されたページ
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx          # ホームページ
│   └── globals.css       # グローバルスタイル
├── components/           # Reactコンポーネント
│   ├── ui/              # shadcn/ui コンポーネント
│   └── [各種フォーム]    # 認証関連フォーム
├── lib/                 # ユーティリティとライブラリ
│   ├── generated/       # Prismaクライアント生成先
│   ├── supabase/        # Supabaseクライアント設定
│   └── utils.ts         # ユーティリティ関数
├── prisma/              # Prismaスキーマ
├── supabase/            # Supabaseローカル開発設定
└── public/              # 静的ファイル
```

## 重要なファイル

- `prisma/schema.prisma`: データベーススキーマ定義
- `lib/utils.ts`: cn() 関数（Tailwind CSS クラスマージ）
- `components.json`: shadcn/ui設定
- `tsconfig.json`: TypeScript設定（パスエイリアス @/* 設定済み）

## データベースモデル
現在定義されているモデル:
- `User`: ユーザー情報（id, email, username, displayName, bio, timestamps）