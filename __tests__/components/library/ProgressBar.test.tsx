/**
 * ProgressBar コンポーネントのテスト
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '@/components/library/ProgressBar'

describe('ProgressBar - 基本表示', () => {
  test('進捗率が正しく表示される', () => {
    render(<ProgressBar current={150} total={300} />)
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })

  test('0%の進捗率が正しく表示される', () => {
    render(<ProgressBar current={0} total={300} />)
    
    expect(screen.getByText('0%')).toBeInTheDocument()
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
  })

  test('100%の進捗率が正しく表示される', () => {
    render(<ProgressBar current={300} total={300} />)
    
    expect(screen.getByText('100%')).toBeInTheDocument()
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
  })

  test('視覚的な進捗バーの幅が正しく設定される', () => {
    render(<ProgressBar current={150} total={300} />)
    
    const progressIndicator = screen.getByTestId('progress-indicator')
    expect(progressIndicator).toHaveStyle('width: 50%')
  })
})

describe('ProgressBar - 境界値テスト', () => {
  test('負の進捗率は0%として表示される', () => {
    render(<ProgressBar current={-50} total={300} />)
    
    expect(screen.getByText('0%')).toBeInTheDocument()
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
    
    const progressIndicator = screen.getByTestId('progress-indicator')
    expect(progressIndicator).toHaveStyle('width: 0%')
  })

  test('100%を超える進捗率は100%として表示される', () => {
    render(<ProgressBar current={400} total={300} />)
    
    expect(screen.getByText('100%')).toBeInTheDocument()
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
    
    const progressIndicator = screen.getByTestId('progress-indicator')
    expect(progressIndicator).toHaveStyle('width: 100%')
  })

  test('小数点を含む進捗率が正しく四捨五入される', () => {
    render(<ProgressBar current={101} total={300} />)
    
    // 101/300 = 33.666... → 34%
    expect(screen.getByText('34%')).toBeInTheDocument()
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '34')
  })

  test('total が 0 の場合は 0% として表示される', () => {
    render(<ProgressBar current={50} total={0} />)
    
    expect(screen.getByText('0%')).toBeInTheDocument()
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
  })

  test('total が負の値の場合は 0% として表示される', () => {
    render(<ProgressBar current={50} total={-100} />)
    
    expect(screen.getByText('0%')).toBeInTheDocument()
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
  })
})

describe('ProgressBar - アクセシビリティ', () => {
  test('適切な ARIA 属性が設定される', () => {
    render(<ProgressBar current={150} total={300} />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-label', '読書進捗')
    expect(progressBar).toHaveAttribute('aria-valuenow', '50')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    expect(progressBar).toHaveAttribute('aria-valuetext', '50% 完了')
  })

  test('カスタムラベルが設定される', () => {
    render(<ProgressBar current={150} total={300} label="カスタム進捗" />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-label', 'カスタム進捗')
  })
})