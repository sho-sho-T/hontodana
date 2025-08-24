/**
 * 統計サマリーカードコンポーネント テスト - TDD Red フェーズ
 * P1優先度テストケース: 統計値表示、フォーマット、トレンド表示
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatsSummaryCard } from '@/components/dashboard/StatsSummaryCard'
import { BookIcon, ClockIcon } from '@heroicons/react/24/outline'

describe('StatsSummaryCard', () => {
  // TDD Red フェーズ: P1優先度テストケース - 基本表示
  describe('P1: 統計値表示テスト', () => {
    test('統計値の正しいフォーマット表示', () => {
      render(
        <StatsSummaryCard
          title="総読書時間"
          value={150}
          icon={ClockIcon}
          trend={{
            value: 15,
            direction: 'up',
            period: '先週比'
          }}
          formatter="minutes"
        />
      )

      expect(screen.getByText('2時間30分')).toBeInTheDocument()
      expect(screen.getByText('総読書時間')).toBeInTheDocument()
      expect(screen.getByText('+15%')).toBeInTheDocument()
      expect(screen.getByText('先週比')).toBeInTheDocument()
    })

    test('ページ数のフォーマット表示', () => {
      render(
        <StatsSummaryCard
          title="読書ページ数"
          value={1234}
          formatter="pages"
        />
      )

      expect(screen.getByText('1,234ページ')).toBeInTheDocument()
    })

    test('書籍数のフォーマット表示', () => {
      render(
        <StatsSummaryCard
          title="完読書籍"
          value={10}
          formatter="books"
        />
      )

      expect(screen.getByText('10冊')).toBeInTheDocument()
    })

    test('パーセンテージのフォーマット表示', () => {
      render(
        <StatsSummaryCard
          title="読書一貫性"
          value={0.756}
          formatter="percentage"
        />
      )

      expect(screen.getByText('75.6%')).toBeInTheDocument()
    })

    test('デフォルト値の表示', () => {
      render(
        <StatsSummaryCard
          title="統計値"
          value={42}
        />
      )

      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - トレンド表示
  describe('P1: トレンド表示テスト', () => {
    test('上昇トレンドの表示', () => {
      render(
        <StatsSummaryCard
          title="読書ページ数"
          value={250}
          trend={{
            value: 10,
            direction: 'up',
            period: '先月比'
          }}
        />
      )

      const trendElement = screen.getByTestId('trend-indicator')
      expect(trendElement).toHaveClass('text-green-600')
      expect(screen.getByText('↗')).toBeInTheDocument()
      expect(screen.getByText('+10%')).toBeInTheDocument()
    })

    test('下降トレンドの表示', () => {
      render(
        <StatsSummaryCard
          title="読書ペース"
          value={15}
          trend={{
            value: -5,
            direction: 'down',
            period: '先月比'
          }}
        />
      )

      const trendElement = screen.getByTestId('trend-indicator')
      expect(trendElement).toHaveClass('text-red-600')
      expect(screen.getByText('↘')).toBeInTheDocument()
      expect(screen.getByText('-5%')).toBeInTheDocument()
    })

    test('横ばいトレンドの表示', () => {
      render(
        <StatsSummaryCard
          title="平均読書時間"
          value={45}
          trend={{
            value: 0,
            direction: 'neutral',
            period: '先月比'
          }}
        />
      )

      const trendElement = screen.getByTestId('trend-indicator')
      expect(trendElement).toHaveClass('text-gray-600')
      expect(screen.getByText('→')).toBeInTheDocument()
      expect(screen.getByText('±0%')).toBeInTheDocument()
    })

    test('トレンド情報がない場合', () => {
      render(
        <StatsSummaryCard
          title="読書時間"
          value={120}
        />
      )

      expect(screen.queryByTestId('trend-indicator')).not.toBeInTheDocument()
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - アイコン表示
  describe('P1: アイコン表示テスト', () => {
    test('アイコンの正常表示', () => {
      render(
        <StatsSummaryCard
          title="完読書籍"
          value={5}
          icon={BookIcon}
        />
      )

      expect(screen.getByTestId('card-icon')).toBeInTheDocument()
    })

    test('アイコンなしでの表示', () => {
      render(
        <StatsSummaryCard
          title="統計値"
          value={100}
        />
      )

      expect(screen.queryByTestId('card-icon')).not.toBeInTheDocument()
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - ローディング状態
  describe('P1: ローディング状態テスト', () => {
    test('ローディング状態のスケルトン表示', () => {
      render(<StatsSummaryCard title="読書時間" value={0} isLoading={true} />)

      expect(screen.getByTestId('stats-skeleton')).toBeInTheDocument()
      expect(screen.queryByText('読書時間')).not.toBeInTheDocument()
    })

    test('ローディング完了後の正常表示', () => {
      const { rerender } = render(
        <StatsSummaryCard title="読書時間" value={0} isLoading={true} />
      )

      // ローディング状態
      expect(screen.getByTestId('stats-skeleton')).toBeInTheDocument()

      // ローディング完了
      rerender(<StatsSummaryCard title="読書時間" value={120} isLoading={false} />)

      expect(screen.queryByTestId('stats-skeleton')).not.toBeInTheDocument()
      expect(screen.getByText('読書時間')).toBeInTheDocument()
      expect(screen.getByText('120')).toBeInTheDocument()
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - インタラクション
  describe('P1: インタラクションテスト', () => {
    test('カードクリック時のコールバック', async () => {
      const user = userEvent.setup()
      const mockOnClick = jest.fn()

      render(
        <StatsSummaryCard
          title="総読書時間"
          value={150}
          onClick={mockOnClick}
        />
      )

      const card = screen.getByRole('button', { name: /総読書時間/ })
      await user.click(card)

      expect(mockOnClick).toHaveBeenCalled()
    })

    test('クリック不可能な状態の確認', () => {
      render(
        <StatsSummaryCard
          title="統計値"
          value={100}
          // onClick prop なし
        />
      )

      // button roleがないことを確認
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      
      // article roleで表示されることを確認
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    test('ホバー時のスタイル変更', async () => {
      const user = userEvent.setup()
      const mockOnClick = jest.fn()

      render(
        <StatsSummaryCard
          title="読書ページ数"
          value={350}
          onClick={mockOnClick}
        />
      )

      const card = screen.getByRole('button')
      
      // ホバー前の状態
      expect(card).not.toHaveClass('scale-105')

      // ホバー
      await user.hover(card)
      expect(card).toHaveClass('hover:scale-105')

      // ホバー解除
      await user.unhover(card)
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - アクセシビリティ
  describe('P1: アクセシビリティテスト', () => {
    test('適切なAria属性の設定', () => {
      render(
        <StatsSummaryCard
          title="総読書時間"
          value={150}
          formatter="minutes"
          trend={{
            value: 15,
            direction: 'up',
            period: '先週比'
          }}
        />
      )

      // aria-label で統合的な情報を提供
      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-label', 
        '総読書時間: 2時間30分、先週比15%増加'
      )
    })

    test('スクリーンリーダー向けの説明文', () => {
      render(
        <StatsSummaryCard
          title="完読書籍数"
          value={8}
          formatter="books"
          trend={{
            value: 2,
            direction: 'up',
            period: '今月'
          }}
        />
      )

      // スクリーンリーダー専用テキスト
      const srText = screen.getByText(/完読書籍数は8冊で、今月2冊増加/)
      expect(srText).toHaveClass('sr-only')
    })

    test('カラーコントラストの確保', () => {
      render(
        <StatsSummaryCard
          title="読書時間"
          value={120}
          trend={{
            value: 10,
            direction: 'up',
            period: '先週比'
          }}
        />
      )

      const trendElement = screen.getByTestId('trend-indicator')
      
      // 上昇トレンドの緑色が適切なコントラスト比を持つことを確認
      const styles = getComputedStyle(trendElement)
      expect(styles.color).toBe('rgb(22, 163, 74)') // text-green-600
    })

    test('キーボードナビゲーション対応', async () => {
      const user = userEvent.setup()
      const mockOnClick = jest.fn()

      render(
        <StatsSummaryCard
          title="読書ページ数"
          value={350}
          onClick={mockOnClick}
        />
      )

      const card = screen.getByRole('button')
      
      // Tab キーでフォーカス
      await user.tab()
      expect(card).toHaveFocus()

      // Enter キーで実行
      await user.keyboard('{Enter}')
      expect(mockOnClick).toHaveBeenCalled()

      mockOnClick.mockClear()

      // Space キーで実行
      await user.keyboard(' ')
      expect(mockOnClick).toHaveBeenCalled()
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - エラーハンドリング
  describe('P1: エラーハンドリングテスト', () => {
    test('不正な値での表示', () => {
      render(
        <StatsSummaryCard
          title="読書時間"
          value={NaN}
          formatter="minutes"
        />
      )

      expect(screen.getByText('--')).toBeInTheDocument() // フォールバック表示
    })

    test('負の値での表示', () => {
      render(
        <StatsSummaryCard
          title="統計値"
          value={-10}
          formatter="pages"
        />
      )

      expect(screen.getByText('0ページ')).toBeInTheDocument() // 負の値は0に正規化
    })

    test('無限大値での表示', () => {
      render(
        <StatsSummaryCard
          title="読書速度"
          value={Infinity}
          formatter="pages"
        />
      )

      expect(screen.getByText('--')).toBeInTheDocument() // フォールバック表示
    })

    test('非常に大きな値での表示', () => {
      render(
        <StatsSummaryCard
          title="読書時間"
          value={999999}
          formatter="minutes"
        />
      )

      expect(screen.getByText('16,666時間39分')).toBeInTheDocument() // 正常なフォーマット
    })
  })
})