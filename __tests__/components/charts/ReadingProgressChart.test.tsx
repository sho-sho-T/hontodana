/**
 * 読書進捗チャートコンポーネント テスト - TDD Red フェーズ
 * P2優先度テストケース: チャート描画、データ切り替え、レスポンシブ対応
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReadingProgressChart } from '@/components/charts/ReadingProgressChart'

// Chart.jsのモック
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}))

jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options, ...props }: any) => (
    <canvas
      data-testid="reading-progress-chart"
      aria-label={options?.plugins?.title?.text || 'Reading progress chart'}
      role="img"
      {...props}
    >
      {/* モックキャンバス - 実際のChart.jsの代わり */}
      Chart data: {JSON.stringify(data)}
    </canvas>
  ),
}))

const mockData = [
  { date: '2024-08-18', pagesRead: 20, readingTime: 30, sessionsCount: 1 },
  { date: '2024-08-19', pagesRead: 25, readingTime: 40, sessionsCount: 2 },
  { date: '2024-08-20', pagesRead: 30, readingTime: 45, sessionsCount: 2 }
]

describe('ReadingProgressChart', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // TDD Red フェーズ: P2優先度テストケース - チャート描画
  describe('P2: チャート描画テスト', () => {
    test('ページ数グラフの描画', () => {
      render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
        />
      )

      // Chart.jsコンポーネントの存在確認
      expect(screen.getByTestId('reading-progress-chart')).toBeInTheDocument()
      
      // データポイントの確認（Chart.jsのcanvas要素）
      const canvas = screen.getByRole('img')
      expect(canvas).toBeInTheDocument()
      expect(canvas).toHaveAttribute('aria-label', expect.stringContaining('読書進捗'))
    })

    test('読書時間グラフの描画', () => {
      render(
        <ReadingProgressChart
          data={mockData}
          type="minutes"
          timeRange="week"
        />
      )

      const canvas = screen.getByRole('img')
      expect(canvas).toHaveAttribute('aria-label', expect.stringContaining('読書時間'))
    })

    test('セッション数グラフの描画', () => {
      render(
        <ReadingProgressChart
          data={mockData}
          type="sessions"
          timeRange="week"
        />
      )

      const canvas = screen.getByRole('img')
      expect(canvas).toHaveAttribute('aria-label', expect.stringContaining('セッション'))
    })

    test('チャートのデータ構造確認', () => {
      render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
        />
      )

      const canvas = screen.getByTestId('reading-progress-chart')
      
      // キャンバス要素内のデータ構造を確認
      expect(canvas.textContent).toContain('Chart data:')
      expect(canvas.textContent).toContain('labels')
      expect(canvas.textContent).toContain('datasets')
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - データタイプ切り替え
  describe('P2: データタイプ切り替えテスト', () => {
    test('ページ数表示からの切り替え', async () => {
      const user = userEvent.setup()

      const { rerender } = render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
        />
      )

      // ページ数表示の確認
      expect(screen.getByLabelText(/ページ数/)).toBeInTheDocument()

      // 読書時間に切り替え
      rerender(
        <ReadingProgressChart
          data={mockData}
          type="minutes"
          timeRange="week"
        />
      )

      expect(screen.getByLabelText(/読書時間/)).toBeInTheDocument()
    })

    test('データタイプボタンの存在確認', () => {
      render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
          showTypeSelector={true}
        />
      )

      expect(screen.getByRole('button', { name: 'ページ数' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '読書時間' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'セッション数' })).toBeInTheDocument()
    })

    test('データタイプ切り替えのコールバック', async () => {
      const user = userEvent.setup()
      const mockOnTypeChange = jest.fn()

      render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
          showTypeSelector={true}
          onTypeChange={mockOnTypeChange}
        />
      )

      const minutesButton = screen.getByRole('button', { name: '読書時間' })
      await user.click(minutesButton)

      expect(mockOnTypeChange).toHaveBeenCalledWith('minutes')
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - 期間切り替え
  describe('P2: 期間切り替えテスト', () => {
    test('週間表示から月間表示への切り替え', () => {
      const { rerender } = render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
        />
      )

      // 週間表示の確認
      expect(screen.getByText('過去7日間')).toBeInTheDocument()

      // 月間表示に切り替え
      rerender(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="month"
        />
      )

      expect(screen.getByText('過去30日間')).toBeInTheDocument()
    })

    test('期間セレクターの存在確認', () => {
      render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
          showTimeRangeSelector={true}
        />
      )

      expect(screen.getByRole('button', { name: '1週間' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '1ヶ月' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '3ヶ月' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '1年' })).toBeInTheDocument()
    })

    test('期間変更のコールバック', async () => {
      const user = userEvent.setup()
      const mockOnTimeRangeChange = jest.fn()

      render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
          showTimeRangeSelector={true}
          onTimeRangeChange={mockOnTimeRangeChange}
        />
      )

      const monthButton = screen.getByRole('button', { name: '1ヶ月' })
      await user.click(monthButton)

      expect(mockOnTimeRangeChange).toHaveBeenCalledWith('month')
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - 空データ処理
  describe('P2: 空データ処理テスト', () => {
    test('空データの場合の表示', () => {
      render(
        <ReadingProgressChart
          data={[]}
          type="pages"
          timeRange="week"
        />
      )

      expect(screen.getByText('データがありません')).toBeInTheDocument()
      expect(screen.getByText('読書記録を追加してください')).toBeInTheDocument()
      expect(screen.queryByTestId('reading-progress-chart')).not.toBeInTheDocument()
    })

    test('データがnullの場合の処理', () => {
      render(
        <ReadingProgressChart
          data={null as any}
          type="pages"
          timeRange="week"
        />
      )

      expect(screen.getByText('データがありません')).toBeInTheDocument()
    })

    test('部分的に無効なデータの処理', () => {
      const partialData = [
        { date: '2024-08-18', pagesRead: 20, readingTime: 30, sessionsCount: 1 },
        { date: 'invalid-date', pagesRead: null, readingTime: -5, sessionsCount: undefined },
        { date: '2024-08-20', pagesRead: 30, readingTime: 45, sessionsCount: 2 }
      ]

      render(
        <ReadingProgressChart
          data={partialData as any}
          type="pages"
          timeRange="week"
        />
      )

      // 有効なデータのみでチャートが描画されることを確認
      expect(screen.getByTestId('reading-progress-chart')).toBeInTheDocument()
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - レスポンシブサイズ
  describe('P2: レスポンシブサイズテスト', () => {
    test('モバイル表示でのサイズ調整', () => {
      // モバイルビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true })
      
      const { container } = render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
        />
      )

      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      
      // CSSクラスでレスポンシブ設定が適用されていること
      expect(chartContainer).toHaveClass('w-full')
      expect(chartContainer).toHaveClass('h-64') // モバイルでの高さ
    })

    test('タブレット表示でのサイズ調整', () => {
      // タブレットビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true })
      
      const { container } = render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
        />
      )

      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveClass('md:h-80') // タブレットでの高さ
    })

    test('デスクトップ表示でのサイズ調整', () => {
      // デスクトップビューポートをシミュレート
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
      
      const { container } = render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
        />
      )

      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveClass('lg:h-96') // デスクトップでの高さ
    })

    test('動的リサイズの処理', async () => {
      const { container } = render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
        />
      )

      // ウィンドウサイズ変更をシミュレート
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true })
      window.dispatchEvent(new Event('resize'))

      // リサイズ後のチャート更新を待機
      await waitFor(() => {
        const chartContainer = container.querySelector('[data-testid="chart-container"]')
        expect(chartContainer).toBeInTheDocument()
      })
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - アクセシビリティ
  describe('P2: アクセシビリティテスト', () => {
    test('チャートのAria属性設定', () => {
      render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
        />
      )

      const chart = screen.getByRole('img')
      expect(chart).toHaveAttribute('aria-label', expect.stringContaining('読書進捗'))
      
      // 代替テキスト（スクリーンリーダー用）
      const chartSummary = screen.getByTestId('chart-summary')
      expect(chartSummary).toHaveClass('sr-only')
      expect(chartSummary).toHaveTextContent(/過去.+日間で計.+ページ/)
    })

    test('データテーブルの提供', () => {
      render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
          showDataTable={true}
        />
      )

      // アクセシビリティ向けデータテーブル
      const dataTable = screen.getByRole('table')
      expect(dataTable).toBeInTheDocument()
      expect(dataTable).toHaveClass('sr-only') // スクリーンリーダー専用

      // テーブルヘッダー
      expect(screen.getByRole('columnheader', { name: '日付' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'ページ数' })).toBeInTheDocument()

      // データ行
      const dataRows = screen.getAllByRole('row')
      expect(dataRows.length).toBeGreaterThan(1) // ヘッダー + データ行
    })

    test('キーボードナビゲーション対応', async () => {
      const user = userEvent.setup()

      render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
          showTypeSelector={true}
        />
      )

      // Tab順序の確認
      const buttons = screen.getAllByRole('button')
      
      // 最初のボタンにフォーカス
      await user.tab()
      expect(buttons[0]).toHaveFocus()

      // 次のボタンに移動
      await user.tab()
      expect(buttons[1]).toHaveFocus()
    })

    test('色覚対応のカラーパレット', () => {
      render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
          colorScheme="accessible"
        />
      )

      const chartElement = screen.getByTestId('reading-progress-chart')
      
      // アクセシブルなカラーパレットが設定されていることを確認
      expect(chartElement).toHaveAttribute('data-color-palette', 'accessible')
    })

    test('高コントラストモード対応', () => {
      render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
          highContrast={true}
        />
      )

      const chartElement = screen.getByTestId('reading-progress-chart')
      expect(chartElement).toHaveAttribute('data-high-contrast', 'true')
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - パフォーマンス
  describe('P2: パフォーマンステスト', () => {
    test('大量データでの描画性能', () => {
      // 365日分のデータを作成
      const largeData = []
      for (let i = 0; i < 365; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        largeData.push({
          date: date.toISOString().split('T')[0],
          pagesRead: Math.floor(Math.random() * 50),
          readingTime: Math.floor(Math.random() * 120),
          sessionsCount: Math.floor(Math.random() * 3)
        })
      }

      const startTime = performance.now()
      
      render(
        <ReadingProgressChart
          data={largeData}
          type="pages"
          timeRange="year"
        />
      )
      
      const endTime = performance.now()

      // 描画時間が2秒以内であることを確認
      expect(endTime - startTime).toBeLessThan(2000)
    })

    test('データ更新時の再描画性能', () => {
      const initialData = [
        { date: '2024-08-20', pagesRead: 30, readingTime: 45, sessionsCount: 2 }
      ]

      const { rerender } = render(
        <ReadingProgressChart
          data={initialData}
          type="pages"
          timeRange="week"
        />
      )

      // 大量データに更新
      const updatedData = []
      for (let i = 0; i < 1000; i++) {
        updatedData.push({
          date: `2024-08-${20 - (i % 30)}`,
          pagesRead: 30 + i,
          readingTime: 45 + i,
          sessionsCount: 2
        })
      }

      const startTime = performance.now()
      rerender(
        <ReadingProgressChart
          data={updatedData}
          type="pages"
          timeRange="year"
        />
      )
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000) // 1秒以内の再描画
    })

    test('メモ化による不要な再描画の防止', () => {
      const renderSpy = jest.fn()
      const TestComponent = ({ data }: any) => {
        renderSpy()
        return <ReadingProgressChart data={data} type="pages" timeRange="week" />
      }

      const { rerender } = render(<TestComponent data={mockData} />)

      // 初回描画
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // 同じデータでの再描画（不要な再描画）
      rerender(<TestComponent data={mockData} />)

      // Memoization により再描画が抑制されることを確認
      expect(renderSpy).toHaveBeenCalledTimes(1) // 変化なし
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - エラーハンドリング
  describe('P2: エラーハンドリングテスト', () => {
    test('Chart.js初期化エラーの処理', () => {
      // Chart.jsのエラーをシミュレート
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // 無効な設定でChart.jsエラーを発生させる
      render(
        <ReadingProgressChart
          data={mockData}
          type="invalid" as any
          timeRange="week"
        />
      )

      expect(screen.getByText('チャートの表示でエラーが発生しました')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument()

      consoleError.mockRestore()
    })

    test('データ変換エラーの処理', () => {
      const corruptedData = [
        { invalidStructure: true },
        null,
        undefined
      ]

      render(
        <ReadingProgressChart
          data={corruptedData as any}
          type="pages"
          timeRange="week"
        />
      )

      expect(screen.getByText('データの形式が正しくありません')).toBeInTheDocument()
    })

    test('ブラウザ非対応の場合の処理', () => {
      // Canvas API非対応をシミュレート
      const originalGetContext = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(null)

      render(
        <ReadingProgressChart
          data={mockData}
          type="pages"
          timeRange="week"
        />
      )

      expect(screen.getByText('お使いのブラウザでは')).toBeInTheDocument()
      expect(screen.getByText('チャート機能をサポートしていません')).toBeInTheDocument()

      // 復元
      HTMLCanvasElement.prototype.getContext = originalGetContext
    })

    test('ネットワークエラー時の再試行', async () => {
      const user = userEvent.setup()
      const mockOnRetry = jest.fn()

      render(
        <ReadingProgressChart
          data={[]}
          type="pages"
          timeRange="week"
          error="データの取得に失敗しました"
          onRetry={mockOnRetry}
        />
      )

      const retryButton = screen.getByRole('button', { name: '再試行' })
      await user.click(retryButton)

      expect(mockOnRetry).toHaveBeenCalled()
    })
  })
})