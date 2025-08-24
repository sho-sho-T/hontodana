/**
 * 書籍分布チャートコンポーネント テスト - TDD Red フェーズ
 * P2優先度テストケース: ドーナツ/棒グラフ表示、分布データ、アクセシビリティ
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookDistributionChart } from '@/components/charts/BookDistributionChart'

// Chart.jsのモック
jest.mock('react-chartjs-2', () => ({
  Doughnut: ({ data, options, ...props }: any) => (
    <canvas
      data-testid="distribution-chart"
      aria-label={options?.plugins?.title?.text || 'Book distribution chart'}
      role="img"
      data-chart-type="doughnut"
      {...props}
    >
      Doughnut Chart: {JSON.stringify(data)}
    </canvas>
  ),
  Bar: ({ data, options, ...props }: any) => (
    <canvas
      data-testid="distribution-chart"
      aria-label={options?.plugins?.title?.text || 'Book distribution chart'}
      role="img"
      data-chart-type="bar"
      {...props}
    >
      Bar Chart: {JSON.stringify(data)}
    </canvas>
  ),
}))

const mockDistributionData = {
  physical: 15,
  kindle: 20,
  epub: 8,
  audiobook: 5,
  other: 2
}

const mockStatusData = {
  want_to_read: 10,
  reading: 5,
  completed: 25,
  paused: 2,
  abandoned: 1
}

describe('BookDistributionChart', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // TDD Red フェーズ: P2優先度テストケース - ドーナツチャート表示
  describe('P2: ドーナツチャート表示テスト', () => {
    test('書籍タイプ分布のドーナツチャート描画', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          dataType="bookType"
        />
      )

      expect(screen.getByTestId('distribution-chart')).toBeInTheDocument()
      expect(screen.getByRole('img')).toHaveAttribute('data-chart-type', 'doughnut')
      
      // 凡例の表示確認
      expect(screen.getByText('物理書籍')).toBeInTheDocument()
      expect(screen.getByText('Kindle')).toBeInTheDocument()
      expect(screen.getByText('15冊')).toBeInTheDocument()
      expect(screen.getByText('20冊')).toBeInTheDocument()
    })

    test('ドーナツチャートの中央統計表示', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          showCenterStats={true}
        />
      )

      // 中央に総数表示
      expect(screen.getByText('50冊')).toBeInTheDocument() // 15+20+8+5+2
      expect(screen.getByText('総書籍数')).toBeInTheDocument()
    })

    test('ドーナツチャートのカスタムカラー', () => {
      const customColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
      
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          colors={customColors}
        />
      )

      const chart = screen.getByTestId('distribution-chart')
      expect(chart).toHaveAttribute('data-custom-colors', 'true')
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - 棒グラフ表示
  describe('P2: 棒グラフ表示テスト', () => {
    test('横棒グラフの表示切り替え', () => {
      const { rerender } = render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
        />
      )

      // ドーナツチャートが表示されていることを確認
      expect(screen.getByRole('img')).toHaveAttribute('data-chart-type', 'doughnut')

      // 横棒グラフに切り替え
      rerender(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="bar"
        />
      )

      // チャートタイプが変更されていることを確認
      expect(screen.getByRole('img')).toHaveAttribute('data-chart-type', 'bar')
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringContaining('横棒'))
    })

    test('棒グラフの値ラベル表示', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="bar"
          showValues={true}
        />
      )

      // 各棒グラフに値が表示されていることを確認
      expect(screen.getByText('15')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
    })

    test('棒グラフのソート機能', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="bar"
          sortBy="value"
          sortOrder="desc"
        />
      )

      // 値の降順でソートされた凡例の確認
      const legendItems = screen.getAllByTestId('legend-item')
      expect(legendItems[0]).toHaveTextContent('Kindle (20冊)') // 最大値が最初
      expect(legendItems[1]).toHaveTextContent('物理書籍 (15冊)') // 次に大きい値
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - 読書状態分布
  describe('P2: 読書状態分布テスト', () => {
    test('読書状態別分布の表示', () => {
      render(
        <BookDistributionChart
          data={mockStatusData}
          chartType="doughnut"
          dataType="status"
        />
      )

      expect(screen.getByText('読みたい')).toBeInTheDocument()
      expect(screen.getByText('読書中')).toBeInTheDocument()
      expect(screen.getByText('完読')).toBeInTheDocument()
      expect(screen.getByText('一時停止')).toBeInTheDocument()
      expect(screen.getByText('中断')).toBeInTheDocument()
    })

    test('読書状態の進捗表示', () => {
      render(
        <BookDistributionChart
          data={mockStatusData}
          chartType="doughnut"
          dataType="status"
          showProgress={true}
        />
      )

      // 読書中と完読の合計進捗率
      const totalBooks = Object.values(mockStatusData).reduce((sum, val) => sum + val, 0)
      const progressBooks = mockStatusData.reading + mockStatusData.completed
      const progressRate = Math.round((progressBooks / totalBooks) * 100)
      
      expect(screen.getByText(`読書進捗: ${progressRate}%`)).toBeInTheDocument()
    })

    test('状態別の推奨アクション表示', () => {
      render(
        <BookDistributionChart
          data={mockStatusData}
          chartType="doughnut"
          dataType="status"
          showRecommendations={true}
        />
      )

      // 読みたい本が多い場合の推奨アクション
      if (mockStatusData.want_to_read > 5) {
        expect(screen.getByText(/読みたい本が多いです/)).toBeInTheDocument()
      }

      // 一時停止本が多い場合の推奨アクション
      if (mockStatusData.paused > 0) {
        expect(screen.getByText(/一時停止中の本があります/)).toBeInTheDocument()
      }
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - データラベル
  describe('P2: データラベル表示テスト', () => {
    test('日本語ラベルの正しい表示', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
        />
      )

      // 日本語ラベルが正しく表示されること
      expect(screen.getByText('物理書籍 (30.0%)')).toBeInTheDocument()
      expect(screen.getByText('Kindle (40.0%)')).toBeInTheDocument()
      expect(screen.getByText('EPUB (16.0%)')).toBeInTheDocument()
      expect(screen.getByText('オーディオブック (10.0%)')).toBeInTheDocument()
      expect(screen.getByText('その他 (4.0%)')).toBeInTheDocument()
    })

    test('パーセンテージ表示のカスタマイズ', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          showPercentage={true}
          percentagePrecision={1}
        />
      )

      expect(screen.getByText('物理書籍 (30.0%)')).toBeInTheDocument()
    })

    test('値と割合の両方表示', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          showCount={true}
          showPercentage={true}
        />
      )

      expect(screen.getByText('物理書籍 (15冊, 30.0%)')).toBeInTheDocument()
    })

    test('ラベル非表示オプション', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          showLabels={false}
        />
      )

      // ラベルが表示されていないことを確認
      expect(screen.queryByText('物理書籍')).not.toBeInTheDocument()
      
      // チャート自体は表示されている
      expect(screen.getByTestId('distribution-chart')).toBeInTheDocument()
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - インタラクション
  describe('P2: インタラクションテスト', () => {
    test('チャートタイプ切り替えボタン', async () => {
      const user = userEvent.setup()
      const mockOnChartTypeChange = jest.fn()

      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          showTypeSelector={true}
          onChartTypeChange={mockOnChartTypeChange}
        />
      )

      const barButton = screen.getByRole('button', { name: '棒グラフ' })
      await user.click(barButton)

      expect(mockOnChartTypeChange).toHaveBeenCalledWith('bar')
    })

    test('セグメントクリック時のコールバック', async () => {
      const user = userEvent.setup()
      const mockOnSegmentClick = jest.fn()

      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          onSegmentClick={mockOnSegmentClick}
        />
      )

      // 凡例項目をクリック（セグメントクリックをシミュレート）
      const physicalBookLegend = screen.getByText('物理書籍')
      await user.click(physicalBookLegend)

      expect(mockOnSegmentClick).toHaveBeenCalledWith('physical', 15)
    })

    test('ホバー時の詳細情報表示', async () => {
      const user = userEvent.setup()

      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          showTooltip={true}
        />
      )

      // ホバー情報表示のトリガー要素
      const hoverTrigger = screen.getByTestId('hover-trigger-physical')
      await user.hover(hoverTrigger)

      // ツールチップ的な詳細表示
      expect(screen.getByText('物理書籍: 15冊 (30.0%)')).toBeInTheDocument()
      expect(screen.getByText('全体の30%を占めています')).toBeInTheDocument()
    })

    test('キーボードナビゲーション', async () => {
      const user = userEvent.setup()

      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          showTypeSelector={true}
        />
      )

      // タブ移動でボタンにフォーカス
      await user.tab()
      expect(screen.getByRole('button', { name: 'ドーナツ' })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: '棒グラフ' })).toHaveFocus()
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - アクセシビリティ
  describe('P2: アクセシビリティテスト', () => {
    test('色覚対応のカラーパレット', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          accessibleColors={true}
        />
      )

      // カラーパレットがアクセシブルであることを確認
      const chartElement = screen.getByTestId('distribution-chart')
      expect(chartElement).toHaveAttribute('data-color-palette', 'accessible')
    })

    test('スクリーンリーダー向けの代替テキスト', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
        />
      )

      // 代替テキストの確認
      const altText = screen.getByTestId('chart-alt-text')
      expect(altText).toHaveClass('sr-only')
      expect(altText).toHaveTextContent(/書籍分布: 物理書籍15冊/)
    })

    test('データテーブルでの代替表示', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          showDataTable={true}
        />
      )

      // アクセシビリティ向けデータテーブル
      const table = screen.getByRole('table')
      expect(table).toHaveClass('sr-only')
      
      // テーブルヘッダー
      expect(screen.getByRole('columnheader', { name: '書籍タイプ' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: '冊数' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: '割合' })).toBeInTheDocument()
    })

    test('高コントラストモード対応', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          highContrast={true}
        />
      )

      const chartElement = screen.getByTestId('distribution-chart')
      expect(chartElement).toHaveAttribute('data-high-contrast', 'true')
    })

    test('ARIAラベルの適切な設定', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
        />
      )

      const chart = screen.getByRole('img')
      expect(chart).toHaveAttribute('aria-label', expect.stringContaining('書籍分布'))
      expect(chart).toHaveAttribute('aria-describedby')
      
      const description = screen.getByTestId('chart-description')
      expect(description).toBeInTheDocument()
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - エラーハンドリング
  describe('P2: エラーハンドリングテスト', () => {
    test('空データの処理', () => {
      render(
        <BookDistributionChart
          data={{}}
          chartType="doughnut"
        />
      )

      expect(screen.getByText('分布データがありません')).toBeInTheDocument()
      expect(screen.getByText('書籍を追加してください')).toBeInTheDocument()
    })

    test('無効なデータの処理', () => {
      const invalidData = {
        physical: -5, // 負の値
        kindle: 'invalid', // 文字列
        epub: null, // null値
        audiobook: undefined // undefined
      }

      render(
        <BookDistributionChart
          data={invalidData as any}
          chartType="doughnut"
        />
      )

      expect(screen.getByText('データ形式が正しくありません')).toBeInTheDocument()
    })

    test('すべて0のデータの処理', () => {
      const zeroData = {
        physical: 0,
        kindle: 0,
        epub: 0,
        audiobook: 0,
        other: 0
      }

      render(
        <BookDistributionChart
          data={zeroData}
          chartType="doughnut"
        />
      )

      expect(screen.getByText('まだ書籍が登録されていません')).toBeInTheDocument()
    })

    test('Chart.js描画エラーの処理', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // 無効なchartTypeでエラーを発生させる
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="invalid" as any
        />
      )

      expect(screen.getByText('チャートの表示でエラーが発生しました')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument()

      consoleError.mockRestore()
    })
  })

  // TDD Red フェーズ: P2優先度テストケース - カスタマイズ
  describe('P2: カスタマイズオプションテスト', () => {
    test('カスタムタイトルの表示', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          title="私の蔵書分布"
        />
      )

      expect(screen.getByText('私の蔵書分布')).toBeInTheDocument()
    })

    test('サイズのカスタマイズ', () => {
      const { container } = render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          width={400}
          height={300}
        />
      )

      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveStyle('width: 400px')
      expect(chartContainer).toHaveStyle('height: 300px')
    })

    test('アニメーションのカスタマイズ', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          animation={{
            duration: 2000,
            easing: 'easeInOutQuart'
          }}
        />
      )

      const chart = screen.getByTestId('distribution-chart')
      expect(chart).toHaveAttribute('data-animation-duration', '2000')
    })

    test('凡例位置のカスタマイズ', () => {
      render(
        <BookDistributionChart
          data={mockDistributionData}
          chartType="doughnut"
          legendPosition="bottom"
        />
      )

      const legend = screen.getByTestId('chart-legend')
      expect(legend).toHaveClass('legend-bottom')
    })
  })
})