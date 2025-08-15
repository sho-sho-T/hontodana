# TASK-104: 読書進捗管理システム - 詳細要件定義

## 概要

読書中の書籍に対する進捗管理システムを実装する。ページ数ベースでの進捗記録、セッション追跡、統計データの生成を行う。

## 機能要件

### 1. ReadingSession モデル

**目的**: 読書セッションの記録と管理

**データ構造**:
```typescript
interface ReadingSession {
  id: string
  userBookId: string  // UserBook との関連
  startPage: number   // セッション開始ページ
  endPage: number     // セッション終了ページ
  startTime: Date     // セッション開始時刻
  endTime: Date       // セッション終了時刻
  duration: number    // セッション時間（分）
  notes?: string      // セッションメモ（オプション）
  createdAt: Date
  updatedAt: Date
}
```

**制約**:
- `startPage` >= 1
- `endPage` >= `startPage`
- `endPage` <= 書籍の総ページ数
- `duration` は `endTime` - `startTime` から自動計算
- `userBookId` は既存の UserBook と関連する

### 2. 進捗更新 Server Actions

**2.1 updateReadingProgress**

**目的**: 読書進捗の更新とセッション記録

**引数**:
```typescript
interface UpdateProgressInput {
  userBookId: string
  currentPage: number
  sessionNotes?: string
}
```

**処理フロー**:
1. 入力データのバリデーション
2. 既存の UserBook の取得
3. 進捗の妥当性チェック（逆行チェック、ページ数超過チェック）
4. 新しい ReadingSession の作成
5. UserBook の progress フィールドの更新
6. 読了判定（currentPage >= totalPages の場合、status を READ に更新）

**戻り値**:
```typescript
interface UpdateProgressResult {
  success: boolean
  updatedUserBook: UserBook
  newSession: ReadingSession
  isCompleted: boolean  // 読了したかどうか
  progressPercentage: number
}
```

**エラーケース**:
- 無効な userBookId
- 進捗の逆行（現在より少ないページ数）
- 総ページ数の超過
- データベース更新エラー

### 3. 進捗率計算ロジック

**目的**: 現在の読書進捗率の正確な計算

**計算式**:
```typescript
const progressPercentage = (currentPage / totalPages) * 100
```

**考慮事項**:
- totalPages が 0 または null の場合は 0% を返す
- 小数点以下は1桁まで表示（例：45.7%）
- 100%を超過しないよう制限

### 4. 読書セッション記録機能

**目的**: 読書セッションの詳細な追跡

**機能**:
- セッション自動開始（進捗更新時）
- セッション時間の自動計算
- セッションメモの記録
- セッション履歴の管理

### 5. 統計データの生成

**目的**: 読書習慣の分析データ提供

**統計項目**:
- 総読書時間
- 平均セッション時間
- 日別読書ページ数
- 週別・月別統計
- 読書ペース（ページ/日）

**データ形式**:
```typescript
interface ReadingStats {
  totalReadingTime: number      // 総読書時間（分）
  averageSessionTime: number    // 平均セッション時間（分）
  dailyPagesRead: number[]      // 日別ページ数（過去7日）
  weeklyStats: WeeklyStats[]    // 週別統計
  monthlyStats: MonthlyStats[]  // 月別統計
  averagePagesPerDay: number    // 平均ページ/日
}
```

## 非機能要件

### パフォーマンス
- 進捗更新は 1秒以内に完了
- 統計データの生成は 3秒以内
- 大量のセッションデータ（1000件以上）でも高速処理

### データ整合性
- 進捗データの不整合防止
- トランザクション処理での一貫性確保
- 同時更新時の競合状態の回避

### ユーザビリティ
- 直感的な進捗入力UI
- リアルタイムな進捗率表示
- エラー時の分かりやすいメッセージ

## 受け入れ基準

### 機能面
1. ✅ 進捗更新が正しく記録される
2. ✅ セッションデータが正確に保存される
3. ✅ 進捗率が正しく計算される
4. ✅ 読了判定が適切に動作する
5. ✅ 統計データが正確に生成される

### エラーハンドリング
1. ✅ 無効な進捗値の適切な処理
2. ✅ データベースエラーの処理
3. ✅ 同時更新競合の処理

### パフォーマンス
1. ✅ レスポンス時間の要件達成
2. ✅ 大量データでの安定動作

## 技術的制約

### データベース設計
- Prisma ORM を使用
- PostgreSQL での効率的なクエリ設計
- インデックス設計による高速化

### セキュリティ
- ユーザー認証による進捗データの保護
- RLS (Row Level Security) の適用
- 入力値のサニタイゼーション

## テスト要件

### 単体テスト
- 進捗率計算ロジック
- セッション記録機能
- 統計データ生成

### 統合テスト
- 進捗更新フロー全体
- データベース操作の確認

### 境界値テスト
- ページ数の妥当性検証
- 進捗の逆行チェック
- 限界値でのデータ処理

## 実装優先度

1. **High**: ReadingSession モデルと基本CRUD
2. **High**: updateReadingProgress Server Action
3. **High**: 進捗率計算ロジック
4. **Medium**: セッション記録機能
5. **Medium**: 統計データ生成
6. **Low**: 高度な統計機能（月別・週別）

## 参考資料

- データベーススキーマ: `docs/design/hontodana/database-schema.sql`
- 既存の Book モデル実装
- ユーザー認証システム (TASK-003)