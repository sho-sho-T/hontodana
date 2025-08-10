# データフロー図

## ユーザーインタラクションフロー

```mermaid
flowchart TD
    A[ユーザー] --> B[Next.js フロントエンド]
    B --> C[認証チェック]
    C -->|未認証| D[Supabase Auth]
    C -->|認証済み| E[アプリケーション機能]
    
    E --> F[書籍検索]
    E --> G[本棚管理]
    E --> H[進捗管理]
    E --> I[ウィッシュリスト]
    
    F --> J[Google Books API]
    G --> K[データベース]
    H --> K
    I --> K
    
    J --> L[検索結果表示]
    K --> M[データ表示]
    
    L --> B
    M --> B
    B --> A
```

## データ処理フロー

### 書籍検索フロー
```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant API as Next.js API
    participant G as Google Books API
    participant DB as データベース
    
    U->>F: 書籍検索リクエスト
    F->>API: /api/books/search
    API->>G: 書籍情報取得
    G-->>API: 書籍データ
    API->>DB: キャッシュ保存
    API-->>F: 検索結果
    F-->>U: 検索結果表示
```

### 書籍登録フロー
```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant SA as Server Action
    participant DB as データベース
    participant S as Supabase Storage
    
    U->>F: 書籍登録リクエスト
    F->>SA: addBookToLibrary
    SA->>DB: 書籍データ保存
    SA->>S: 書影画像保存
    SA->>DB: ユーザー書籍関連付け
    SA-->>F: 登録完了
    F-->>U: 成功メッセージ
```

### 読書進捗更新フロー
```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant SA as Server Action
    participant DB as データベース
    
    U->>F: 進捗更新
    F->>SA: updateReadingProgress
    SA->>DB: 進捗データ更新
    SA->>DB: 統計データ計算
    SA-->>F: 更新結果
    F->>F: 進捗率再計算
    F-->>U: 進捗表示更新
```

## システム内部データフロー

### 認証フロー
```mermaid
flowchart LR
    A[ログイン要求] --> B[Supabase Auth]
    B --> C{認証成功?}
    C -->|Yes| D[JWT トークン発行]
    C -->|No| E[エラー表示]
    D --> F[セッション確立]
    F --> G[ユーザーデータ取得]
    G --> H[アプリケーション画面]
```

### データ同期フロー
```mermaid
flowchart TD
    A[ユーザーアクション] --> B{データ変更?}
    B -->|Yes| C[楽観的UI更新]
    C --> D[Server Action 実行]
    D --> E[データベース更新]
    E --> F{更新成功?}
    F -->|Yes| G[UI状態確定]
    F -->|No| H[UI状態ロールバック]
    H --> I[エラー表示]
    B -->|No| J[UI状態のみ更新]
```

## 外部API統合フロー

### Google Books API統合
```mermaid
flowchart LR
    A[検索クエリ] --> B[API キー付与]
    B --> C[Google Books API]
    C --> D[レスポンス受信]
    D --> E{レート制限チェック}
    E -->|OK| F[データ正規化]
    E -->|制限超過| G[キャッシュから取得]
    F --> H[クライアント返却]
    G --> H
```

## リアルタイム更新フロー

### 統計データ更新
```mermaid
flowchart TD
    A[進捗データ変更] --> B[統計再計算トリガー]
    B --> C[データベース集計クエリ]
    C --> D[統計データ更新]
    D --> E[UIコンポーネント再レンダリング]
    E --> F[ユーザーへの反映]
```

## エラーハンドリングフロー

### API エラー処理
```mermaid
flowchart TD
    A[API リクエスト] --> B{エラー発生?}
    B -->|No| C[正常レスポンス]
    B -->|Yes| D{エラー種別}
    D -->|ネットワーク| E[再試行処理]
    D -->|認証| F[再認証フロー]
    D -->|レート制限| G[キャッシュ利用]
    D -->|サーバー| H[エラー表示]
    E --> I{再試行成功?}
    I -->|Yes| C
    I -->|No| H
```

## パフォーマンス最適化フロー

### キャッシュ戦略
```mermaid
flowchart LR
    A[データ要求] --> B{キャッシュ存在?}
    B -->|Yes| C[キャッシュ返却]
    B -->|No| D[データベース問い合わせ]
    D --> E[データ取得]
    E --> F[キャッシュ保存]
    F --> G[データ返却]
    
    C --> H{キャッシュ有効?}
    H -->|No| D
    H -->|Yes| I[ユーザーに表示]
    G --> I
```

## セキュリティフロー

### 認可チェックフロー
```mermaid
flowchart TD
    A[API リクエスト] --> B[JWT トークン確認]
    B --> C{有効なトークン?}
    C -->|No| D[401 Unauthorized]
    C -->|Yes| E[ユーザー権限確認]
    E --> F{適切な権限?}
    F -->|No| G[403 Forbidden]
    F -->|Yes| H[リクエスト処理]
    H --> I[レスポンス返却]
```

## モバイル対応フロー

### レスポンシブ表示フロー
```mermaid
flowchart LR
    A[画面サイズ検出] --> B{デバイス種別}
    B -->|モバイル| C[モバイル用レイアウト]
    B -->|タブレット| D[タブレット用レイアウト]
    B -->|デスクトップ| E[デスクトップ用レイアウト]
    
    C --> F[タッチ最適化UI]
    D --> G[中間サイズUI]
    E --> H[フルサイズUI]
    
    F --> I[ユーザー体験最適化]
    G --> I
    H --> I
```