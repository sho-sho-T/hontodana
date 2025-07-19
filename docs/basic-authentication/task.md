# 認証機能実装タスク

## 概要

Next.js 15 + Supabase Auth + Prismaを使用してメール認証とGoogle認証の2つの認証方式をサポートする認証システムを実装する。

## 実装方針

### 1. 段階的実装アプローチ
1. **環境設定とSupabase設定**
2. **認証コンテキストとフック実装**
3. **認証画面UI実装**
4. **認証ミドルウェア実装**
5. **ダッシュボード画面実装**
6. **テストとリファクタリング**

### 2. 技術スタック確認
- **フロントエンド**: Next.js 15 (App Router) ✅
- **認証**: Supabase Auth
- **データベース**: PostgreSQL (Supabase)
- **ORM**: Prisma ✅
- **UI**: Tailwind CSS + shadcn/ui ✅
- **アイコン**: Lucide React ✅

## 実装タスク

### フェーズ1: 環境設定とSupabase設定

#### 1.1 環境変数設定
- [x] `.env.local`ファイル作成
- [x] Supabase URL/ANON KEY設定
- [x] Google認証用環境変数設定

#### 1.2 Supabaseクライアント設定
- [ ] `lib/supabase.ts`作成
- [ ] Supabaseクライアント初期化
- [ ] 型定義設定

#### 1.3 Supabase Authプロバイダー設定
- [ ] Supabaseダッシュボードでプロバイダー設定
- [ ] Google OAuth設定
- [ ] 認証設定確認

### フェーズ2: 認証コンテキストとフック実装

#### 2.1 認証コンテキスト
- [ ] `context/AuthContext.tsx`作成
- [ ] ユーザー状態管理
- [ ] 認証状態の永続化

#### 2.2 認証フック
- [ ] `hooks/useAuth.ts`作成
- [ ] メール認証機能実装
- [ ] Google認証機能実装
- [ ] ログアウト機能実装
- [ ] エラーハンドリング実装

#### 2.3 認証プロバイダー
- [ ] `app/layout.tsx`にプロバイダー追加
- [ ] グローバル認証状態管理

### フェーズ3: 認証画面UI実装

#### 3.1 共通コンポーネント
- [x] `components/ui/Button.tsx`確認/調整
- [x] `components/ui/Input.tsx`確認/調整
- [x] `components/ui/Card.tsx`確認/調整

#### 3.2 認証フォームコンポーネント
- [ ] `components/auth/LoginForm.tsx`作成
- [ ] `components/auth/SignUpForm.tsx`作成
- [ ] `components/auth/GoogleAuthButton.tsx`作成

#### 3.3 認証画面
- [ ] `app/auth/page.tsx`作成
- [ ] タブ切り替え機能
- [ ] レスポンシブデザイン
- [ ] エラー表示機能

### フェーズ4: 認証ミドルウェア実装

#### 4.1 ミドルウェア
- [ ] `middleware.ts`作成
- [ ] 保護されたルートの定義
- [ ] 認証状態チェック
- [ ] リダイレクト処理

#### 4.2 ルート保護
- [ ] 未認証ユーザーのリダイレクト
- [ ] 認証済みユーザーの処理
- [ ] 条件付きレンダリング

### フェーズ5: ダッシュボード画面実装

#### 5.1 ダッシュボードコンポーネント
- [ ] `components/dashboard/UserProfile.tsx`作成
- [ ] `components/dashboard/LogoutButton.tsx`作成
- [ ] ユーザー情報表示

#### 5.2 ダッシュボード画面
- [ ] `app/dashboard/page.tsx`作成
- [ ] レイアウト調整
- [ ] ナビゲーション実装

### フェーズ6: テストとリファクタリング

#### 6.1 機能テスト
- [ ] メール認証フローテスト
- [ ] Google認証フローテスト
- [ ] ログアウト機能テスト
- [ ] ルート保護テスト

#### 6.2 エラーハンドリングテスト
- [ ] 無効な認証情報テスト
- [ ] ネットワークエラーテスト
- [ ] バリデーションテスト

#### 6.3 UIテスト
- [ ] レスポンシブデザイン確認
- [ ] アクセシビリティ確認
- [ ] ユーザビリティテスト

## 実装詳細

### ディレクトリ構成
```
app/
├── auth/
│   └── page.tsx
├── dashboard/
│   └── page.tsx
├── layout.tsx
└── page.tsx

components/
├── auth/
│   ├── LoginForm.tsx
│   ├── SignUpForm.tsx
│   └── GoogleAuthButton.tsx
├── dashboard/
│   ├── UserProfile.tsx
│   └── LogoutButton.tsx
└── ui/
    ├── Button.tsx
    ├── Input.tsx
    └── Card.tsx

context/
└── AuthContext.tsx

hooks/
└── useAuth.ts

lib/
├── supabase.ts
└── utils.ts

middleware.ts
```

### 主要な実装ポイント

#### 認証フロー
1. **メール認証**: Supabase Auth + メール/パスワード
2. **Google認証**: Supabase Auth + Google OAuth
3. **セッション管理**: JWTトークン + ローカルストレージ
4. **自動リフレッシュ**: Supabaseの自動トークンリフレッシュ

#### セキュリティ考慮事項
- CSRFトークン保護（Next.js標準）
- XSS対策（入力値サニタイゼーション）
- HTTPS必須（本番環境）
- 適切なCORS設定

#### エラーハンドリング
- 認証エラーの適切な表示
- ネットワークエラーの処理
- バリデーションエラーの表示
- ユーザーフレンドリーなメッセージ

## 完了条件

### 機能要件
- [ ] メール認証でのログイン/ログアウト
- [ ] Google認証でのログイン/ログアウト
- [ ] 認証状態の永続化
- [ ] 保護されたルートへのアクセス制御
- [ ] ユーザー情報の表示

### 非機能要件
- [ ] レスポンシブデザイン
- [ ] アクセシビリティ対応
- [ ] 適切なエラーハンドリング
- [ ] セキュリティ対策
- [ ] パフォーマンス最適化

### テスト要件
- [ ] 全認証フローの動作確認
- [ ] エラーケースの動作確認
- [ ] UI/UXの確認
- [ ] セキュリティテスト

## 注意事項

1. **Supabase設定**: プロジェクト作成とGoogle OAuth設定が必要
2. **環境変数**: 本番/開発環境での適切な設定
3. **型安全性**: TypeScriptを活用した型定義
4. **エラーハンドリング**: ユーザーフレンドリーなエラーメッセージ
5. **セキュリティ**: 認証トークンの適切な管理