# アーキテクチャ設計書

## 1. システム全体アーキテクチャ

### 1.1 設計思想
「hontodana」は**Clean Architecture + DDD（ドメイン駆動設計）**をベースとした設計を採用します。

### 1.2 アーキテクチャ選択理由
- **保守性**: ビジネスロジックとフレームワークの分離により、長期的な保守が可能
- **テスタビリティ**: 依存関係の逆転により、単体テストが容易
- **拡張性**: 新機能追加時の影響範囲を最小化
- **可読性**: ドメインモデルによる業務ルールの明確化

## 2. レイヤー構成

### 2.1 ディレクトリ構成
```
/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証関連ページ
│   ├── dashboard/                # ダッシュボード
│   ├── books/                    # 書籍管理ページ
│   └── layout.tsx                # 共通レイアウト
├── components/                   # UIコンポーネント
│   ├── ui/                       # 基本UIコンポーネント（shadcn/ui）
│   ├── features/                 # 機能別コンポーネント
│   └── layouts/                  # レイアウトコンポーネント
├── lib/                          # アプリケーション層
│   ├── supabase/                 # Supabase設定・クライアント
│   ├── utils/                    # ユーティリティ関数
│   └── validations/              # バリデーションスキーマ
├── domain/                       # ドメイン層
│   ├── entities/                 # エンティティ
│   ├── repositories/             # リポジトリインターフェース
│   └── services/                 # ドメインサービス
└── infrastructure/               # インフラストラクチャ層
    ├── repositories/             # リポジトリ実装
    ├── external-apis/            # 外部API（Google Books API）
    └── database/                 # データベース操作
```

### 2.2 各レイヤーの責務

#### Presentation Layer（app/、components/）
- **責務**: ユーザーインターフェースの表示・ユーザー操作の受付
- **制約**: ビジネスロジックを含まない、UIコンポーネントは再利用可能に設計
- **依存関係**: Application Layer、Domain Layerを参照可能

#### Application Layer（lib/）
- **責務**: ユースケースの調整・外部依存関係の管理
- **制約**: ビジネスルールを含まない、ドメインオブジェクトの組み合わせのみ
- **依存関係**: Domain Layerのみ参照、Infrastructure Layerは依存性注入で利用

#### Domain Layer（domain/）
- **責務**: ビジネスルール・エンティティ・ドメインサービスの定義
- **制約**: 外部依存なし、Pure TypeScriptのみ
- **依存関係**: 他レイヤーに依存しない

#### Infrastructure Layer（infrastructure/）
- **責務**: 外部サービス・データベース・APIとの連携
- **制約**: 技術的な実装のみ、ビジネスロジックを含まない
- **依存関係**: Domain Layerのインターフェースを実装

## 3. ドメインモデル設計

### 3.1 主要エンティティ

#### Book（書籍）
```typescript
interface Book {
  id: BookId;
  isbn?: ISBN;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: Date;
  pageCount?: number;
  bookType: BookType; // PHYSICAL | DIGITAL
  coverImageUrl?: string;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### ReadingRecord（読書記録）
```typescript
interface ReadingRecord {
  id: ReadingRecordId;
  bookId: BookId;
  userId: UserId;
  status: ReadingStatus; // NOT_STARTED | READING | COMPLETED | PAUSED | REREADING
  currentPage?: number;
  startDate?: Date;
  completedDate?: Date;
  rating?: Rating; // 1-5
  review?: string;
  readingTime: ReadingTime; // セッション別読書時間の集約
  notes: ReadingNote[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### User（ユーザー）
```typescript
interface User {
  id: UserId;
  email: string;
  username: string;
  profileImageUrl?: string;
  bio?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 値オブジェクト

#### Progress（進捗率）
```typescript
class Progress {
  constructor(
    private readonly currentPage: number,
    private readonly totalPages: number
  ) {
    if (currentPage < 0 || currentPage > totalPages) {
      throw new Error('Invalid progress values');
    }
  }
  
  get percentage(): number {
    return Math.round((this.currentPage / this.totalPages) * 100);
  }
}
```

## 4. データフロー設計

### 4.1 書籍登録フロー
```
UI → useBookRegistration → BookApplicationService → BookRepository → Supabase
  ↳ GoogleBooksService → Google Books API
```

### 4.2 読書記録更新フロー
```
UI → useReadingRecord → ReadingRecordApplicationService → ReadingRecordRepository → Supabase
```

### 4.3 本棚表示フロー
```
UI → useBookshelf → BookApplicationService → BookRepository → Supabase
```

## 5. 状態管理戦略

### 5.1 クライアント状態管理
- **React Hook**: ローカル状態管理（フォーム状態、UI状態）
- **Zustand**: グローバル状態管理（ユーザー情報、アプリケーション設定）
- **React Query**: サーバー状態管理（書籍データ、読書記録）

### 5.2 サーバー状態管理
- **Supabase Realtime**: リアルタイム同期（読書記録の更新）
- **React Query**: キャッシュ戦略・データフェッチング
- **Optimistic Updates**: ユーザー体験向上のための楽観的更新

## 6. エラーハンドリング戦略

### 6.1 エラーの分類
- **ValidationError**: 入力値検証エラー
- **AuthenticationError**: 認証エラー
- **AuthorizationError**: 認可エラー
- **NotFoundError**: リソース未存在エラー
- **ExternalApiError**: 外部API連携エラー
- **SystemError**: システム内部エラー

### 6.2 エラーハンドリング方針
- **ドメイン層**: カスタムエラークラスで業務例外を表現
- **アプリケーション層**: エラーの変換・ログ出力
- **プレゼンテーション層**: ユーザーフレンドリーなエラーメッセージ表示

## 7. セキュリティ設計

### 7.1 認証・認可
- **Supabase Auth**: JWT トークンベース認証
- **RLS（Row Level Security）**: データベースレベルでのアクセス制御
- **RBAC**: ロールベースアクセス制御（Admin/User）

### 7.2 データ保護
- **入力値検証**: Zodを使用したスキーマ検証
- **XSS対策**: React の自動エスケープ + Content Security Policy
- **CSRF対策**: SameSite Cookie + CSRF Token

## 8. パフォーマンス戦略

### 8.1 フロントエンド最適化
- **Next.js最適化**: App Router + RSC（React Server Components）
- **画像最適化**: next/image + 遅延読み込み
- **バンドル最適化**: 動的インポート + Code Splitting

### 8.2 データベース最適化
- **インデックス設計**: 検索・フィルタリング用インデックス
- **クエリ最適化**: N+1問題の回避
- **キャッシュ戦略**: Redis または Supabase Cache の活用

## 9. テスト戦略

### 9.1 テストピラミッド
- **Unit Tests**: ドメインロジック・ユーティリティ関数
- **Integration Tests**: リポジトリ・外部API連携
- **E2E Tests**: 主要ユーザーフロー

### 9.2 テスト実装方針
- **ドメイン層**: 100% カバレッジ目標
- **アプリケーション層**: 主要ユースケースをカバー
- **プレゼンテーション層**: コンポーネントの振る舞いテスト