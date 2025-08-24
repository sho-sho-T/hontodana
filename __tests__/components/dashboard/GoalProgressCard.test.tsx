/**
 * 目標進捗カードコンポーネント テスト - TDD Red フェーズ
 * P1優先度テストケース: 目標進捗表示、プログレスバー、達成予測
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoalProgressCard } from '@/components/dashboard/GoalProgressCard'

const mockGoal = {
  id: 'goal-1',
  type: 'books_per_year' as const,
  targetValue: 50,
  currentValue: 12,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  isActive: true,
  userId: 'test-user',
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('GoalProgressCard', () => {
  // TDD Red フェーズ: P1優先度テストケース - 目標進捗表示
  describe('P1: 目標進捗表示テスト', () => {
    test('年間書籍目標の正確な表示', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={12}
          remainingDays={200}
          isOnTrack={true}
        />
      )

      expect(screen.getByText('年間読書目標')).toBeInTheDocument()
      expect(screen.getByText('12 / 50冊')).toBeInTheDocument()
      expect(screen.getByText('24%')).toBeInTheDocument() // 12/50 * 100
      expect(screen.getByText('順調です')).toBeInTheDocument()
    })

    test('月間ページ目標の表示', () => {
      const pagesGoal = {
        ...mockGoal,
        type: 'pages_per_month' as const,
        targetValue: 1000,
        currentValue: 350
      }

      render(
        <GoalProgressCard
          goal={pagesGoal}
          currentProgress={350}
          remainingDays={10}
          isOnTrack={true}
        />
      )

      expect(screen.getByText('月間ページ目標')).toBeInTheDocument()
      expect(screen.getByText('350 / 1,000ページ')).toBeInTheDocument()
      expect(screen.getByText('35%')).toBeInTheDocument()
    })

    test('週間読書時間目標の表示', () => {
      const timeGoal = {
        ...mockGoal,
        type: 'minutes_per_week' as const,
        targetValue: 420, // 7時間
        currentValue: 180 // 3時間
      }

      render(
        <GoalProgressCard
          goal={timeGoal}
          currentProgress={180}
          remainingDays={3}
          isOnTrack={false}
        />
      )

      expect(screen.getByText('週間読書時間目標')).toBeInTheDocument()
      expect(screen.getByText('3時間 / 7時間')).toBeInTheDocument()
      expect(screen.getByText('43%')).toBeInTheDocument() // 180/420 * 100
    })

    test('目標進捗のパーセンテージ計算', () => {
      const testCases = [
        { current: 0, target: 50, expected: '0%' },
        { current: 25, target: 50, expected: '50%' },
        { current: 50, target: 50, expected: '100%' },
        { current: 60, target: 50, expected: '120%' }, // 目標超過
      ]

      testCases.forEach(({ current, target, expected }) => {
        const testGoal = { ...mockGoal, targetValue: target }
        
        const { rerender } = render(
          <GoalProgressCard
            goal={testGoal}
            currentProgress={current}
            remainingDays={100}
            isOnTrack={true}
          />
        )

        expect(screen.getByText(expected)).toBeInTheDocument()
        
        // 次のテストケースのためにクリア
        rerender(<div />)
      })
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - プログレスバー
  describe('P1: プログレスバー表示テスト', () => {
    test('プログレスバーの基本属性', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={12}
          remainingDays={200}
          isOnTrack={true}
        />
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '24')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      expect(progressBar).toHaveAttribute('aria-label', '目標進捗: 24%')
    })

    test('100%達成時のプログレスバー', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={50}
          remainingDays={100}
          isOnTrack={true}
        />
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '100')
      expect(progressBar).toHaveClass('bg-green-500') // 達成時の色
    })

    test('目標超過時のプログレスバー', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={60}
          remainingDays={50}
          isOnTrack={true}
        />
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '120')
      expect(progressBar).toHaveClass('bg-blue-500') // 超過時の色
      expect(screen.getByText('目標達成！')).toBeInTheDocument()
    })

    test('進捗が遅れている場合のプログレスバー', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={5}
          remainingDays={50}
          isOnTrack={false}
        />
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('bg-red-500') // 遅れている時の色
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - 達成予測
  describe('P1: 達成予測テスト', () => {
    test('順調な進捗の場合の予測メッセージ', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={25} // 50%達成
          remainingDays={150} // 残り5ヶ月
          isOnTrack={true}
        />
      )

      expect(screen.getByText('順調です')).toBeInTheDocument()
      expect(screen.getByText(/現在のペースで目標達成可能/)).toBeInTheDocument()
    })

    test('進捗が遅れている場合の予測メッセージ', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={5} // 10%のみ達成
          remainingDays={100} // 残り3ヶ月強
          isOnTrack={false}
        />
      )

      expect(screen.getByText('目標達成が困難')).toBeInTheDocument()
      expect(screen.getByText(/1日あたり/)).toBeInTheDocument() // 推奨ペースの表示
    })

    test('推奨ペースの計算と表示', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={10}
          remainingDays={200}
          isOnTrack={false}
        />
      )

      // 残り40冊を200日で読む = 0.2冊/日
      expect(screen.getByText(/1日あたり0\.2冊のペースが必要/)).toBeInTheDocument()
    })

    test('目標達成済みの場合', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={50}
          remainingDays={100}
          isOnTrack={true}
        />
      )

      expect(screen.getByText('目標達成！')).toBeInTheDocument()
      expect(screen.getByText('おめでとうございます')).toBeInTheDocument()
    })

    test('期間終了後の目標表示', () => {
      const expiredGoal = {
        ...mockGoal,
        endDate: new Date('2023-12-31') // 過去の日付
      }

      render(
        <GoalProgressCard
          goal={expiredGoal}
          currentProgress={30}
          remainingDays={0}
          isOnTrack={false}
        />
      )

      expect(screen.getByText('期間終了')).toBeInTheDocument()
      expect(screen.getByText('60%達成')).toBeInTheDocument() // 30/50 * 100
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - 目標タイプ別表示
  describe('P1: 目標タイプ別表示テスト', () => {
    test('読書時間目標の時間フォーマット', () => {
      const timeGoal = {
        ...mockGoal,
        type: 'minutes_per_month' as const,
        targetValue: 600, // 10時間
        currentValue: 330 // 5時間30分
      }

      render(
        <GoalProgressCard
          goal={timeGoal}
          currentProgress={330}
          remainingDays={15}
          isOnTrack={true}
        />
      )

      expect(screen.getByText('月間読書時間目標')).toBeInTheDocument()
      expect(screen.getByText('5時間30分 / 10時間')).toBeInTheDocument()
    })

    test('読書セッション数目標の表示', () => {
      const sessionGoal = {
        ...mockGoal,
        type: 'sessions_per_week' as const,
        targetValue: 14, // 週14セッション（1日2回）
        currentValue: 8
      }

      render(
        <GoalProgressCard
          goal={sessionGoal}
          currentProgress={8}
          remainingDays={3}
          isOnTrack={true}
        />
      )

      expect(screen.getByText('週間セッション目標')).toBeInTheDocument()
      expect(screen.getByText('8 / 14セッション')).toBeInTheDocument()
    })

    test('カスタム目標の表示', () => {
      const customGoal = {
        ...mockGoal,
        type: 'custom' as const,
        targetValue: 100,
        currentValue: 45,
        title: 'カスタム読書目標'
      }

      render(
        <GoalProgressCard
          goal={customGoal}
          currentProgress={45}
          remainingDays={60}
          isOnTrack={true}
        />
      )

      expect(screen.getByText('カスタム読書目標')).toBeInTheDocument()
      expect(screen.getByText('45 / 100')).toBeInTheDocument()
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - インタラクション
  describe('P1: インタラクションテスト', () => {
    test('カードクリック時の詳細表示', async () => {
      const user = userEvent.setup()
      const mockOnClick = jest.fn()

      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={12}
          remainingDays={200}
          isOnTrack={true}
          onGoalClick={mockOnClick}
        />
      )

      const card = screen.getByRole('button', { name: /年間読書目標/ })
      await user.click(card)

      expect(mockOnClick).toHaveBeenCalledWith(mockGoal.id)
    })

    test('目標編集ボタンの動作', async () => {
      const user = userEvent.setup()
      const mockOnEdit = jest.fn()

      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={12}
          remainingDays={200}
          isOnTrack={true}
          onEditGoal={mockOnEdit}
        />
      )

      const editButton = screen.getByRole('button', { name: '目標編集' })
      await user.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith(mockGoal.id)
    })

    test('目標削除ボタンの動作', async () => {
      const user = userEvent.setup()
      const mockOnDelete = jest.fn()

      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={12}
          remainingDays={200}
          isOnTrack={true}
          onDeleteGoal={mockOnDelete}
        />
      )

      const deleteButton = screen.getByRole('button', { name: '目標削除' })
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith(mockGoal.id)
    })

    test('進捗追加ボタンの動作', async () => {
      const user = userEvent.setup()
      const mockOnAddProgress = jest.fn()

      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={12}
          remainingDays={200}
          isOnTrack={true}
          onAddProgress={mockOnAddProgress}
        />
      )

      const addProgressButton = screen.getByRole('button', { name: '進捗追加' })
      await user.click(addProgressButton)

      expect(mockOnAddProgress).toHaveBeenCalledWith(mockGoal.id)
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - アクセシビリティ
  describe('P1: アクセシビリティテスト', () => {
    test('適切なAria属性の設定', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={12}
          remainingDays={200}
          isOnTrack={true}
        />
      )

      // カード全体のaria-label
      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-label', 
        '年間読書目標: 50冊中12冊達成、24%完了、順調に進行中'
      )

      // プログレスバーのaria属性
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-describedby')
    })

    test('スクリーンリーダー向けの詳細説明', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={12}
          remainingDays={200}
          isOnTrack={true}
        />
      )

      // 詳細な説明文
      const description = screen.getByText(/年間50冊の読書目標に対して/)
      expect(description).toHaveClass('sr-only')
      expect(description).toHaveTextContent(
        /年間50冊の読書目標に対して、現在12冊を完了。残り200日で38冊読む必要があります。/
      )
    })

    test('キーボードナビゲーション対応', async () => {
      const user = userEvent.setup()
      const mockOnClick = jest.fn()

      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={12}
          remainingDays={200}
          isOnTrack={true}
          onGoalClick={mockOnClick}
        />
      )

      const card = screen.getByRole('button', { name: /年間読書目標/ })
      
      // Tab キーでフォーカス
      await user.tab()
      expect(card).toHaveFocus()

      // Enter キーで実行
      await user.keyboard('{Enter}')
      expect(mockOnClick).toHaveBeenCalled()
    })

    test('高コントラストモード対応', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={12}
          remainingDays={200}
          isOnTrack={false}
        />
      )

      const progressBar = screen.getByRole('progressbar')
      
      // 高コントラストモードでの色の確認
      expect(progressBar).toHaveAttribute('data-high-contrast', 'true')
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - エラーハンドリング
  describe('P1: エラーハンドリングテスト', () => {
    test('無効な目標データの処理', () => {
      const invalidGoal = {
        ...mockGoal,
        targetValue: 0,
        currentValue: -5
      }

      render(
        <GoalProgressCard
          goal={invalidGoal}
          currentProgress={0}
          remainingDays={100}
          isOnTrack={false}
        />
      )

      expect(screen.getByText('目標が正しく設定されていません')).toBeInTheDocument()
    })

    test('目標期間外での表示', () => {
      const futureGoal = {
        ...mockGoal,
        startDate: new Date('2025-01-01'), // 未来の開始日
        endDate: new Date('2025-12-31')
      }

      render(
        <GoalProgressCard
          goal={futureGoal}
          currentProgress={0}
          remainingDays={365}
          isOnTrack={true}
        />
      )

      expect(screen.getByText('開始予定')).toBeInTheDocument()
      expect(screen.getByText(/2025年1月1日開始予定/)).toBeInTheDocument()
    })

    test('データ取得エラー時の表示', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={null}
          remainingDays={null}
          isOnTrack={null}
          error="進捗データの取得に失敗しました"
        />
      )

      expect(screen.getByText('進捗データの取得に失敗しました')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument()
    })

    test('長い目標名の省略表示', () => {
      const longTitleGoal = {
        ...mockGoal,
        title: 'とても長い目標名を持つ読書目標でこれは省略される可能性があります'
      }

      render(
        <GoalProgressCard
          goal={longTitleGoal}
          currentProgress={12}
          remainingDays={200}
          isOnTrack={true}
        />
      )

      const titleElement = screen.getByText(/とても長い目標名/)
      expect(titleElement).toHaveClass('truncate')
      expect(titleElement).toHaveAttribute('title', longTitleGoal.title) // ツールチップで全文表示
    })
  })

  // TDD Red フェーズ: P1優先度テストケース - データ更新
  describe('P1: データ更新テスト', () => {
    test('進捗リアルタイム更新', () => {
      const { rerender } = render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={12}
          remainingDays={200}
          isOnTrack={true}
        />
      )

      // 初期値の確認
      expect(screen.getByText('24%')).toBeInTheDocument()

      // 進捗更新
      rerender(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={15}
          remainingDays={195}
          isOnTrack={true}
        />
      )

      // 更新値の確認
      expect(screen.getByText('30%')).toBeInTheDocument()
      expect(screen.getByText('15 / 50冊')).toBeInTheDocument()
    })

    test('目標達成時のアニメーション', () => {
      const { rerender } = render(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={49}
          remainingDays={10}
          isOnTrack={true}
        />
      )

      // 目標達成前
      expect(screen.queryByText('目標達成！')).not.toBeInTheDocument()

      // 目標達成
      rerender(
        <GoalProgressCard
          goal={mockGoal}
          currentProgress={50}
          remainingDays={10}
          isOnTrack={true}
        />
      )

      // 達成メッセージとアニメーション要素の確認
      expect(screen.getByText('目標達成！')).toBeInTheDocument()
      expect(screen.getByTestId('celebration-animation')).toBeInTheDocument()
    })
  })
})