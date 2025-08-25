'use client'

/**
 * 書籍カードコンポーネント（グリッド表示用）
 */

import type React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { BookStatus } from '@/lib/models/book'
import type { BookCardProps } from '@/lib/models/book'
import { ProgressBar } from './ProgressBar'
import { getStatusLabel, getStatusColor } from '@/lib/utils/book-ui-helpers'
import { StarRatingDisplay } from '@/components/rating/StarRating'

export function BookCard({ book, onStatusChange, onRemove }: BookCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/library/books/${book.id}`)
  }

  const handleStatusChange = (e: React.MouseEvent) => {
    e.stopPropagation()
    // 簡単なステータス切り替えロジック（読書中→読了）
    const nextStatus = book.status === BookStatus.READING ? BookStatus.READ : BookStatus.READ
    onStatusChange(book.id, nextStatus)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove(book.id)
  }

  const thumbnailSrc = book.book.thumbnailUrl || '/images/book-placeholder.png'
  const _progressPercentage = book.book.pageCount ? (book.currentPage / book.book.pageCount) * 100 : 0

  return (
    // biome-ignore lint/a11y/useSemanticElements: Card contains nested interactive elements, so div with role="button" is appropriate
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200"
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
      <div className="relative h-48 bg-gray-100">
        <Image
          src={thumbnailSrc}
          alt={`${book.book.title} の書影`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>

      {/* 書籍情報 */}
      <div className="p-4 space-y-3">
        {/* タイトル */}
        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
          {book.book.title}
        </h3>

        {/* 著者 */}
        <p className="text-sm text-gray-600 line-clamp-1">
          {book.book.authors.join(', ')}
        </p>

        {/* 出版社 */}
        {book.book.publisher && (
          <p className="text-xs text-gray-500">
            {book.book.publisher}
          </p>
        )}

        {/* ステータスバッジと評価 */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(book.status)}`}>
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
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleStatusChange}
            className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            aria-label="ステータス変更"
          >
            ステータス変更
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="px-3 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
            aria-label="削除"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}