# タスク完了時のチェックリスト

## コード品質チェック

### 必須実行コマンド
1. **Biome チェック**
   ```bash
   npx biome check
   npx biome check --fix  # 自動修正可能なものを修正
   ```

2. **Next.js リント**
   ```bash
   npm run lint
   ```

3. **TypeScript型チェック**
   ```bash
   npx tsc --noEmit  # 型エラーチェック
   ```

## データベース関連タスクの場合

1. **Prismaクライアント再生成**
   ```bash
   npm run db:generate
   ```

2. **マイグレーション実行**
   ```bash
   npm run db:migrate
   ```

3. **スキーマ検証**
   ```bash
   npx prisma validate
   ```

## ビルド確認

1. **開発ビルド確認**
   ```bash
   npm run dev
   # http://localhost:3000 で動作確認
   ```

2. **プロダクションビルド確認**
   ```bash
   npm run build
   ```

## Git操作前の確認

1. **ファイル状態確認**
   ```bash
   git status
   ```

2. **変更内容確認**
   ```bash
   git diff
   ```

## 注意事項
- 全てのチェックが通ってからコミット
- エラーや警告が残っている場合は修正を完了してから次のステップへ
- データベーススキーマ変更時は必ずマイグレーション作成