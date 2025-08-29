# TASK-302: モバイル対応・レスポンシブ最適化 - REFACTOR Phase (リファクタリング)

## フェーズ概要

Green Phaseで最小実装が完了したので、コードの品質向上とより良い設計に向けたリファクタリングを実行します。テストが通ることを保証しながら、以下の改善を行います。

## リファクタリング項目

### 1. useViewport Hook の改善

#### 問題点
- 重複したロジックの存在
- マジックナンバーの使用
- パフォーマンス最適化の余地

#### 改善後のコード

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'

// ブレークポイント定数の定義
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const

export interface ViewportState {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  breakpoint: keyof typeof BREAKPOINTS | 'XS'
}

const getViewportState = (width: number, height: number): ViewportState => {
  let breakpoint: ViewportState['breakpoint'] = 'XS'
  
  if (width >= BREAKPOINTS['2XL']) breakpoint = '2XL'
  else if (width >= BREAKPOINTS.XL) breakpoint = 'XL'
  else if (width >= BREAKPOINTS.LG) breakpoint = 'LG'
  else if (width >= BREAKPOINTS.MD) breakpoint = 'MD'
  else if (width >= BREAKPOINTS.SM) breakpoint = 'SM'

  return {
    width,
    height,
    isMobile: width < BREAKPOINTS.SM,
    isTablet: width >= BREAKPOINTS.MD && width < BREAKPOINTS.LG,
    isDesktop: width >= BREAKPOINTS.LG,
    breakpoint,
  }
}

export function useViewport(): ViewportState {
  const [viewport, setViewport] = useState<ViewportState>(() => {
    // SSR対応のデフォルト値
    if (typeof window === 'undefined') {
      return getViewportState(BREAKPOINTS.LG, 768)
    }
    return getViewportState(window.innerWidth, window.innerHeight)
  })

  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return
    setViewport(getViewportState(window.innerWidth, window.innerHeight))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 初回設定
    handleResize()

    // デバウンス処理（パフォーマンス改善）
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', debouncedResize, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', debouncedResize)
    }
  }, [handleResize])

  return viewport
}
```

### 2. BookCard コンポーネントの改善

#### 問題点
- レスポンシブクラスが散在している
- 可読性の低下
- スタイリング定数の不足

#### 改善案：レスポンシブクラスの統合

```typescript
'use client'

import type React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { BookStatus } from '@/lib/models/book'
import type { BookCardProps } from '@/lib/models/book'
import { ProgressBar } from './ProgressBar'
import { getStatusLabel, getStatusColor } from '@/lib/utils/book-ui-helpers'
import { StarRatingDisplay } from '@/components/rating/StarRating'
import { cn } from '@/lib/utils'

// スタイリング定数
const CARD_STYLES = {
  container: 'w-full sm:w-auto bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200',
  imageContainer: 'relative h-48 bg-gray-100',
  content: 'p-4 space-y-3',
  title: 'font-semibold text-lg text-gray-900 line-clamp-2',
  author: 'text-sm text-gray-600 line-clamp-1',
  publisher: 'text-xs text-gray-500',
  statusRow: 'flex items-center justify-between',
  buttonContainer: 'flex gap-2 pt-2',
  button: 'min-h-11 min-w-11 px-3 py-2 text-sm rounded-md transition-colors',
  primaryButton: 'flex-1 bg-blue-500 text-white hover:bg-blue-600',
  dangerButton: 'bg-red-500 text-white hover:bg-red-600',
} as const

export function BookCard({ book, onStatusChange, onRemove }: BookCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/library/books/${book.id}`)
  }

  const handleStatusChange = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextStatus = book.status === BookStatus.READING ? BookStatus.read : BookStatus.read
    onStatusChange(book.id, nextStatus)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove(book.id)
  }

  const thumbnailSrc = book.book.thumbnailUrl || '/images/book-placeholder.png'

  return (
    <div 
      className={CARD_STYLES.container}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${book.book.title} の詳細`}
    >
      {/* 書影 */}
      <div className={CARD_STYLES.imageContainer}>
        <Image
          src={thumbnailSrc}
          alt={`${book.book.title} の書影`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={false}
        />
      </div>

      {/* 書籍情報 */}
      <div className={CARD_STYLES.content}>
        {/* タイトル */}
        <h3 className={CARD_STYLES.title}>
          {book.book.title}
        </h3>

        {/* 著者 */}
        <p className={CARD_STYLES.author}>
          {book.book.authors.join(', ')}
        </p>

        {/* 出版社 */}
        {book.book.publisher && (
          <p className={CARD_STYLES.publisher}>
            {book.book.publisher}
          </p>
        )}

        {/* ステータスバッジと評価 */}
        <div className={CARD_STYLES.statusRow}>
          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(book.status))}>
            {getStatusLabel(book.status)}
          </span>
          {book.rating && (
            <StarRatingDisplay 
              rating={book.rating}
              size="sm"
              className="ml-2"
            />
          )}
        </div>

        {/* 進捗バー（読書中の場合のみ） */}
        {book.status === BookStatus.READING && book.book.pageCount && (
          <ProgressBar
            current={book.currentPage}
            total={book.book.pageCount}
            label="読書進捗"
          />
        )}

        {/* 操作ボタン */}
        <div className={CARD_STYLES.buttonContainer}>
          <button
            type="button"
            onClick={handleStatusChange}
            className={cn(CARD_STYLES.button, CARD_STYLES.primaryButton)}
            aria-label="ステータス変更"
          >
            ステータス変更
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className={cn(CARD_STYLES.button, CARD_STYLES.dangerButton)}
            aria-label="削除"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 3. 新しいユーティリティ関数の追加

#### レスポンシブユーティリティ

```typescript
// lib/utils/responsive.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { BREAKPOINTS } from '@/hooks/useViewport'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getResponsiveValue<T>(
  values: {
    xs?: T
    sm?: T
    md?: T
    lg?: T
    xl?: T
    '2xl'?: T
  },
  currentWidth: number
): T | undefined {
  if (currentWidth >= BREAKPOINTS['2XL'] && values['2xl']) return values['2xl']
  if (currentWidth >= BREAKPOINTS.XL && values.xl) return values.xl
  if (currentWidth >= BREAKPOINTS.LG && values.lg) return values.lg
  if (currentWidth >= BREAKPOINTS.MD && values.md) return values.md
  if (currentWidth >= BREAKPOINTS.SM && values.sm) return values.sm
  return values.xs
}

export function createResponsiveClasses(
  property: string,
  values: {
    xs?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
    '2xl'?: string
  }
): string {
  const classes: string[] = []
  
  if (values.xs) classes.push(`${property}-${values.xs}`)
  if (values.sm) classes.push(`sm:${property}-${values.sm}`)
  if (values.md) classes.push(`md:${property}-${values.md}`)
  if (values.lg) classes.push(`lg:${property}-${values.lg}`)
  if (values.xl) classes.push(`xl:${property}-${values.xl}`)
  if (values['2xl']) classes.push(`2xl:${property}-${values['2xl']}`)
  
  return classes.join(' ')
}
```

### 4. カスタムHookの拡張

#### useResponsiveValue Hook

```typescript
// hooks/useResponsiveValue.ts
'use client'

import { useViewport } from './useViewport'

export function useResponsiveValue<T>(values: {
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  '2xl'?: T
}): T | undefined {
  const { width } = useViewport()
  
  if (width >= 1536 && values['2xl']) return values['2xl']
  if (width >= 1280 && values.xl) return values.xl
  if (width >= 1024 && values.lg) return values.lg
  if (width >= 768 && values.md) return values.md
  if (width >= 640 && values.sm) return values.sm
  return values.xs
}
```

### 5. パフォーマンス最適化

#### メモ化の追加

```typescript
// components/library/BookCard.tsx (メモ化版)
import React, { memo, useMemo } from 'react'

const BookCard = memo<BookCardProps>(({ book, onStatusChange, onRemove }) => {
  const router = useRouter()

  const cardActions = useMemo(() => ({
    handleCardClick: () => router.push(`/library/books/${book.id}`),
    handleStatusChange: (e: React.MouseEvent) => {
      e.stopPropagation()
      const nextStatus = book.status === BookStatus.READING ? BookStatus.read : BookStatus.read
      onStatusChange(book.id, nextStatus)
    },
    handleRemove: (e: React.MouseEvent) => {
      e.stopPropagation()
      onRemove(book.id)
    },
  }), [book.id, book.status, router, onStatusChange, onRemove])

  const imageConfig = useMemo(() => ({
    src: book.book.thumbnailUrl || '/images/book-placeholder.png',
    alt: `${book.book.title} の書影`,
  }), [book.book.thumbnailUrl, book.book.title])

  // レンダリング部分は同じ...
})

BookCard.displayName = 'BookCard'
```

## リファクタリング実装順序

### Phase 1: 基本改善 ✅

1. **useViewport Hook の改善**
   - 定数の分離
   - デバウンス処理追加
   - パフォーマンス最適化

### Phase 2: スタイリング改善

1. **BookCard コンポーネント改善**
   - スタイル定数の分離
   - cn ユーティリティの活用
   - 可読性向上

### Phase 3: ユーティリティ追加

1. **レスポンシブユーティリティ**
   - responsive.ts の作成
   - ヘルパー関数の追加

### Phase 4: フック拡張

1. **useResponsiveValue Hook**
   - レスポンシブ値選択のヘルパー

### Phase 5: パフォーマンス最適化

1. **メモ化の実装**
   - React.memo の適用
   - useMemo の活用

## テスト更新

リファクタリング後もテストが通ることを確認：

```bash
# 基本テストスイート
npm test -- __tests__/hooks/useViewport.test.ts
npm test -- __tests__/components/BookCard.responsive.test.tsx

# パフォーマンステスト
npm test -- __tests__/performance/responsive.test.ts
```

## 品質向上の効果

### 1. 保守性
- **定数の分離**: マジックナンバーの排除
- **コードの整理**: 読みやすい構造
- **型安全性**: TypeScript活用の向上

### 2. パフォーマンス
- **デバウンス**: リサイズイベントの最適化
- **メモ化**: 不要な再レンダリングの防止
- **イベントリスナー**: Passive オプションの使用

### 3. 再利用性
- **ユーティリティ関数**: 他のコンポーネントでも使用可能
- **カスタムフック**: レスポンシブロジックの共有
- **スタイル定数**: 一貫性のあるデザイン

## リファクタリング完了基準

- [ ] 全テストがパス
- [ ] パフォーマンス向上を確認
- [ ] コードレビューチェックリスト完了
- [ ] ドキュメント更新
- [ ] 型安全性の確認