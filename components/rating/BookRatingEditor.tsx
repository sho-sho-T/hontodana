'use client'

/**
 * 書籍評価・レビュー編集統合コンポーネント
 * 星評価とレビューを同時に編集できるコンポーネント
 */

import React, { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StarRating } from './StarRating'
import { ReviewEditor } from './ReviewEditor'
import { updateBookRating, updateBookReview, updateBookRatingAndReview } from '@/lib/server-actions/ratings'
import type { Rating, Review } from '@/types/rating'

interface BookRatingEditorProps {
  userBookId: string
  initialRating?: Rating
  initialReview?: Review
  bookTitle?: string
  onUpdate?: (rating: Rating, review: Review) => void
  className?: string
}

export function BookRatingEditor({
  userBookId,
  initialRating = null,
  initialReview = null,
  bookTitle,
  onUpdate,
  className,
}: BookRatingEditorProps) {
  const [rating, setRating] = useState<Rating>(initialRating)
  const [review, setReview] = useState<Review>(initialReview)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasChanges = rating !== initialRating || review !== initialReview

  const showMessage = (message: string, isError = false) => {
    if (isError) {
      setError(message)
      setSuccess(null)
    } else {
      setSuccess(message)
      setError(null)
    }
    
    // 3秒後にメッセージを消去
    setTimeout(() => {
      setError(null)
      setSuccess(null)
    }, 3000)
  }

  const handleRatingChange = async (newRating: Rating) => {
    setRating(newRating)
    
    if (!hasChanges && newRating === initialRating) return

    startTransition(async () => {
      try {
        const result = await updateBookRating(userBookId, newRating)
        if (result.success) {
          showMessage('評価を更新しました')
          onUpdate?.(newRating, review)
        } else {
          setRating(initialRating) // 元に戻す
          showMessage(result.error || '評価の更新に失敗しました', true)
        }
      } catch {
        setRating(initialRating) // 元に戻す
        showMessage('評価の更新中にエラーが発生しました', true)
      }
    })
  }

  const handleReviewSave = async (newReview: Review) => {
    startTransition(async () => {
      try {
        const result = await updateBookReview(userBookId, newReview)
        if (result.success) {
          setReview(newReview)
          showMessage('レビューを更新しました')
          onUpdate?.(rating, newReview)
        } else {
          showMessage(result.error || 'レビューの更新に失敗しました', true)
        }
      } catch {
        showMessage('レビューの更新中にエラーが発生しました', true)
      }
    })
  }

  const handleSaveAll = async () => {
    if (!hasChanges) return

    startTransition(async () => {
      try {
        const result = await updateBookRatingAndReview(userBookId, rating, review)
        if (result.success) {
          showMessage('評価とレビューを更新しました')
          onUpdate?.(rating, review)
        } else {
          showMessage(result.error || '更新に失敗しました', true)
        }
      } catch {
        showMessage('更新中にエラーが発生しました', true)
      }
    })
  }

  const handleReset = () => {
    setRating(initialRating)
    setReview(initialReview)
    setError(null)
    setSuccess(null)
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-lg">
          {bookTitle ? `「${bookTitle}」の評価・レビュー` : '評価・レビュー'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 星評価セクション */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">評価</h3>
          <StarRating
            rating={rating}
            onChange={handleRatingChange}
            size="lg"
            className="justify-start"
          />
        </div>

        {/* レビューセクション */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">レビュー</h3>
          <ReviewEditor
            review={review}
            onSave={handleReviewSave}
            placeholder="この本の感想や印象を自由に書いてください..."
          />
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {hasChanges && (
              <>
                <Button
                  onClick={handleSaveAll}
                  disabled={isPending}
                  size="sm"
                >
                  {isPending ? '保存中...' : 'すべて保存'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isPending}
                  size="sm"
                >
                  リセット
                </Button>
              </>
            )}
          </div>

          {/* 保存状態の表示 */}
          <div className="text-xs text-gray-500">
            {isPending && (
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                更新中...
              </span>
            )}
            {!hasChanges && !isPending && (
              <span>保存済み</span>
            )}
          </div>
        </div>

        {/* メッセージ表示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 表示専用の書籍評価・レビューカード
 */
interface BookRatingDisplayProps {
  rating: Rating
  review: Review
  bookTitle?: string
  reviewDate?: Date
  className?: string
}

export function BookRatingDisplay({
  rating,
  review,
  bookTitle,
  reviewDate,
  className,
}: BookRatingDisplayProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-lg">
          {bookTitle ? `「${bookTitle}」の評価・レビュー` : '評価・レビュー'}
        </CardTitle>
        {reviewDate && (
          <p className="text-sm text-gray-500">
            {reviewDate.toLocaleDateString('ja-JP')} 更新
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 星評価 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">評価</h3>
          <StarRating
            rating={rating}
            readonly
            size="md"
          />
        </div>

        {/* レビュー */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">レビュー</h3>
          {review ? (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {review}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              レビューはありません
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}