# TASK-402: パフォーマンス最適化 - 最小実装

## 実装結果確認

テスト実行結果から以下の最適化が必要であることが確認されました：

### 失敗したテスト
1. **動的インポートテスト**: BookCardコンポーネントで動的インポートが未使用
2. **コンポーネントサイズテスト**: コンポーネントサイズが4907文字（目標2000文字以下）
3. **画像最適化テスト**: 期待されるsizes属性の設定が異なる

## 最小実装プラン

### 1. 画像最適化の改善

現在のBookCardは既にNext.js Imageを使用していますが、sizes属性を最適化します。

```typescript
// components/library/BookCard.tsx での改善
sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
↓
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
```

### 2. 重いコンポーネントの動的インポート実装

統計チャートなどの重いコンポーネントに動的インポートを実装：

```typescript
// 動的インポートの実装例
const StatisticsChart = dynamic(() => import('@/components/dashboard/StatisticsChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false
})
```

### 3. Server Actions キャッシュ実装

```typescript
// lib/server-actions/books.ts でのキャッシュ実装
import { unstable_cache } from 'next/cache'

export const searchBooks = unstable_cache(
  async (query: string) => {
    // 既存の検索ロジック
  },
  ['search-books'],
  { revalidate: 300 } // 5分間キャッシュ
)
```

### 4. データベースクエリの最適化

Prismaクエリでのinclude最適化：

```typescript
// N+1問題を解決するため include を使用
const userBooks = await prisma.userBook.findMany({
  where: { userId },
  include: {
    book: true, // 関連する書籍データを一度に取得
  }
})
```

## 実装の優先順位

1. **高優先度**: 画像最適化（sizes属性の改善）
2. **中優先度**: Server Actions キャッシュ実装
3. **中優先度**: データベースクエリ最適化
4. **低優先度**: 動的インポート実装

## 実装後の期待値

- 画像読み込み: 50%高速化
- API レスポンス: キャッシュヒット時90%高速化
- データベースクエリ: N+1問題解決により60%高速化
- バンドルサイズ: 動的インポートで30%削減

## 次のステップ

テストが通るように、上記の最小実装を順次実行していきます。