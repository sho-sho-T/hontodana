/**
 * 評価・レビューシステムの統合テスト
 * Server ActionsとUIコンポーネントの連携をテスト
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookRatingEditor } from '@/components/rating/BookRatingEditor'
import { RatingStatsCard } from '@/components/rating/RatingStatsCard'
import * as ratingActions from '@/lib/server-actions/ratings'
import type { Rating, Review, RatingStats } from '@/types/rating'

// Server Actionsをモック
jest.mock('@/lib/server-actions/ratings', () => ({
  updateBookRating: jest.fn(),
  updateBookReview: jest.fn(),
  updateBookRatingAndReview: jest.fn(),
  getUserRatingStats: jest.fn(),
  getBooksWithRatings: jest.fn(),
}))

const mockRatingActions = ratingActions as jest.Mocked<typeof ratingActions>

describe('Rating System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('BookRatingEditor Integration', () => {
    test('should integrate rating and review updates', async () => {
      const user = userEvent.setup()
      const mockUpdate = jest.fn()

      // Server Actionの成功レスポンスをモック
      mockRatingActions.updateBookRating.mockResolvedValue({
        success: true,
        data: { id: 'book-1', rating: 4, review: null },
      } as any)

      mockRatingActions.updateBookReview.mockResolvedValue({
        success: true,
        data: { id: 'book-1', rating: 4, review: 'Great book!' },
      } as any)

      render(
        <BookRatingEditor
          userBookId="book-1"
          bookTitle="Test Book"
          onUpdate={mockUpdate}
        />
      )

      // 星評価をクリック
      const fourthStar = screen.getAllByRole('radio')[3] // 4星目
      fireEvent.click(fourthStar)

      await waitFor(() => {
        expect(mockRatingActions.updateBookRating).toHaveBeenCalledWith('book-1', 4)
        expect(mockUpdate).toHaveBeenCalledWith(4, null)
      })

      // レビューを追加（初期値がnullの場合は既に編集モードなので直接テキストエリアに入力）

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Great book!')

      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockRatingActions.updateBookReview).toHaveBeenCalledWith('book-1', 'Great book!')
        expect(mockUpdate).toHaveBeenCalledWith(4, 'Great book!')
      })
    })

    test('should handle server action errors gracefully', async () => {
      mockRatingActions.updateBookRating.mockResolvedValue({
        success: false,
        error: 'Failed to update rating',
      })

      render(
        <BookRatingEditor
          userBookId="book-1"
          initialRating={null}
        />
      )

      const firstStar = screen.getAllByRole('radio')[0]
      fireEvent.click(firstStar)

      await waitFor(() => {
        expect(screen.getByText('Failed to update rating')).toBeInTheDocument()
      })
    })

    test('should save both rating and review simultaneously', async () => {
      const user = userEvent.setup()

      mockRatingActions.updateBookRating.mockResolvedValue({
        success: true,
        data: { id: 'book-1', rating: 5, review: 'Good book' },
      } as any)

      mockRatingActions.updateBookReview.mockResolvedValue({
        success: true,
        data: { id: 'book-1', rating: 5, review: 'Perfect book!' },
      } as any)

      render(
        <BookRatingEditor
          userBookId="book-1"
          initialRating={3}
          initialReview="Good book"
        />
      )

      // 評価を変更
      const fifthStar = screen.getAllByRole('radio')[4] // 5星目
      fireEvent.click(fifthStar)

      await waitFor(() => {
        expect(mockRatingActions.updateBookRating).toHaveBeenCalledWith('book-1', 5)
      })

      // レビューを編集
      const editButton = screen.getByText('編集')
      fireEvent.click(editButton)

      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, 'Perfect book!')

      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockRatingActions.updateBookReview).toHaveBeenCalledWith('book-1', 'Perfect book!')
      })
    })
  })

  describe('RatingStatsCard Integration', () => {
    test('should display stats correctly', () => {
      const mockStats: RatingStats = {
        averageRating: 4.3,
        totalRated: 12,
        totalBooks: 15,
        distribution: { 1: 0, 2: 1, 3: 2, 4: 4, 5: 5 },
        reviewsCount: 8,
      }

      render(<RatingStatsCard stats={mockStats} />)

      // 基本統計
      expect(screen.getByText('15')).toBeInTheDocument() // 総書籍数
      expect(screen.getByText('12')).toBeInTheDocument() // 評価済み
      expect(screen.getByText('4.3')).toBeInTheDocument() // 平均評価

      // パーセンテージ計算
      expect(screen.getByText('評価済み (80%)')).toBeInTheDocument() // 12/15 = 80%
      expect(screen.getByText('レビュー済み (53%)')).toBeInTheDocument() // 8/15 = 53%

      // 評価分布
      expect(screen.getByText('0冊')).toBeInTheDocument() // 1星
      expect(screen.getByText('1冊')).toBeInTheDocument() // 2星
      expect(screen.getByText('2冊')).toBeInTheDocument() // 3星
      expect(screen.getByText('4冊')).toBeInTheDocument() // 4星
      expect(screen.getByText('5冊')).toBeInTheDocument() // 5星
    })

    test('should show loading state', () => {
      render(<RatingStatsCard stats={null} loading />)
      
      // スケルトンが表示される
      const card = document.querySelector('[data-slot="card"]')
      expect(card).toBeInTheDocument()
    })

    test('should show error state', () => {
      render(<RatingStatsCard stats={null} />)
      
      expect(screen.getByText('評価データを読み込めませんでした')).toBeInTheDocument()
    })
  })

  describe('Rating System Workflow', () => {
    test('should handle complete rating workflow', async () => {
      const user = userEvent.setup()

      // 初期状態: 評価なし
      mockRatingActions.updateBookRating.mockResolvedValue({
        success: true,
        data: { id: 'book-1', rating: 4, review: null },
      } as any)

      mockRatingActions.updateBookReview.mockResolvedValue({
        success: true,
        data: { id: 'book-1', rating: 4, review: 'Good read' },
      } as any)

      render(
        <div>
          <BookRatingEditor userBookId="book-1" />
        </div>
      )

      // Step 1: 星評価を設定
      const fourthStar = screen.getAllByRole('radio')[3]
      fireEvent.click(fourthStar)

      await waitFor(() => {
        expect(mockRatingActions.updateBookRating).toHaveBeenCalledWith('book-1', 4)
        expect(screen.getByText('評価を更新しました')).toBeInTheDocument()
      })

      // Step 2: レビューを追加
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Good read')

      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockRatingActions.updateBookReview).toHaveBeenCalledWith('book-1', 'Good read')
        expect(screen.getByText('レビューを更新しました')).toBeInTheDocument()
      })

      // メッセージが自動的に消える（3秒後）
      await waitFor(() => {
        expect(screen.queryByText('レビューを更新しました')).not.toBeInTheDocument()
      }, { timeout: 4000 })
    })

    test('should validate inputs correctly', async () => {
      const user = userEvent.setup()

      render(<BookRatingEditor userBookId="book-1" />)

      // 無効な文字数のレビューを入力
      const textarea = screen.getByRole('textbox')
      const longText = 'a'.repeat(2001) // 制限を超える
      await user.type(textarea, longText)

      const saveButton = screen.getByText('保存')
      expect(saveButton).toBeDisabled()
      
      expect(screen.getByText(/2000文字以下で入力してください/)).toBeInTheDocument()
    })
  })

  describe('Data Consistency', () => {
    test('should maintain data consistency across operations', async () => {
      let currentRating: Rating = null
      let currentReview: Review = null

      const handleUpdate = (rating: Rating, review: Review) => {
        currentRating = rating
        currentReview = review
      }

      mockRatingActions.updateBookRatingAndReview.mockImplementation(async (userBookId, rating, review) => {
        // データの整合性を確認
        expect(typeof userBookId).toBe('string')
        expect(rating === null || (typeof rating === 'number' && rating >= 1 && rating <= 5)).toBe(true)
        expect(review === null || typeof review === 'string').toBe(true)

        return {
          success: true,
          data: { id: userBookId, rating, review },
        } as any
      })

      render(
        <BookRatingEditor
          userBookId="test-book"
          onUpdate={handleUpdate}
        />
      )

      // 複数の更新操作を実行
      const thirdStar = screen.getAllByRole('radio')[2]
      fireEvent.click(thirdStar)

      // 操作後にデータが正しく更新されているか確認
      await waitFor(() => {
        expect(currentRating).toBe(3)
      })
    })
  })
})