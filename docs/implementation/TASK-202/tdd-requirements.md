# 読書統計・ダッシュボード TDD 要件定義

## 1. タスク概要

**タスクID**: TASK-202  
**タスク名**: 読書統計・ダッシュボード  
**依存関係**: TASK-104 (読書進捗管理システム) 完了済み  
**実装期間**: 2-3スプリント想定

## 2. 機能要件

### 2.1 統計データ計算ロジック

#### 2.1.1 基本統計
- **読書セッション統計**
  - 総読書時間（分単位）
  - 読書セッション数
  - 平均セッション時間
  - 連続読書日数（ストリーク）

- **書籍統計**
  - 総読破冊数（status: 'completed'）
  - 読書中冊数（status: 'reading'）
  - 積読冊数（status: 'want_to_read'）
  - 書籍タイプ別分布（physical, kindle, epub, audiobook, other）

- **読書進捗統計**
  - 総ページ読了数
  - 平均読書速度（ページ/分）
  - 読書完了率（開始した書籍の完了率）

#### 2.1.2 期間別統計
- **日別統計** (`DailyStats`)
  - 日付
  - その日に読んだページ数
  - セッション数
  - 読書時間（分）

- **週別統計** (`WeeklyStats`)
  - 週開始日
  - 週の総ページ数
  - 週の総セッション数
  - 週の総読書時間

- **月別統計**
  - 月
  - 月間読破冊数
  - 月間総ページ数
  - 月間平均読書時間/日

- **年別統計**
  - 年
  - 年間読破冊数
  - 年間総ページ数
  - 月別推移データ

### 2.2 読書目標機能

#### 2.2.1 目標設定
```typescript
interface ReadingGoal {
  id: string
  userId: string
  type: 'books_per_year' | 'pages_per_month' | 'minutes_per_day'
  targetValue: number
  currentValue: number
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

- **年間読書目標**: 年間読破冊数
- **月間ページ目標**: 月間読書ページ数
- **日間時間目標**: 日間読書時間（分）

#### 2.2.2 目標追跡
- 目標達成率（%）
- 目標達成予測
- 目標との乖離アラート

### 2.3 ダッシュボードコンポーネント

#### 2.3.1 メインダッシュボード (`ReadingDashboard`)
```tsx
interface ReadingDashboardProps {
  userId: string
  timeRange?: 'week' | 'month' | 'year'
}
```

**構成要素:**
- サマリーカード群
- 読書目標表示
- チャート表示エリア
- 最近の読書活動

#### 2.3.2 サマリーカード (`StatsSummaryCard`)
```tsx
interface StatsSummaryCardProps {
  title: string
  value: string | number
  icon: React.ComponentType
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    period: string
  }
  isLoading?: boolean
}
```

#### 2.3.3 目標進捗カード (`GoalProgressCard`)
```tsx
interface GoalProgressCardProps {
  goal: ReadingGoal
  currentProgress: number
  remainingDays: number
  isOnTrack: boolean
}
```

### 2.4 チャート・グラフ表示

#### 2.4.1 チャートライブラリ選択
**選択**: **Chart.js** + **react-chartjs-2**

**選択理由:**
- アクセシビリティサポートが充実
- レスポンシブデザイン対応
- パフォーマンスが良好
- 日本語フォント対応
- 豊富なカスタマイゼーション機能
- TypeScript完全対応

**代替案検討:**
- D3.js: より柔軟だが実装コストが高い
- Recharts: React特化だが機能が限定的

#### 2.4.2 チャートコンポーネント

**読書進捗チャート** (`ReadingProgressChart`)
```tsx
interface ReadingProgressChartProps {
  data: DailyStats[]
  type: 'pages' | 'sessions' | 'minutes'
  timeRange: 'week' | 'month' | 'year'
}
```
- 線グラフまたは棒グラフ
- X軸: 日付
- Y軸: ページ数/セッション数/読書時間

**書籍分布チャート** (`BookDistributionChart`)
```tsx
interface BookDistributionChartProps {
  data: Record<BookType | ReadingStatus, number>
  chartType: 'doughnut' | 'bar'
}
```
- ドーナツチャートまたは横棒グラフ
- 書籍タイプ別または読書状態別の分布

**読書目標チャート** (`ReadingGoalChart`)
```tsx
interface ReadingGoalChartProps {
  goals: ReadingGoal[]
  actualData: any[]
  showPrediction?: boolean
}
```
- 目標値と実績の比較
- 達成予測線の表示

## 3. UI/UX要件

### 3.1 デザインシステム

#### 3.1.1 デザイントークン
- **カラーパレット**: 既存のTailwind CSS設定を継承
- **フォント**: Geistフォントファミリー
- **スペーシング**: Tailwindの8pxグリッドシステム
- **レイアウト**: Grid/Flexboxベースのレスポンシブデザイン

#### 3.1.2 コンポーネント設計
- shadcn/uiコンポーネントライブラリを基盤
- Compound Componentパターンの採用
- 一貫性のある視覚的階層

### 3.2 レスポンシブデザイン

#### 3.2.1 ブレイクポイント戦略
```css
/* モバイル優先のレスポンシブ設計 */
- sm: 640px以上（タブレット縦向き）
- md: 768px以上（タブレット横向き）
- lg: 1024px以上（デスクトップ）
- xl: 1280px以上（大画面デスクトップ）
```

#### 3.2.2 チャートのレスポンシブ対応
- **モバイル**: 単一列レイアウト、縦型チャート中心
- **タブレット**: 2列グリッド、チャートサイズ調整
- **デスクトップ**: 3-4列グリッド、最適なチャート比率

### 3.3 ローディング状態

#### 3.3.1 スケルトンローディング
```tsx
interface LoadingSkeletonProps {
  type: 'card' | 'chart' | 'table'
  count?: number
}
```

- カード型: 統計サマリー用
- チャート型: グラフ描画待ち用
- テーブル型: データ一覧用

#### 3.3.2 プログレッシブローディング
1. 基本統計（高速）→ サマリーカード表示
2. チャートデータ（中速）→ グラフ描画
3. 詳細統計（低速）→ 詳細データ表示

### 3.4 エラー処理・フォールバック

#### 3.4.1 エラー境界の実装
```tsx
interface ErrorBoundaryProps {
  fallback: React.ComponentType<{ error: Error }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}
```

#### 3.4.2 エラー表示パターン
- **データなし**: 初回利用ユーザー向けの案内
- **取得失敗**: リトライボタン付きエラー表示
- **部分エラー**: 正常部分は表示、エラー部分のみフォールバック

### 3.5 アクセシビリティ

#### 3.5.1 キーボードナビゲーション
- Tab順序の論理的配置
- フォーカスインジケータの明確化
- ショートカットキーの提供

#### 3.5.2 スクリーンリーダー対応
```tsx
// チャートの代替テキスト例
<Chart
  data={chartData}
  aria-label="過去30日の読書ページ数推移"
  aria-describedby="chart-summary"
/>
<div id="chart-summary" className="sr-only">
  過去30日間で計{totalPages}ページを読み、
  平均して1日{averagePages}ページのペースです。
</div>
```

#### 3.5.3 コントラスト・可読性
- WCAG 2.1 AA基準準拠
- チャートカラーパレットの色覚対応
- 文字サイズ・行間の最適化

## 4. テスト要件

### 4.1 単体テスト

#### 4.1.1 統計計算ロジック
**テスト対象**: `/lib/services/reading-stats.ts`

```typescript
describe('Reading Statistics Service', () => {
  describe('calculateDailyStats', () => {
    it('正常な読書セッションデータから日別統計を正確に計算する')
    it('セッションが存在しない日は0値を返す')
    it('同日複数セッションを適切に集計する')
    it('無効なデータは除外して計算する')
  })

  describe('calculateReadingSpeed', () => {
    it('ページ数と時間から正確な読書速度を計算する')
    it('0除算エラーを適切に処理する')
    it('異常値は除外して平均を計算する')
  })

  describe('calculateGoalProgress', () => {
    it('期間と目標値から進捗率を正確に計算する')
    it('期間超過時の処理が正しい')
    it('複数目標の同時追跡が正常に動作する')
  })
})
```

#### 4.1.2 データ変換・フィルタリング
```typescript
describe('Data Transformation Utils', () => {
  describe('transformStatsForChart', () => {
    it('統計データをChart.js形式に正確に変換する')
    it('欠損データを適切に補間する')
    it('時系列データのソートが正しい')
  })

  describe('filterStatsByDateRange', () => {
    it('指定期間内のデータのみを抽出する')
    it('境界値が正しく処理される')
    it('無効な日付範囲でエラーハンドリングされる')
  })
})
```

### 4.2 統合テスト

#### 4.2.1 APIエンドポイント
**テスト対象**: `/app/api/stats/**`

```typescript
describe('/api/stats/dashboard', () => {
  it('認証済みユーザーの統計データを正しく返す')
  it('期間指定パラメータが正常に動作する')
  it('データが存在しない場合の初期値を返す')
  it('不正なパラメータでバリデーションエラーを返す')
  it('データベースエラー時の適切なエラーレスポンス')
})

describe('/api/stats/goals', () => {
  it('読書目標の作成・更新・削除が正常に動作する')
  it('目標進捗の計算が正確である')
  it('複数目標の同時管理が可能である')
})
```

### 4.3 コンポーネントテスト

#### 4.3.1 ダッシュボードコンポーネント
```typescript
describe('ReadingDashboard', () => {
  it('統計データが正常に表示される')
  it('ローディング状態が適切に表示される')
  it('エラー状態のフォールバック表示が正しい')
  it('時間範囲の切り替えが正常に動作する')
  it('レスポンシブレイアウトが適用される')
})

describe('StatsSummaryCard', () => {
  it('統計値が正しくフォーマットされて表示される')
  it('トレンド情報が正確に表示される')
  it('アイコンとタイトルが適切に配置される')
  it('ローディング状態のスケルトンが表示される')
})
```

#### 4.3.2 チャートコンポーネント
```typescript
describe('ReadingProgressChart', () => {
  it('日別データがグラフとして正確に描画される')
  it('データタイプ切り替えが正常に動作する')
  it('レスポンシブサイズ調整が適用される')
  it('アクセシビリティ属性が適切に設定される')
  it('空データの場合の表示が適切である')
})

describe('BookDistributionChart', () => {
  it('書籍タイプ別分布が正確に表示される')
  it('読書状態別分布が正確に表示される')
  it('チャートタイプの切り替えが正常に動作する')
  it('データラベルが日本語で正しく表示される')
})
```

### 4.4 E2Eテスト（将来実装）

#### 4.4.1 ユーザーシナリオ
```typescript
describe('Reading Dashboard E2E', () => {
  it('ログイン後にダッシュボードが表示される')
  it('読書目標の設定から追跡まで一連の操作ができる')
  it('統計データがリアルタイムで更新される')
  it('モバイル端末でのタッチ操作が正常に動作する')
})
```

### 4.5 パフォーマンステスト

#### 4.5.1 大量データでの処理性能
```typescript
describe('Performance Tests', () => {
  it('1000冊のデータでも統計計算が2秒以内に完了する')
  it('10000セッションのデータでチャート描画が3秒以内に完了する')
  it('メモリリークが発生しない')
  it('並行アクセス時でもレスポンス時間が安定している')
})
```

## 5. データモデル設計

### 5.1 統計データキャッシュ

#### 5.1.1 ReadingStatsCache モデル
```typescript
model ReadingStatsCache {
  id        String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  statsType String   @map("stats_type") // 'daily', 'weekly', 'monthly', 'yearly'
  period    String   // '2024-03-15', '2024-W12', '2024-03', '2024'
  data      Json     // 統計データをJSON形式で保存
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  userProfile UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, statsType, period])
  @@map("reading_stats_cache")
}
```

#### 5.1.2 ReadingGoal モデル
```typescript
model ReadingGoal {
  id           String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  type         String   // 'books_per_year', 'pages_per_month', 'minutes_per_day'
  targetValue  Int      @map("target_value")
  currentValue Int      @default(0) @map("current_value")
  startDate    DateTime @map("start_date") @db.Date
  endDate      DateTime @map("end_date") @db.Date
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  userProfile UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("reading_goals")
}
```

### 5.2 型定義

#### 5.2.1 統計データ型
```typescript
// /lib/models/reading-stats.ts
export interface ReadingStatsOverview {
  totalBooksCompleted: number
  totalPagesRead: number
  totalReadingTime: number // minutes
  currentStreak: number // days
  booksInProgress: number
  averageReadingSpeed: number // pages per minute
}

export interface PeriodStats {
  period: string
  booksCompleted: number
  pagesRead: number
  readingTime: number
  sessions: number
}

export interface ChartDataPoint {
  label: string
  value: number
  date?: string
}

export interface GoalProgress {
  goal: ReadingGoal
  currentValue: number
  targetValue: number
  progressPercentage: number
  remainingDays: number
  dailyTargetToMeetGoal: number
  isOnTrack: boolean
}
```

## 6. パフォーマンス要件

### 6.1 レスポンス時間
- **統計データ取得**: 初回1.5秒以内、キャッシュ時500ms以内
- **チャート描画**: 1秒以内
- **ダッシュボード初期表示**: 2秒以内

### 6.2 スケーラビリティ
- **ユーザー数**: 10,000人同時アクセス対応
- **データ量**: ユーザー当たり最大100,000セッション
- **チャート描画**: 最大5,000データポイント

### 6.3 キャッシュ戦略
- **統計データ**: Redis + データベースキャッシュ（24時間TTL）
- **チャートデータ**: ブラウザメモリキャッシュ（1時間TTL）
- **APIレスポンス**: SWRによるクライアントサイドキャッシュ

### 6.4 最適化手法
- **データベース**: インデックス最適化、集約クエリ
- **フロントエンド**: コンポーネント分割、Lazy Loading
- **チャート**: データ間引き、仮想化

## 7. セキュリティ要件

### 7.1 データアクセス制御
- ユーザーは自分の統計データのみアクセス可能
- APIエンドポイントでの認証・認可チェック
- SQLインジェクション対策

### 7.2 プライバシー保護
- 個人読書データの匿名化オプション
- データエクスポート機能での個人識別情報除去
- GDPR準拠のデータ削除機能

## 8. 実装計画

### 8.1 フェーズ1: 基盤実装（1スプリント）
- [ ] データモデル設計・マイグレーション
- [ ] 基本統計計算ロジック
- [ ] APIエンドポイント基盤
- [ ] 単体テスト実装

### 8.2 フェーズ2: UI実装（1スプリント）
- [ ] ダッシュボードコンポーネント
- [ ] 統計サマリーカード
- [ ] Chart.jsセットアップ
- [ ] レスポンシブレイアウト

### 8.3 フェーズ3: 高度機能（1スプリント）
- [ ] 読書目標機能
- [ ] 詳細チャート
- [ ] パフォーマンス最適化
- [ ] アクセシビリティ対応

## 9. 成功指標（KPI）

### 9.1 機能指標
- 統計計算の正確性: 100%
- チャート描画成功率: 99%以上
- ダッシュボード利用率: アクティブユーザーの60%以上

### 9.2 パフォーマンス指標
- 平均レスポンス時間: 1秒以内
- エラー率: 0.1%以下
- ユーザー満足度: 4.5/5以上

### 9.3 アクセシビリティ指標
- WCAG 2.1 AA基準: 100%準拠
- キーボード操作: 全機能対応
- スクリーンリーダー: 問題なく利用可能

## 10. 将来拡張計画

### 10.1 ソーシャル機能
- 読書統計の他ユーザーとの比較
- 読書チャレンジ機能
- コミュニティランキング

### 10.2 AI機能
- 読書パターン分析
- おすすめ読書時間提案
- 目標達成予測の精度向上

### 10.3 データエクスポート
- PDF形式での年間読書レポート
- CSV形式での詳細データ出力
- 他サービスとのデータ連携API