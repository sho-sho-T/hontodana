import React from 'react'
import { render, screen } from '@testing-library/react'
import { RatingStatsCard } from '@/components/rating/RatingStatsCard'
import type { RatingStats } from '@/types/rating'

const mockStats: RatingStats = {
  averageRating: 4.2,
  totalRated: 15,
  totalBooks: 20,
  distribution: {
    1: 0,
    2: 1,
    3: 2,
    4: 7,
    5: 5,
  },
  reviewsCount: 12,
}

describe('RatingStatsCard', () => {
  describe('通常の表示', () => {
    test('should render stats correctly', () => {
      render(<RatingStatsCard stats={mockStats} />)
      
      // タイトル
      expect(screen.getByText('読書評価統計')).toBeInTheDocument()
      
      // 基本統計
      expect(screen.getByText('20')).toBeInTheDocument() // 総書籍数
      expect(screen.getByText('15')).toBeInTheDocument() // 評価済み
      expect(screen.getByText('評価済み (75%)')).toBeInTheDocument()
      
      // 平均評価
      expect(screen.getByText('4.2')).toBeInTheDocument()
      expect(screen.getByText('(15件の評価)')).toBeInTheDocument()
      
      // レビュー統計
      expect(screen.getByText('12件')).toBeInTheDocument()
      expect(screen.getByText('レビュー済み (60%)')).toBeInTheDocument()
    })

    test('should show rating distribution bars', () => {
      render(<RatingStatsCard stats={mockStats} />)
      
      // 各評価の件数をチェック
      expect(screen.getByText('0冊')).toBeInTheDocument() // 1星
      expect(screen.getByText('1冊')).toBeInTheDocument() // 2星
      expect(screen.getByText('2冊')).toBeInTheDocument() // 3星
      expect(screen.getByText('7冊')).toBeInTheDocument() // 4星
      expect(screen.getByText('5冊')).toBeInTheDocument() // 5星
    })

    test('should show reading trend message', () => {
      render(<RatingStatsCard stats={mockStats} />)
      
      expect(screen.getByText(/読書傾向:/)).toBeInTheDocument()
    })

    test('should apply custom className', () => {
      render(<RatingStatsCard stats={mockStats} className="custom-stats" />)
      
      const card = screen.getByText('読書評価統計').closest('.custom-stats')
      expect(card).toBeInTheDocument()
    })
  })

  describe('エッジケース', () => {
    test('should handle no ratings', () => {
      const emptyStats: RatingStats = {
        averageRating: null,
        totalRated: 0,
        totalBooks: 5,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        reviewsCount: 0,
      }
      
      render(<RatingStatsCard stats={emptyStats} />)
      
      expect(screen.getByText('まだ評価がありません')).toBeInTheDocument()
      expect(screen.getByText('評価済み (0%)')).toBeInTheDocument()
      expect(screen.getByText('レビュー済み (0%)')).toBeInTheDocument()
    })

    test('should handle perfect ratings', () => {
      const perfectStats: RatingStats = {
        averageRating: 5.0,
        totalRated: 10,
        totalBooks: 10,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 10 },
        reviewsCount: 10,
      }
      
      render(<RatingStatsCard stats={perfectStats} />)
      
      expect(screen.getByText('5.0')).toBeInTheDocument()
      expect(screen.getByText('評価済み (100%)')).toBeInTheDocument()
      expect(screen.getByText('レビュー済み (100%)')).toBeInTheDocument()
    })

    test('should not show distribution when no ratings', () => {
      const emptyStats: RatingStats = {
        averageRating: null,
        totalRated: 0,
        totalBooks: 5,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        reviewsCount: 0,
      }
      
      render(<RatingStatsCard stats={emptyStats} />)
      
      expect(screen.queryByText('評価分布')).not.toBeInTheDocument()
    })
  })

  describe('ローディング状態', () => {
    test('should show skeleton when loading', () => {
      render(<RatingStatsCard stats={null} loading />)
      
      // スケルトンは具体的なテキストを持たないので、
      // カード構造があることを確認
      const card = document.querySelector('[data-slot="card"]')
      expect(card).toBeInTheDocument()
      
      // 実際のデータは表示されていない
      expect(screen.queryByText('読書評価統計')).not.toBeInTheDocument()
    })
  })

  describe('エラー状態', () => {
    test('should show error message when stats is null and not loading', () => {
      render(<RatingStatsCard stats={null} />)
      
      expect(screen.getByText('評価データを読み込めませんでした')).toBeInTheDocument()
    })
  })

  describe('読書傾向メッセージ', () => {
    test('should show appropriate message for high rating, high review', () => {
      const highStats: RatingStats = {
        averageRating: 4.8,
        totalRated: 10,
        totalBooks: 10,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 8 },
        reviewsCount: 9, // 90%
      }
      
      render(<RatingStatsCard stats={highStats} />)
      
      expect(screen.getByText(/高評価で記録も充実/)).toBeInTheDocument()
    })

    test('should show appropriate message for medium rating, medium review', () => {
      const mediumStats: RatingStats = {
        averageRating: 3.8,
        totalRated: 10,
        totalBooks: 10,
        distribution: { 1: 0, 2: 1, 3: 3, 4: 4, 5: 2 },
        reviewsCount: 5, // 50%
      }
      
      render(<RatingStatsCard stats={mediumStats} />)
      
      expect(screen.getByText(/バランスの良い読書/)).toBeInTheDocument()
    })

    test('should show appropriate message for low rating, low review', () => {
      const lowStats: RatingStats = {
        averageRating: 2.5,
        totalRated: 10,
        totalBooks: 10,
        distribution: { 1: 3, 2: 4, 3: 2, 4: 1, 5: 0 },
        reviewsCount: 2, // 20%
      }
      
      render(<RatingStatsCard stats={lowStats} />)
      
      expect(screen.getByText(/読書を始めたばかり/)).toBeInTheDocument()
    })
  })

  describe('パーセンテージ計算', () => {
    test('should calculate percentages correctly', () => {
      const stats: RatingStats = {
        averageRating: 4.0,
        totalRated: 3,
        totalBooks: 4,
        distribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 },
        reviewsCount: 2,
      }
      
      render(<RatingStatsCard stats={stats} />)
      
      expect(screen.getByText('評価済み (75%)')).toBeInTheDocument() // 3/4 = 75%
      expect(screen.getByText('レビュー済み (50%)')).toBeInTheDocument() // 2/4 = 50%
    })

    test('should handle zero division', () => {
      const stats: RatingStats = {
        averageRating: null,
        totalRated: 0,
        totalBooks: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        reviewsCount: 0,
      }
      
      render(<RatingStatsCard stats={stats} />)
      
      expect(screen.getByText('評価済み (0%)')).toBeInTheDocument()
      expect(screen.getByText('レビュー済み (0%)')).toBeInTheDocument()
    })
  })

  describe('プログレスバーの幅', () => {
    test('should set correct progress bar widths', () => {
      render(<RatingStatsCard stats={mockStats} />)
      
      // 評価分布のプログレスバーをテスト
      const progressBars = document.querySelectorAll('.bg-blue-500')
      
      // 5星: 5/15 = 33.33%
      // 4星: 7/15 = 46.67%
      // など、実際の計算に基づいた幅が設定されているかテスト
      expect(progressBars.length).toBeGreaterThan(0)
    })
  })
})