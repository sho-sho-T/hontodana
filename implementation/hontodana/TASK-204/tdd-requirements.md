# TASK-204: 評価・レビュー機能 - 要件定義

## 概要

ユーザーが読み終わった書籍や読書中の書籍に対して星評価（1-5段階）とテキストレビューを付与・管理できる機能を実装します。
既存のUserBookモデルの `rating` と `review` フィールドを活用し、直感的なUI/UXで評価・レビュー管理を行えるようにします。

## 機能要件

### FR-204-01: 星評価機能
- **要件**: ユーザーが書籍に1-5星の評価を付与できること
- **詳細**:
  - 1星（最低）～5星（最高）の5段階評価
  - クリック/タッチで評価を設定
  - ホバー時のプレビュー表示
  - 評価クリア機能（null値への設定）
- **UI/UX**:
  - 星アイコンの視覚的フィードバック
  - 半星表示は行わない（整数値のみ）
  - アクセシブルな操作（キーボード対応）
- **制約**:
  - 1-5の整数値のみ許可
  - null値で「未評価」状態を表現

### FR-204-02: テキストレビュー機能
- **要件**: ユーザーが書籍に対してテキストレビューを記述できること
- **詳細**:
  - 自由形式のテキスト入力
  - マークダウン記法対応（オプション）
  - 最大文字数制限（2000文字）
  - 改行・段落の保持
- **UI/UX**:
  - 複数行テキストエリア
  - 文字数カウンター表示
  - リアルタイムプレビュー（マークダウン対応時）
- **制約**:
  - 最大2000文字
  - HTMLタグの除去・エスケープ

### FR-204-03: 評価・レビュー表示機能
- **要件**: 書籍の評価・レビューを適切に表示できること
- **詳細**:
  - BookCardでの星評価表示
  - 詳細ページでのレビュー全文表示
  - 評価日時の表示
  - 編集・削除アクション
- **UI/UX**:
  - 星評価の視覚的表現
  - レビューテキストの読みやすい表示
  - 長文レビューの省略・展開機能
- **表示優先度**:
  - 星評価は常に表示
  - レビューは存在する場合のみ表示

### FR-204-04: 評価・レビュー編集機能
- **要件**: 既存の評価・レビューを編集・削除できること
- **詳細**:
  - インライン編集モード
  - 編集内容の即座保存
  - 削除確認ダイアログ
  - 編集履歴の記録（updatedAt）
- **UI/UX**:
  - 編集アイコンによる編集モード切り替え
  - キャンセル・保存ボタン
  - 編集中の視覚的フィードバック
- **制約**:
  - 本人のレビューのみ編集可能
  - 編集時のバリデーション適用

### FR-204-05: 評価統計機能
- **要件**: ユーザーの評価統計を表示できること
- **詳細**:
  - 平均評価の計算・表示
  - 評価分布の表示（1星〜5星の件数）
  - 評価済み書籍数の表示
  - 最高・最低評価書籍の表示
- **UI/UX**:
  - ダッシュボードでの統計表示
  - 評価分布のチャート表示
  - フィルタリング機能（期間別等）
- **計算ロジック**:
  - 平均値は小数点第1位まで表示
  - null値は統計から除外

## 非機能要件

### NFR-204-01: パフォーマンス
- 評価保存: 1秒以内
- レビュー表示: 2秒以内
- 統計計算: 3秒以内

### NFR-204-02: ユーザビリティ
- 直感的な星評価操作
- スムーズな編集体験
- 明確な保存状態表示

### NFR-204-03: アクセシビリティ
- スクリーンリーダー対応
- キーボード操作対応
- 適切なARIA属性設定
- 色覚多様性への配慮

### NFR-204-04: レスポンシブデザイン
- モバイル端末での星評価操作
- タブレット・デスクトップ対応
- タッチデバイス最適化

## データモデル

### UserBook テーブル（既存利用）
```sql
- rating: Int? (1-5の星評価、null=未評価)
- review: String? (レビューテキスト、null=未記入)
- updatedAt: DateTime (レビュー更新日時)
```

### 評価値の制約
- rating: 1, 2, 3, 4, 5, null のいずれか
- review: 最大2000文字、null許可

## API エンドポイント

### Server Actions
1. `updateBookRating(userBookId: string, rating: number | null)` - 星評価更新
2. `updateBookReview(userBookId: string, review: string | null)` - レビュー更新
3. `updateBookRatingAndReview(userBookId: string, rating: number | null, review: string | null)` - 評価・レビュー同時更新
4. `getUserRatingStats(userId: string)` - ユーザー評価統計取得
5. `getBooksWithRatings(userId: string, filters?: RatingFilters)` - 評価付き書籍一覧取得

## UI コンポーネント構成

### 新規作成コンポーネント
1. **StarRating** - 星評価表示・入力コンポーネント
2. **ReviewEditor** - レビュー編集コンポーネント
3. **ReviewDisplay** - レビュー表示コンポーネント
4. **RatingStatsCard** - 評価統計表示カード
5. **RatingDistributionChart** - 評価分布チャート
6. **BookRatingDialog** - 評価・レビュー編集ダイアログ

### 既存コンポーネント拡張
1. **BookCard** - 星評価表示追加
2. **BookList** - 評価フィルタリング機能追加
3. **ReadingDashboard** - 評価統計セクション追加

## バリデーション要件

### クライアントサイド
```typescript
const ratingSchema = z.number().int().min(1).max(5).nullable();
const reviewSchema = z.string().max(2000).nullable();
```

### サーバーサイド
```typescript
const updateRatingSchema = z.object({
  userBookId: z.string().uuid(),
  rating: z.number().int().min(1).max(5).nullable(),
});

const updateReviewSchema = z.object({
  userBookId: z.string().uuid(),
  review: z.string().max(2000).trim().nullable(),
});
```

## エラーハンドリング

### クライアントサイド
1. **バリデーションエラー**
   - 評価値の範囲外
   - レビュー文字数超過
   - 必須フィールド不足

2. **操作エラー**
   - 保存失敗
   - ネットワークエラー
   - 権限エラー

### サーバーサイド
1. **データベースエラー**
   - 更新失敗
   - 接続エラー
   - 制約違反

2. **ビジネスロジックエラー**
   - 存在しない書籍
   - 権限不足
   - 不正なデータ

## テスト要件

### 単体テスト
- 評価・レビュー更新関数
- バリデーション関数
- 統計計算関数
- データ変換関数

### コンポーネントテスト
- StarRatingの操作・表示
- ReviewEditorの入力・保存
- 評価統計の表示
- エラーハンドリング

### 統合テスト
- Server Actionsの動作
- データベース操作
- 評価統計の計算精度

### E2Eテスト
- 評価・レビューの投稿から表示まで
- 編集・削除操作
- モバイル端末での操作

## UI/UX設計

### 星評価コンポーネント
```typescript
interface StarRatingProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showClearButton?: boolean;
}
```

### レビューエディタ
```typescript
interface ReviewEditorProps {
  value: string | null;
  onChange: (review: string | null) => void;
  maxLength?: number;
  placeholder?: string;
  autoSave?: boolean;
}
```

### 評価統計表示
```typescript
interface RatingStatsProps {
  stats: {
    averageRating: number | null;
    totalRated: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  };
  showDistribution?: boolean;
}
```

## セキュリティ要件

### 認証・認可
- ユーザー認証確認
- 本人の書籍のみ評価・レビュー可能
- 適切なCSRF対策

### データ保護
- レビューテキストのサニタイゼーション
- XSS攻撃対策
- SQLインジェクション対策（Prisma使用）

## パフォーマンス最適化

### データベース最適化
- rating、review フィールドのインデックス（必要に応じて）
- 統計クエリの最適化
- N+1問題の回避

### フロントエンド最適化
- 星評価コンポーネントの軽量化
- レビューテキストの遅延ロード
- 統計データのキャッシュ

## 実装優先順位

### Phase 1: 基本機能
1. StarRating コンポーネント実装
2. 評価更新 Server Actions
3. BookCard への星評価表示追加

### Phase 2: レビュー機能
1. ReviewEditor コンポーネント実装
2. レビュー更新 Server Actions
3. レビュー表示機能

### Phase 3: 統計・高度な機能
1. 評価統計の計算・表示
2. 評価分布チャート
3. フィルタリング機能

### Phase 4: UI/UX改善
1. アクセシビリティ対応
2. レスポンシブデザイン調整
3. アニメーション・マイクロインタラクション

## 受け入れ基準

### 機能的基準
- [ ] ユーザーが書籍に1-5星の評価を付与・変更できる
- [ ] レビューテキストを記入・編集・削除できる
- [ ] BookCardで星評価が正しく表示される
- [ ] 評価統計が正確に計算・表示される
- [ ] 編集権限が適切に制御されている

### 品質基準
- [ ] 全てのテストケースが通る
- [ ] TypeScriptエラーがない
- [ ] アクセシビリティ要件を満たす
- [ ] レスポンシブデザインが正しく動作する
- [ ] パフォーマンス要件を満たす

### UX基準
- [ ] 星評価の操作が直感的である
- [ ] レビュー編集がスムーズに行える
- [ ] 適切なフィードバックが提供される
- [ ] エラー時のメッセージが分かりやすい
- [ ] モバイル端末での操作性が良好である