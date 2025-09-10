/**
 * 統計サマリーカードコンポーネント テスト
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { StatsSummaryCard } from '@/components/dashboard/StatsSummaryCard'
import { ClockIcon } from '@heroicons/react/24/outline'
import { BookOpenIcon } from '@heroicons/react/24/outline'

describe('StatsSummaryCard', () => {
  describe('基本表示テスト', () => {
    test('統計値の正しいフォーマット表示', () => {
      render(
        <StatsSummaryCard
          title="総読書時間"
          value={150}
          unit="minutes"
          icon={<ClockIcon className="w-5 h-5" />}
          trend={{
            value: 15,
            direction: 'up',
            period: '先週比'
          }}
        />
      )

      expect(screen.getByText('2時間30分')).toBeInTheDocument()
      expect(screen.getByText('総読書時間')).toBeInTheDocument()
    })

    test('書籍数の表示', () => {
      render(
        <StatsSummaryCard
          title="読了書籍"
          value={23}
          unit="books"
          icon={<BookOpenIcon className="w-5 h-5" />}
        />
      )

      expect(screen.getByText('23冊')).toBeInTheDocument()
      expect(screen.getByText('読了書籍')).toBeInTheDocument()
    })

    test('ページ数の表示', () => {
      render(
        <StatsSummaryCard
          title="総ページ数"
          value={1250}
          unit="pages"
        />
      )

      expect(screen.getByText('1,250ページ')).toBeInTheDocument()
      expect(screen.getByText('総ページ数')).toBeInTheDocument()
    })
  })

  describe('トレンド表示テスト', () => {
    test('上昇トレンドの表示', () => {
      render(
        <StatsSummaryCard
          title="総読書時間"
          value={120}
          unit="minutes"
          trend={{
            value: 20,
            direction: 'up',
            period: '先週比'
          }}
        />
      )

      expect(screen.getByLabelText('上昇トレンド')).toBeInTheDocument()
      expect(screen.getByText('vs 先週比')).toBeInTheDocument()
    })

    test('下降トレンドの表示', () => {
      render(
        <StatsSummaryCard
          title="総読書時間"
          value={80}
          unit="minutes"
          trend={{
            value: 10,
            direction: 'down',
            period: '先週比'
          }}
        />
      )

      expect(screen.getByLabelText('下降トレンド')).toBeInTheDocument()
    })

    test('安定トレンドの表示', () => {
      render(
        <StatsSummaryCard
          title="総読書時間"
          value={100}
          unit="minutes"
          trend={{
            value: 0,
            direction: 'stable',
            period: '先週比'
          }}
        />
      )

      expect(screen.getByLabelText('安定トレンド')).toBeInTheDocument()
    })
  })

  describe('アイコンなし表示', () => {
    test('アイコンなしでも正常に表示', () => {
      render(
        <StatsSummaryCard
          title="統計データ"
          value={42}
          unit="books"
        />
      )

      expect(screen.getByText('42冊')).toBeInTheDocument()
      expect(screen.getByText('統計データ')).toBeInTheDocument()
    })
  })
})