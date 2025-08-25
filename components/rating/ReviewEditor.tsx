'use client'

/**
 * レビュー編集コンポーネント
 * テキストレビューの作成・編集・表示を行うコンポーネント
 */

import type React from 'react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ReviewEditorProps } from '@/types/rating'

const MAX_REVIEW_LENGTH = 2000

export function ReviewEditor({
  review,
  onSave,
  onCancel,
  readonly = false,
  placeholder = 'この本の感想や印象を自由に書いてください...',
  className,
}: ReviewEditorProps) {
  const [isEditing, setIsEditing] = useState(!readonly && review === null)
  const [currentReview, setCurrentReview] = useState(review || '')
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [currentReview, adjustTextareaHeight])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const handleEdit = () => {
    setCurrentReview(review || '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!onSave) return

    setIsSaving(true)
    try {
      const trimmedReview = currentReview.trim()
      const finalReview = trimmedReview || null
      await onSave(finalReview)
      setIsEditing(false)
    } catch (error) {
      // エラーハンドリングは親コンポーネントで行う
      console.error('Failed to save review:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setCurrentReview(review || '')
    setIsEditing(false)
    onCancel?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const characterCount = currentReview.length
  const isOverLimit = characterCount > MAX_REVIEW_LENGTH
  const hasChanges = currentReview !== (review || '')

  // 表示モード
  if (!isEditing) {
    return (
      <div className={cn('space-y-3', className)}>
        {review ? (
          <div className="space-y-2">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {review}
              </p>
            </div>
            {!readonly && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="text-xs"
                >
                  編集
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSave?.(null)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  削除
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-500 text-sm italic">
              まだレビューが書かれていません
            </p>
            {!readonly && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="text-xs"
              >
                レビューを書く
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  // 編集モード
  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-2">
        <label htmlFor="review-textarea" className="block text-sm font-medium text-gray-700">
          レビュー
        </label>
        <div className="relative">
          <textarea
            id="review-textarea"
            ref={textareaRef}
            value={currentReview}
            onChange={(e) => setCurrentReview(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'w-full min-h-[100px] px-3 py-2 border rounded-md text-sm resize-none',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'placeholder:text-gray-400',
              isOverLimit 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300'
            )}
            maxLength={MAX_REVIEW_LENGTH + 100} // 少し余裕を持たせる
            disabled={isSaving}
            aria-describedby="character-count"
          />
        </div>
        
        {/* 文字数カウンタ */}
        <div className="flex justify-between items-center text-xs">
          <span
            id="character-count"
            className={cn(
              'font-medium',
              isOverLimit ? 'text-red-600' : 'text-gray-500'
            )}
          >
            {characterCount} / {MAX_REVIEW_LENGTH}
          </span>
          <span className="text-gray-400">
            Ctrl+Enter で保存、Esc でキャンセル
          </span>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={isSaving || isOverLimit || !hasChanges}
          size="sm"
          className="text-xs"
        >
          {isSaving ? '保存中...' : '保存'}
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
          size="sm"
          className="text-xs"
        >
          キャンセル
        </Button>
      </div>

      {/* エラーメッセージ */}
      {isOverLimit && (
        <p className="text-red-600 text-xs">
          レビューは{MAX_REVIEW_LENGTH}文字以下で入力してください
        </p>
      )}
    </div>
  )
}

/**
 * シンプルなレビュー表示コンポーネント（表示専用）
 */
export function ReviewDisplay({ 
  review, 
  maxLength,
  className 
}: { 
  review: string | null
  maxLength?: number
  className?: string 
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!review) {
    return (
      <p className={cn('text-gray-500 text-sm italic', className)}>
        レビューなし
      </p>
    )
  }

  const shouldTruncate = maxLength && review.length > maxLength
  const displayText = shouldTruncate && !isExpanded 
    ? `${review.slice(0, maxLength)}...` 
    : review

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-gray-900 text-sm whitespace-pre-wrap leading-relaxed">
        {displayText}
      </p>
      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-xs underline"
        >
          {isExpanded ? '折りたたむ' : '続きを読む'}
        </button>
      )}
    </div>
  )
}