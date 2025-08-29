# TASK-301: ユーザープロフィール・設定画面 - Red Phase

## Red Phase実装概要

TDDの最初のフェーズとして、**失敗するテスト**を実装しました。この段階では実際のコンポーネントやServer Actionsは存在せず、全てのテストが期待通り失敗します。

## 実装したテストファイル

### 1. コンポーネントテスト

#### UserSettings.test.tsx
**場所**: `__tests__/components/profile/UserSettings.test.tsx`

**テスト対象**: UserSettings コンポーネント（設定画面）

**実装内容**:
- ✅ **設定項目の表示テスト** (5個)
  - テーマ設定の表示
  - 表示モード設定の表示  
  - 表示件数設定の表示
  - デフォルト書籍タイプの表示
  - 読書目標の表示

- ✅ **テーマ切り替えテスト** (3個)
  - ライト→ダークテーマ変更
  - システムテーマ選択
  - テーマのプレビュー反映

- ✅ **表示設定変更テスト** (3個)
  - グリッド→リスト表示変更
  - 表示件数変更
  - デフォルト書籍タイプ変更

- ✅ **バリデーションテスト** (3個)
  - 表示件数範囲外エラー
  - 読書目標範囲外エラー
  - 必須項目未設定エラー

- ✅ **保存機能テスト** (4個)
  - 単一設定保存
  - 複数設定保存
  - ローディング状態でのボタン無効化
  - ローディング状態でのスピナー表示

- ✅ **アクセシビリティテスト** (2個)
  - Tabキーでのフォーカス移動
  - Enterキーでの保存実行

- ✅ **レスポンシブ対応テスト** (2個)
  - モバイル表示レイアウト
  - デスクトップ表示レイアウト

- ✅ **パフォーマンステスト** (1個)
  - 設定保存処理が1秒以内完了

**合計**: 23個のテストケース

#### ProfileForm.test.tsx (既存拡張)
**場所**: `__tests__/components/profile/ProfileForm.test.tsx`

既存のProfileFormテストが存在することを確認。プロフィール情報の表示・更新に関する基本的なテストが実装済み。

### 2. Server Actions テスト

#### user-settings.test.ts
**場所**: `__tests__/lib/server-actions/user-settings.test.ts`

**テスト対象**: ユーザー設定のServer Actions

**実装内容**:
- ✅ **getUserSettings テスト** (3個)
  - 認証済みユーザーの設定取得
  - 未認証ユーザーでのエラー処理
  - データベースエラー処理

- ✅ **updateUserSettings テスト** (6個)
  - 有効な設定での正常更新
  - 無効なテーマでのバリデーションエラー
  - 表示件数範囲外バリデーションエラー
  - 読書目標範囲外バリデーションエラー
  - 未認証ユーザーでのエラー処理
  - データベース更新エラー処理

- ✅ **updateUserProfile テスト** (5個)
  - 有効なプロフィール情報での正常更新
  - 無効なメールアドレスでのバリデーションエラー
  - 空のユーザー名でのバリデーションエラー
  - 長すぎるユーザー名でのバリデーションエラー
  - データベース更新エラー処理

- ✅ **レスポンス時間テスト** (2個)
  - 設定更新処理が1秒以内完了
  - プロフィール取得処理が2秒以内完了

**合計**: 16個のテストケース

## テスト実行結果

### 予想される失敗理由

現在実装したテストは以下の理由で**全て失敗**します：

1. **UserSettings コンポーネントが存在しない**
   ```
   Cannot resolve module '@/components/profile/UserSettings'
   ```

2. **user-settings Server Actions が存在しない**
   ```
   Cannot resolve module '@/lib/server-actions/user-settings'
   ```

3. **型定義が存在しない**
   ```
   Cannot find module '@/types/profile'
   ```

### テスト実行コマンド

```bash
# 個別テスト実行
npm test -- __tests__/components/profile/UserSettings.test.tsx
npm test -- __tests__/lib/server-actions/user-settings.test.ts

# 全体テスト実行
npm test
```

## 実装予定の型定義

テストで使用している型定義（Green Phaseで実装予定）:

```typescript
// types/profile.ts
export interface UserSettingsProps {
  settings: UserPreferences
  onSave: (settings: UserPreferences) => Promise<void>
  loading: boolean
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  displayMode: 'grid' | 'list'
  booksPerPage: number
  defaultBookType: 'physical' | 'ebook'
  readingGoal?: number
}

export interface UserProfileUpdate {
  name: string
  email: string
  avatarUrl?: string
}

export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
}
```

## Red Phaseの品質確認

### ✅ テストの網羅性
- **正常系**: 基本機能の動作確認
- **異常系**: エラー処理とバリデーション
- **境界値**: 入力値の上限・下限
- **統合**: コンポーネント間の連携
- **パフォーマンス**: レスポンス時間要件
- **アクセシビリティ**: キーボード操作対応
- **レスポンシブ**: モバイル・デスクトップ対応

### ✅ 要件との対応
- **REQ-201**: ユーザー固有データ表示 → プロフィール表示テストで対応
- **NFR-201**: 直感的UI → アクセシビリティテストで対応
- **NFR-202**: WCAG準拠 → キーボード操作テストで対応
- **NFR-203**: モバイル対応 → レスポンシブテストで対応
- **パフォーマンス要件**: 1秒以内保存、2秒以内表示 → 専用テストで対応

### ✅ エラーハンドリングの充実
- 認証エラー
- バリデーションエラー
- データベースエラー
- ネットワークエラー

## 次のステップ

Red Phaseが完了したため、次はGreen Phaseに進みます：

1. **型定義の作成** (`types/profile.ts`)
2. **UserSettings コンポーネント実装**
3. **Server Actions 実装**
4. **最小限の機能実装でテスト通過**

全てのテストが **Red（失敗）** 状態で準備完了です。