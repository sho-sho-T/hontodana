'use client'

/**
 * 星評価コンポーネント
 * 1-5星の評価を表示・操作するためのコンポーネント
 */

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Rating, StarRatingProps } from '@/types/rating'

export function StarRating({
  rating,
  onChange,
  readonly = false,
  size = 'md',
  showLabel = true,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  const starSize = sizeClasses[size]
  const displayRating = hoverRating ?? rating

  const handleStarClick = (value: number) => {
    if (readonly || !onChange) return
    // 同じ星をクリックした場合は評価をクリア
    const newRating = rating === value ? null : (value as 1 | 2 | 3 | 4 | 5)
    onChange(newRating)
  }

  const handleStarHover = (value: number | null) => {
    if (readonly) return
    setHoverRating(value)
  }

  const getRatingLabel = (rating: number | null): string => {
    if (rating === null) return '未評価'
    const labels = ['', 'とても悪い', '悪い', '普通', '良い', 'とても良い']
    return labels[rating] || '未評価'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* 星の表示 */}
      <div 
        className="flex items-center gap-1"
        onMouseLeave={() => handleStarHover(null)}
        role={readonly ? 'img' : 'radiogroup'}
        aria-label={readonly ? `評価: ${getRatingLabel(rating)}` : '星評価を選択'}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = displayRating !== null && star <= displayRating
          const isInteractive = !readonly

          return (
            <button
              key={star}
              type="button"
              className={cn(
                'transition-all duration-200',
                starSize,
                isInteractive && 'cursor-pointer hover:scale-110',
                !isInteractive && 'cursor-default'
              )}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              disabled={readonly}
              aria-label={`${star}星`}
              role={readonly ? 'presentation' : 'radio'}
              aria-checked={!readonly && rating === star}
            >
              <svg
                viewBox="0 0 24 24"
                className={cn(
                  'w-full h-full transition-colors duration-200',
                  isActive 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'fill-gray-200 text-gray-200',
                  isInteractive && 'hover:fill-yellow-300 hover:text-yellow-300'
                )}
                aria-hidden="true"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          )
        })}
      </div>

      {/* 評価ラベル */}
      {showLabel && (
        <span 
          className={cn(
            'text-sm font-medium',
            displayRating !== null ? 'text-gray-900' : 'text-gray-500'
          )}
        >
          {getRatingLabel(displayRating)}
        </span>
      )}

      {/* 評価クリア用ボタン（編集モード時のみ） */}
      {!readonly && rating !== null && onChange && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-2 text-xs text-gray-500 hover:text-gray-700 underline"
          aria-label="評価をクリア"
        >
          クリア
        </button>
      )}
    </div>
  )
}

/**
 * 表示専用の星評価コンポーネント（簡易版）
 */
export function StarRatingDisplay({ 
  rating, 
  size = 'sm', 
  className 
}: { 
  rating: Rating
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  return (
    <StarRating
      rating={rating}
      readonly
      size={size}
      showLabel={false}
      className={className}
    />
  )
}