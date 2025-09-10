/**
 * 目標進捗カードコンポーネント テスト
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

const mockProgress = {
  currentValue: 12,
  progressPercentage: 24,
  remainingToTarget: 38,
  isOnTrack: true,
  isCompleted: false,
  isExpired: false,
  dailyTargetToFinish: 0.2,
  daysRemaining: 200
}

describe('GoalProgressCard', () => {
  describe('基本表示テスト', () => {
    test('年間書籍目標の正確な表示', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          progress={mockProgress}
        />
      )

      expect(screen.getByText('年間読書目標')).toBeInTheDocument()
      expect(screen.getByText('目標: 50冊')).toBeInTheDocument()
      expect(screen.getByText('24%')).toBeInTheDocument()
      expect(screen.getByText('順調')).toBeInTheDocument()
    })

    test('月間ページ目標の表示', () => {
      const pagesGoal = {
        ...mockGoal,
        type: 'pages_per_month' as const,
        targetValue: 1000,
        currentValue: 350
      }
      
      const pagesProgress = {
        currentValue: 350,
        progressPercentage: 35,
        remainingToTarget: 650,
        isOnTrack: true,
        isCompleted: false,
        isExpired: false,
        dailyTargetToFinish: 65,
        daysRemaining: 10
      }

      render(
        <GoalProgressCard
          goal={pagesGoal}
          progress={pagesProgress}
        />
      )

      expect(screen.getByText('月間ページ目標')).toBeInTheDocument()
      expect(screen.getByText('目標: 1,000ページ')).toBeInTheDocument()
      expect(screen.getByText('35%')).toBeInTheDocument()
    })

    test('週間読書時間目標の表示', () => {
      const timeGoal = {
        ...mockGoal,
        type: 'minutes_per_week' as const,
        targetValue: 420,
        currentValue: 180
      }
      
      const timeProgress = {
        currentValue: 180,
        progressPercentage: 43,
        remainingToTarget: 240,
        isOnTrack: false,
        isCompleted: false,
        isExpired: false,
        dailyTargetToFinish: 34,
        daysRemaining: 3
      }

      render(
        <GoalProgressCard
          goal={timeGoal}
          progress={timeProgress}
        />
      )

      expect(screen.getByText('週間読書時間目標')).toBeInTheDocument()
      expect(screen.getByText('目標: 7時間')).toBeInTheDocument()
      expect(screen.getByText('43%')).toBeInTheDocument()
    })
  })

  describe('プログレスバーテスト', () => {
    test('プログレスバーの基本属性', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          progress={mockProgress}
        />
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '24')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      expect(progressBar).toHaveAttribute('aria-label', '進捗率 24%')
    })

    test('100%達成時のプログレスバー', () => {
      const completedProgress = {
        ...mockProgress,
        currentValue: 50,
        progressPercentage: 100,
        remainingToTarget: 0,
        isCompleted: true
      }

      render(
        <GoalProgressCard
          goal={mockGoal}
          progress={completedProgress}
        />
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '100')
      expect(screen.getByText('達成')).toBeInTheDocument()
    })

    test('進捗が遅れている場合の表示', () => {
      const behindProgress = {
        ...mockProgress,
        currentValue: 5,
        progressPercentage: 10,
        remainingToTarget: 45,
        isOnTrack: false
      }

      render(
        <GoalProgressCard
          goal={mockGoal}
          progress={behindProgress}
        />
      )

      expect(screen.getByText('遅れ')).toBeInTheDocument()
      expect(screen.getByText('10%')).toBeInTheDocument()
    })
  })

  describe('統計表示テスト', () => {
    test('現在値と残り値の表示', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          progress={mockProgress}
        />
      )

      expect(screen.getByText('現在の値')).toBeInTheDocument()
      expect(screen.getByText('12冊')).toBeInTheDocument()
      expect(screen.getByText('残り')).toBeInTheDocument()
      expect(screen.getByText('38冊')).toBeInTheDocument()
    })

    test('推奨ペースの表示', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          progress={mockProgress}
        />
      )

      expect(screen.getByText('目標達成には')).toBeInTheDocument()
      expect(screen.getByText('1日0冊のペースが必要')).toBeInTheDocument()
    })
  })

  describe('進捗なしの場合', () => {
    test('progressが未定義の場合の表示', () => {
      render(
        <GoalProgressCard
          goal={mockGoal}
          progress={undefined}
        />
      )

      expect(screen.getByText('年間読書目標')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
      expect(screen.getByText('順調')).toBeInTheDocument()
    })
  })

  describe('編集・削除ボタンテスト', () => {
    test('編集ボタンが存在し動作する', async () => {
      const user = userEvent.setup()
      const mockOnEdit = jest.fn()

      render(
        <GoalProgressCard
          goal={mockGoal}
          progress={mockProgress}
          onEdit={mockOnEdit}
        />
      )

      const editButton = screen.getByText('編集')
      await user.click(editButton)

      expect(mockOnEdit).toHaveBeenCalledWith(mockGoal.id)
    })

    test('削除ボタンが存在し動作する', async () => {
      const user = userEvent.setup()
      const mockOnDelete = jest.fn()

      render(
        <GoalProgressCard
          goal={mockGoal}
          progress={mockProgress}
          onDelete={mockOnDelete}
        />
      )

      const deleteButton = screen.getByText('削除')
      await user.click(deleteButton)

      expect(mockOnDelete).toHaveBeenCalledWith(mockGoal.id)
    })
  })
})