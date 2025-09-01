# TASK-303: データエクスポート・インポート機能 - TDD Red Phase

## 概要

TDDのRed Phase（失敗するテストの実装）が完了しました。この段階では、まだ実装が存在しないため、すべてのテストが失敗することが期待されます。

## 実装したテストファイル

### 1. 単体テストファイル
**ファイル**: `__tests__/lib/services/export-import.test.ts`

#### テスト対象クラス・関数
- `ExportService` - データエクスポート機能
- `ImportService` - データインポート機能
- `DataConverter` - データ形式変換
- `DuplicateHandler` - 重複データ処理

#### 主要テストケース

##### ExportService
- ✅ JSON形式でのエクスポート (完全なデータ、選択的データ、日付範囲)
- ✅ CSV形式でのエクスポート (基本データ、特殊文字処理)
- ✅ 空データの処理
- ✅ エラーハンドリング (存在しないユーザー、不正な形式、データベースエラー)

##### ImportService
- ✅ JSON/CSV/Goodreads形式のインポート
- ✅ 重複データのマージ処理
- ✅ エラーハンドリング (不正ファイル、制約エラー、ロールバック)

##### DataConverter
- ✅ JSON ↔ CSV変換
- ✅ Goodreads → JSON変換

##### DuplicateHandler
- ✅ ISBN13による重複検出
- ✅ タイトル・著者による類似度判定
- ✅ 重複データのマージ戦略

### 2. 統合テストファイル
**ファイル**: `__tests__/api/export-import.test.ts`

#### テスト対象エンドポイント
- `POST /api/export` - データエクスポートAPI
- `POST /api/import` - データインポートAPI
- `GET /api/import/status/[jobId]` - インポートジョブステータス確認API

#### 主要テストケース

##### POST /api/export
- ✅ 有効なエクスポートリクエスト (JSON、CSV形式)
- ✅ 日付範囲指定
- ✅ 認証エラー (401)
- ✅ バリデーションエラー (400)
- ✅ レート制限エラー (429)

##### POST /api/import
- ✅ 有効なファイルのインポート (JSON、CSV、Goodreads)
- ✅ ファイルなしエラー (400)
- ✅ ファイルサイズ制限エラー (413)
- ✅ 不正ファイル形式エラー (400)
- ✅ 認証エラー (401)

##### GET /api/import/status/[jobId]
- ✅ 処理中、完了、失敗ジョブのステータス取得
- ✅ 存在しないジョブエラー (404)
- ✅ 認証エラー (401)

### 3. 型定義ファイル
**ファイル**: `types/export-import.ts`

#### 主要型定義
- `ExportOptions` - エクスポート設定
- `ExportData` - エクスポートデータ構造
- `ImportResult` - インポート結果
- `ImportJobStatus` - ジョブステータス
- `ImportPreview` - インポートプレビュー
- `ImportError` - エラー情報

## 現在の状態

### ❌ 失敗するテスト（期待通り）

以下のクラス・関数・エンドポイントがまだ実装されていないため、全てのテストが失敗します：

#### 実装待ちクラス・関数
```typescript
// サービスクラス
@/lib/services/export-service.ExportService
@/lib/services/import-service.ImportService
@/lib/services/import-job.ImportJobManager

// ユーティリティ
@/lib/utils/data-converter.DataConverter
@/lib/utils/duplicate-handler.DuplicateHandler

// APIエンドポイント
@/app/api/export/route.POST
@/app/api/import/route.POST
@/app/api/import/route.GET
@/app/api/import/status/[jobId]/route.GET
```

#### 期待されるエラーメッセージ
```
Cannot find module '@/lib/services/export-service'
Cannot find module '@/lib/services/import-service'
Cannot find module '@/lib/utils/data-converter'
Cannot find module '@/lib/utils/duplicate-handler'
Cannot resolve '@/app/api/export/route'
Cannot resolve '@/app/api/import/route'
```

## テスト実行結果

```bash
# テスト実行コマンド
npm test __tests__/lib/services/export-import.test.ts
npm test __tests__/api/export-import.test.ts

# 期待される結果
FAIL __tests__/lib/services/export-import.test.ts
FAIL __tests__/api/export-import.test.ts

Total: 0 passed, 65 failed
```

## カバレッジ目標

### Phase 1 (現在): Red Phase
- ❌ 行カバレッジ: 0% (実装なし)
- ❌ 分岐カバレッジ: 0% (実装なし)
- ❌ 関数カバレッジ: 0% (実装なし)

### Phase 2 (次回): Green Phase 目標
- ✅ 行カバレッジ: 70%以上
- ✅ 分岐カバレッジ: 60%以上
- ✅ 関数カバレッジ: 80%以上

### Phase 3 (最終): Refactor Phase 目標
- ✅ 行カバレッジ: 90%以上
- ✅ 分岐カバレッジ: 85%以上
- ✅ 関数カバレッジ: 95%以上

## テストデータ

### モックデータ構造
```typescript
const mockUserData = {
  userProfile: { id: 'user-1', name: 'Test User', ... },
  books: [{ id: 'book-1', title: 'Test Book 1', ... }],
  userBooks: [{ id: 'userbook-1', status: 'reading', ... }],
  readingSessions: [{ id: 'session-1', pagesRead: 20, ... }],
  wishlistItems: [{ id: 'wishlist-1', priority: 'high', ... }],
  collections: [{ id: 'collection-1', name: 'Favorites', ... }],
};
```

### テストケースパターン
1. **正常系**: 有効なデータでの成功ケース
2. **異常系**: 不正データ、存在しないリソース
3. **境界値**: 空データ、大量データ、制限値
4. **エラーハンドリング**: 各種例外状況
5. **セキュリティ**: 認証・認可、不正アクセス

## 次のステップ (Green Phase)

1. **最小実装の作成**
   - サービスクラスの骨格実装
   - APIエンドポイントの基本実装
   - 最もシンプルなテストケースを通す

2. **基本機能の実装**
   - JSON形式のエクスポート・インポート
   - 基本的なエラーハンドリング

3. **テストの段階的通過**
   - 一つずつテストを通していく
   - リファクタリングは次のフェーズで実施

## 実装方針

### 優先順位
1. **Phase 1**: JSON形式のエクスポート・インポート
2. **Phase 2**: CSV形式対応
3. **Phase 3**: Goodreads形式対応
4. **Phase 4**: 高度な機能（重複処理、バッチ処理等）

### 技術的考慮事項
- **パフォーマンス**: 大量データ処理時のメモリ効率
- **セキュリティ**: ファイルアップロード時の検証
- **エラーハンドリング**: ユーザーフレンドリーなエラーメッセージ
- **非同期処理**: インポートジョブの進捗管理

## 品質保証

### テスト戦略
- **単体テスト**: 個別機能の動作確認
- **統合テスト**: APIエンドポイントの動作確認
- **E2Eテスト**: ユーザーフローの確認（後の段階で実装）

### エラーケース
- ファイル形式エラー
- データベース制約エラー
- ネットワークエラー
- 認証・認可エラー
- リソース不足エラー

## まとめ

TDD Red Phase が完了し、包括的なテストスイートが作成されました。これらのテストは現在すべて失敗していますが、これは期待通りの動作です。

次のGreen Phaseでは、これらのテストを通すための最小実装を行い、段階的に機能を構築していきます。