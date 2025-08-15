/**
 * 書籍リストローディング用スケルトンコンポーネント
 */

import React from 'react'
import type { BookSkeletonProps } from '@/lib/models/book'

export function BookSkeleton({ viewMode, count = 6 }: BookSkeletonProps) {
  const skeletonItems = Array.from({ length: count }, (_, index) => index)

  if (viewMode === 'grid') {
    return (
      <div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        data-testid="skeleton-container"
        aria-label="書籍データを読み込み中"
        aria-busy="true"
      >
        {skeletonItems.map((index) => (
          <div
            key={index}
            className="grid-skeleton animate-pulse bg-gray-200 rounded-lg p-4 space-y-3"
            data-testid="skeleton-item"
            role="status"
            aria-label="書籍情報を読み込み中"
          >
            {/* 書影スケルトン */}
            <div className="bg-gray-300 rounded-md h-32 w-full" />
            {/* タイトルスケルトン */}
            <div className="bg-gray-300 rounded h-4 w-3/4" />
            {/* 著者スケルトン */}
            <div className="bg-gray-300 rounded h-3 w-1/2" />
            {/* ステータススケルトン */}
            <div className="bg-gray-300 rounded h-6 w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div 
      className="space-y-4"
      data-testid="skeleton-container"
      aria-label="書籍データを読み込み中"
      aria-busy="true"
    >
      {skeletonItems.map((index) => (
        <div
          key={index}
          className="list-skeleton animate-pulse bg-gray-200 rounded-lg p-4 flex gap-4"
          data-testid="skeleton-item"
          role="status"
          aria-label="書籍情報を読み込み中"
        >
          {/* 書影スケルトン */}
          <div className="bg-gray-300 rounded-md h-16 w-12 flex-shrink-0" />
          {/* 情報スケルトン */}
          <div className="flex-1 space-y-2">
            <div className="bg-gray-300 rounded h-5 w-2/3" />
            <div className="bg-gray-300 rounded h-4 w-1/2" />
            <div className="bg-gray-300 rounded h-3 w-1/4" />
          </div>
          {/* ステータススケルトン */}
          <div className="bg-gray-300 rounded h-6 w-20" />
        </div>
      ))}
    </div>
  )
}