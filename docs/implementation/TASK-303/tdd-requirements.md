# TASK-303: データエクスポート・インポート機能 - 要件定義書

## 概要

ユーザーの書籍データ（本棚、読書進捗、ウィッシュリスト、コレクション等）を外部ファイルにエクスポートし、他のプラットフォームやバックアップから復元できるインポート機能を実装する。

## 機能要件

### 1. データエクスポート機能

#### 1.1 エクスポート対象データ
- **本棚データ**: 書籍情報、読書ステータス、進捗、評価、レビュー、メモ、タグ
- **読書セッション**: 読書履歴、各セッションの詳細
- **ウィッシュリスト**: ウィッシュリスト内の書籍、優先度、理由
- **コレクション**: カスタムコレクション、コレクション内書籍
- **ユーザー設定**: 表示設定、読書目標等

#### 1.2 サポート形式
- **JSON**: 完全なデータ保持（メインフォーマット）
- **CSV**: 本棚データの基本情報（スプレッドシート用）
- **Goodreads形式**: Goodreadsからの移行互換性

#### 1.3 エクスポート機能
- 全データのエクスポート
- 選択的エクスポート（本棚のみ、ウィッシュリストのみ等）
- 日付範囲指定（読書セッション等）
- ファイルサイズ最適化

### 2. データインポート機能

#### 2.1 インポート対応形式
- **JSON**: 完全なデータ復元
- **CSV**: 書籍データの一括登録
- **Goodreads形式**: Goodreadsからの移行

#### 2.2 インポート処理
- データ形式の自動検出
- 重複データのマージ処理
- データ検証とエラーハンドリング
- インポート進捗の表示
- ロールバック機能

### 3. データ変換機能

#### 3.1 形式変換
- JSON ↔ CSV変換
- Goodreads形式 → JSON変換
- データ構造の正規化

#### 3.2 データマッピング
- 外部プラットフォームのフィールドマッピング
- 欠損データの補完
- データ型の変換

## 技術要件

### 1. API設計

#### エクスポートAPI
```
POST /api/export
Body: {
  format: 'json' | 'csv' | 'goodreads',
  dataTypes: ['userBooks', 'wishlist', 'collections', 'sessions', 'profile'],
  dateRange?: { from: Date, to: Date },
  options?: {
    includeImages: boolean,
    compressOutput: boolean
  }
}
Response: File download or job ID
```

#### インポートAPI
```
POST /api/import
Body: FormData with file
Response: {
  jobId: string,
  estimatedTime: number,
  previewData: ImportPreview
}

GET /api/import/status/{jobId}
Response: {
  status: 'processing' | 'completed' | 'failed',
  progress: number,
  errors?: ImportError[],
  summary?: ImportSummary
}
```

### 2. データ構造

#### エクスポートJSON形式
```typescript
interface ExportData {
  metadata: {
    version: string;
    exportDate: string;
    userId: string;
    format: 'hontodana-v1';
  };
  userProfile: UserProfileExport;
  books: BookExport[];
  userBooks: UserBookExport[];
  readingSessions: ReadingSessionExport[];
  wishlistItems: WishlistItemExport[];
  collections: CollectionExport[];
}
```

#### インポート結果
```typescript
interface ImportResult {
  success: boolean;
  summary: {
    booksAdded: number;
    booksUpdated: number;
    sessionsAdded: number;
    collectionsAdded: number;
    errors: ImportError[];
  };
  rollbackId?: string;
}
```

### 3. パフォーマンス要件
- エクスポート処理: 1000冊以内 30秒以内
- インポート処理: 500冊以内 60秒以内
- ファイルサイズ: 100MB以下推奨
- 同時処理: ユーザー当たり1ジョブまで

## ユーザー体験要件

### 1. エクスポートフロー
1. エクスポート設定画面でオプション選択
2. エクスポート実行（進捗表示）
3. ファイルダウンロード
4. エクスポート履歴の記録

### 2. インポートフロー
1. ファイル選択・アップロード
2. データプレビュー表示
3. インポート設定（重複処理等）
4. インポート実行（進捗表示）
5. 結果サマリー表示

### 3. UI/UX要件
- ドラッグ&ドロップ対応
- プレビュー機能
- エラーメッセージの分かりやすい表示
- モバイル対応
- アクセシビリティ対応

## セキュリティ要件

### 1. データ保護
- エクスポートデータの一時保存時間制限（24時間）
- ファイル暗号化オプション
- アップロード制限（ファイル形式、サイズ）
- 不正なファイルの検出

### 2. アクセス制御
- 認証済みユーザーのみアクセス可能
- ユーザー自身のデータのみ操作可能
- Rate limiting (エクスポート: 1回/時間、インポート: 3回/日)

## エラーハンドリング

### 1. エクスポートエラー
- データベース接続エラー
- ファイル生成エラー
- ディスク容量不足
- タイムアウトエラー

### 2. インポートエラー
- 不正なファイル形式
- データ形式エラー
- 重複データの競合
- データベース制約エラー
- ファイルサイズ制限超過

## 品質基準

### 1. テスト要件
- 単体テスト: 各変換ロジック
- 統合テスト: エクスポート・インポートフロー
- パフォーマンステスト: 大量データでの処理時間
- セキュリティテスト: ファイル検証

### 2. 品質指標
- データ整合性: 100%（エクスポート→インポート後のデータ一致）
- エラー処理: 全エラーケースの適切な処理
- ユーザビリティ: 直感的な操作フロー
- パフォーマンス: 規定時間内の処理完了

## 制約事項

### 1. 技術的制約
- Serverless関数の実行時間制限
- メモリ使用量制限
- ファイルアップロードサイズ制限
- 同時実行数制限

### 2. ビジネス制約
- 無料プランでの機能制限検討
- エクスポート回数制限
- データ保持期間の制限

## 成功基準

### 1. 機能面
- [ ] JSON形式での完全なデータエクスポート・インポート
- [ ] CSV形式での基本データエクスポート・インポート
- [ ] Goodreads形式からのインポート
- [ ] データの整合性保証（100%）
- [ ] エラーハンドリングの実装

### 2. 性能面
- [ ] 1000冊データのエクスポート30秒以内
- [ ] 500冊データのインポート60秒以内
- [ ] UI応答性の維持

### 3. ユーザビリティ面
- [ ] 直感的な操作フロー
- [ ] 分かりやすいエラーメッセージ
- [ ] モバイル対応
- [ ] アクセシビリティ対応

## 実装優先度

### Phase 1 (必須)
- JSON形式のエクスポート・インポート
- 基本的なエラーハンドリング
- 本棚データの処理

### Phase 2 (推奨)
- CSV形式対応
- 読書セッション・コレクション対応
- 進捗表示UI

### Phase 3 (オプション)
- Goodreads形式対応
- ファイル暗号化
- バックアップスケジューリング