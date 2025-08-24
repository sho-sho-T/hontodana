/**
 * 読書ダッシュボードコンポーネント テスト - TDD Red フェーズ
 * P1優先度テストケース: ダッシュボード表示、統計カード、エラーハンドリング
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReadingDashboard } from '@/components/dashboard/ReadingDashboard'

// モックデータ
const mockStatsData = {
  totalReadingTime: 150,
  averageSessionTime: 45,
  totalPagesRead: 350,
  booksCompleted: 5,
  booksInProgress: 3,
  totalCompletedPages: 1200,
  averageBookLength: 240,
  dailyStats: [
    { date: '2024-08-20', pagesRead: 30, readingTime: 45, sessionsCount: 2 },
    { date: '2024-08-19', pagesRead: 25, readingTime: 40, sessionsCount: 1 },
    { date: '2024-08-18', pagesRead: 20, readingTime: 30, sessionsCount: 1 }
  ],
  weeklyStats: [
    { week: '2024-W34', pagesRead: 150, readingTime: 200, sessionsCount: 8 },
    { week: '2024-W33', pagesRead: 120, readingTime: 180, sessionsCount: 6 }
  ],
  readingPace: { last7Days: 25, last30Days: 20 },
  readingConsistency: 0.75,
  averagePagesPerDay: 15,
  averagePagesPerSession: 22
}

// モック関数
const mockOnTimeRangeChange = jest.fn()
const mockOnRefresh = jest.fn()

describe('ReadingDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // フェッチAPIをモック
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // TDD Red フェーズ: P1優先度テストケース - 基本表示
  describe('P1: ダッシュボード基本表示テスト', () => {
    test('統計データが正常に表示される', () => {
      render(<ReadingDashboard userId="test-user" statsData={mockStatsData} />)

      expect(screen.getByText('2時間30分')).toBeInTheDocument() // totalReadingTime
      expect(screen.getByText('350ページ')).toBeInTheDocument() // totalPagesRead
      expect(screen.getByText('5冊')).toBeInTheDocument() // booksCompleted
      expect(screen.getByText('3冊')).toBeInTheDocument() // booksInProgress
    })

    test('ローディング状態の表示', () => {
      render(<ReadingDashboard userId="test-user" isLoading={true} />)

      // スケルトンローディングの確認
      expect(screen.getAllByTestId('stats-skeleton')).toHaveLength(4)
      expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument()
    })

    test('エラー状態のフォールバック表示', () => {
      const errorMessage = 'データの取得に失敗しました'
      render(
        <ReadingDashboard 
          userId="test-user" 
          error={errorMessage}
        />
      )

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument()
    })

    test('データが存在しない場合の表示', () => {
      const emptyStatsData = {
        ...mockStatsData,
        totalReadingTime: 0,
        totalPagesRead: 0,
        booksCompleted: 0,
        booksInProgress: 0,
        dailyStats: []
      }

      render(<ReadingDashboard userId="test-user" statsData={emptyStatsData} />)

      expect(screen.getByText('まだ読書記録がありません')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '読書記録を追加' })).toBeInTheDocument()
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - ユーザーインタラクション
  describe('P1: ユーザーインタラクションテスト', () => {
    test('時間範囲の切り替え', async () => {
      const user = userEvent.setup()

      render(
        <ReadingDashboard 
          userId="test-user" 
          statsData={mockStatsData}
          onTimeRangeChange={mockOnTimeRangeChange}
        />
      )

      const weekButton = screen.getByRole('button', { name: '1週間' })
      const monthButton = screen.getByRole('button', { name: '1ヶ月' })

      await user.click(monthButton)
      expect(mockOnTimeRangeChange).toHaveBeenCalledWith('month')

      await user.click(weekButton)
      expect(mockOnTimeRangeChange).toHaveBeenCalledWith('week')
    })

    test('データ更新ボタンの動作', async () => {
      const user = userEvent.setup()

      render(
        <ReadingDashboard 
          userId="test-user" 
          statsData={mockStatsData}
          onRefresh={mockOnRefresh}
        />
      )

      const refreshButton = screen.getByRole('button', { name: '更新' })
      await user.click(refreshButton)

      expect(mockOnRefresh).toHaveBeenCalled()
    })

    test('エラー状態からの復旧操作', async () => {
      const user = userEvent.setup()
      const mockRetry = jest.fn()

      render(
        <ReadingDashboard 
          userId="test-user" 
          error="データの取得に失敗しました"
          onRetry={mockRetry}
        />
      )

      const retryButton = screen.getByRole('button', { name: '再試行' })
      await user.click(retryButton)

      expect(mockRetry).toHaveBeenCalled()
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - レスポンシブデザイン
  describe('P1: レスポンシブデザインテスト', () => {
    test('モバイル表示での統計カード配置', () => {
      // モバイルビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true })
      
      render(<ReadingDashboard userId="test-user" statsData={mockStatsData} />)

      const container = screen.getByTestId('dashboard-container')
      expect(container).toHaveClass('grid-cols-1')
    })

    test('タブレット表示での統計カード配置', () => {
      // タブレットビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true })
      
      render(<ReadingDashboard userId="test-user" statsData={mockStatsData} />)

      const container = screen.getByTestId('dashboard-container')
      expect(container).toHaveClass('md:grid-cols-2')
    })

    test('デスクトップ表示での統計カード配置', () => {
      // デスクトップビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
      
      render(<ReadingDashboard userId="test-user" statsData={mockStatsData} />)

      const container = screen.getByTestId('dashboard-container')
      expect(container).toHaveClass('lg:grid-cols-4')
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - データ更新処理
  describe('P1: データ更新処理テスト', () => {
    test('プロパティ変更時の再描画', () => {
      const { rerender } = render(
        <ReadingDashboard userId="test-user" statsData={mockStatsData} />
      )

      // 初期値の確認
      expect(screen.getByText('5冊')).toBeInTheDocument()

      // データ更新
      const updatedStatsData = { ...mockStatsData, booksCompleted: 7 }
      rerender(<ReadingDashboard userId="test-user" statsData={updatedStatsData} />)

      // 更新値の確認
      expect(screen.getByText('7冊')).toBeInTheDocument()
      expect(screen.queryByText('5冊')).not.toBeInTheDocument()
    })

    test('ローディング状態の適切な管理', () => {
      const { rerender } = render(
        <ReadingDashboard userId="test-user" isLoading={true} />
      )

      // ローディング状態の確認
      expect(screen.getByTestId('stats-skeleton')).toBeInTheDocument()

      // データ取得完了後
      rerender(
        <ReadingDashboard userId="test-user" statsData={mockStatsData} isLoading={false} />
      )

      // ローディング終了の確認
      expect(screen.queryByTestId('stats-skeleton')).not.toBeInTheDocument()
      expect(screen.getByText('2時間30分')).toBeInTheDocument()
    })

    test('エラー状態とローディング状態の競合処理', () => {
      render(
        <ReadingDashboard 
          userId="test-user" 
          isLoading={true}
          error="エラーが発生しました"
        />
      )

      // エラーがローディングより優先されることを確認
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
      expect(screen.queryByTestId('stats-skeleton')).not.toBeInTheDocument()
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - パフォーマンス
  describe('P1: パフォーマンステスト', () => {
    test('大量データでの描画性能', () => {
      // 大量の日別統計データを作成
      const largeDailyStats = Array.from({ length: 365 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pagesRead: Math.floor(Math.random() * 50),
        readingTime: Math.floor(Math.random() * 120),
        sessionsCount: Math.floor(Math.random() * 3)
      }))

      const largeStatsData = {
        ...mockStatsData,
        dailyStats: largeDailyStats
      }

      const startTime = performance.now()
      render(<ReadingDashboard userId="test-user" statsData={largeStatsData} />)
      const endTime = performance.now()

      // 描画時間が1秒以内であることを確認
      expect(endTime - startTime).toBeLessThan(1000)
    })

    test('不要な再描画の防止', () => {
      const renderSpy = jest.fn()
      const TestComponent = ({ statsData }: any) => {
        renderSpy()
        return <ReadingDashboard userId="test-user" statsData={statsData} />
      }

      const { rerender } = render(<TestComponent statsData={mockStatsData} />)

      // 初回描画
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // 同じデータでの再描画（不要な再描画）
      rerender(<TestComponent statsData={mockStatsData} />)

      // Memoization により再描画が抑制されることを確認
      expect(renderSpy).toHaveBeenCalledTimes(1) // 変化なし
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - エラーハンドリング
  describe('P1: エラーハンドリングテスト', () => {
    test('ネットワークエラーの適切な表示', () => {
      render(
        <ReadingDashboard 
          userId="test-user" 
          error="ネットワークエラーが発生しました"
          errorType="network"
        />
      )

      expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument()
      expect(screen.getByText('オフライン対応')).toBeInTheDocument() // オフライン機能のヒント
    })

    test('サーバーエラーの適切な表示', () => {
      render(
        <ReadingDashboard 
          userId="test-user" 
          error="サーバーでエラーが発生しました"
          errorType="server"
        />
      )

      expect(screen.getByText('サーバーでエラーが発生しました')).toBeInTheDocument()
      expect(screen.getByText('しばらく時間をおいてから再試行してください')).toBeInTheDocument()
    })

    test('部分的なデータエラーの処理', async () => {
      // 統計データは取得できるがチャートデータが取得できない状況
      const partialStatsData = {
        ...mockStatsData,
        dailyStats: [] // チャート用データが空
      }

      render(<ReadingDashboard userId="test-user" statsData={partialStatsData} />)

      // 統計サマリーは表示される
      expect(screen.getByText('2時間30分')).toBeInTheDocument()
      
      // チャート部分はエラー表示
      expect(screen.getByText('チャートデータがありません')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'チャートを再読み込み' })).toBeInTheDocument()
    })

    test('権限エラーの処理', () => {
      render(
        <ReadingDashboard 
          userId="test-user" 
          error="アクセス権限がありません"
          errorType="authorization"
        />
      )

      expect(screen.getByText('アクセス権限がありません')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
    })
  })
})