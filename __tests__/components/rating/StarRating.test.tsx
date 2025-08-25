import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { StarRating, StarRatingDisplay } from '@/components/rating/StarRating'

describe('StarRating', () => {
  describe('インタラクティブモード', () => {
    test('should render stars with correct rating', () => {
      render(<StarRating rating={4} onChange={jest.fn()} />)
      
      const stars = screen.getAllByRole('radio')
      expect(stars).toHaveLength(5)
      
      // 4つ星まで選択されている状態をテスト
      stars.forEach((star, index) => {
        const isActive = index < 4 // 0-3 (1-4星)
        if (isActive) {
          expect(star.querySelector('svg')).toHaveClass('fill-yellow-400')
        } else {
          expect(star.querySelector('svg')).toHaveClass('fill-gray-200')
        }
      })
    })

    test('should handle star click', () => {
      const handleChange = jest.fn()
      render(<StarRating rating={null} onChange={handleChange} />)
      
      const thirdStar = screen.getAllByRole('radio')[2] // 3星目
      fireEvent.click(thirdStar)
      
      expect(handleChange).toHaveBeenCalledWith(3)
    })

    test('should clear rating when clicking same star', () => {
      const handleChange = jest.fn()
      render(<StarRating rating={3} onChange={handleChange} />)
      
      const thirdStar = screen.getAllByRole('radio')[2] // 3星目
      fireEvent.click(thirdStar)
      
      expect(handleChange).toHaveBeenCalledWith(null)
    })

    test('should show rating label', () => {
      render(<StarRating rating={5} onChange={jest.fn()} showLabel />)
      expect(screen.getByText('とても良い')).toBeInTheDocument()
    })

    test('should show clear button when rating exists', () => {
      render(<StarRating rating={3} onChange={jest.fn()} />)
      expect(screen.getByText('クリア')).toBeInTheDocument()
    })

    test('should handle clear button click', () => {
      const handleChange = jest.fn()
      render(<StarRating rating={3} onChange={handleChange} />)
      
      const clearButton = screen.getByText('クリア')
      fireEvent.click(clearButton)
      
      expect(handleChange).toHaveBeenCalledWith(null)
    })

    test('should handle hover effects', () => {
      const handleChange = jest.fn()
      render(<StarRating rating={2} onChange={handleChange} />)
      
      const fourthStar = screen.getAllByRole('radio')[3] // 4星目
      fireEvent.mouseEnter(fourthStar)
      
      // ホバー時は4つ星まで表示される
      const stars = screen.getAllByRole('radio')
      stars.forEach((star, index) => {
        const isActive = index < 4
        if (isActive) {
          expect(star.querySelector('svg')).toHaveClass('fill-yellow-400')
        }
      })
    })
  })

  describe('読み取り専用モード', () => {
    test('should render in readonly mode', () => {
      render(<StarRating rating={3} readonly />)
      
      // 読み取り専用の場合は img role
      expect(screen.getByRole('img')).toBeInTheDocument()
      expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    })

    test('should not show clear button in readonly mode', () => {
      render(<StarRating rating={3} readonly />)
      expect(screen.queryByText('クリア')).not.toBeInTheDocument()
    })

    test('should not handle clicks in readonly mode', () => {
      const handleChange = jest.fn()
      render(<StarRating rating={3} onChange={handleChange} readonly />)
      
      const container = screen.getByRole('img')
      fireEvent.click(container)
      
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('サイズとスタイル', () => {
    test('should apply different sizes', () => {
      const { rerender } = render(<StarRating rating={3} onChange={jest.fn()} size="sm" />)
      let stars = screen.getAllByRole('radio')
      expect(stars[0]).toHaveClass('w-4', 'h-4')

      rerender(<StarRating rating={3} onChange={jest.fn()} size="md" />)
      stars = screen.getAllByRole('radio')
      expect(stars[0]).toHaveClass('w-6', 'h-6')

      rerender(<StarRating rating={3} onChange={jest.fn()} size="lg" />)
      stars = screen.getAllByRole('radio')
      expect(stars[0]).toHaveClass('w-8', 'h-8')
    })

    test('should apply custom className', () => {
      render(<StarRating rating={3} onChange={jest.fn()} className="custom-class" />)
      expect(screen.getByRole('radiogroup').parentElement).toHaveClass('custom-class')
    })
  })

  describe('ラベル表示', () => {
    test('should show correct labels for each rating', () => {
      const labels = [
        { rating: 1, label: 'とても悪い' },
        { rating: 2, label: '悪い' },
        { rating: 3, label: '普通' },
        { rating: 4, label: '良い' },
        { rating: 5, label: 'とても良い' },
      ]

      labels.forEach(({ rating, label }) => {
        const { rerender } = render(
          <StarRating rating={rating as any} onChange={jest.fn()} showLabel />
        )
        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })

    test('should show "未評価" for null rating', () => {
      render(<StarRating rating={null} onChange={jest.fn()} showLabel />)
      expect(screen.getByText('未評価')).toBeInTheDocument()
    })

    test('should hide label when showLabel is false', () => {
      render(<StarRating rating={3} onChange={jest.fn()} showLabel={false} />)
      expect(screen.queryByText('普通')).not.toBeInTheDocument()
    })
  })
})

describe('StarRatingDisplay', () => {
  test('should render as readonly StarRating', () => {
    render(<StarRatingDisplay rating={4} />)
    
    expect(screen.getByRole('img')).toBeInTheDocument()
    expect(screen.queryByText('クリア')).not.toBeInTheDocument()
  })

  test('should apply custom props', () => {
    render(<StarRatingDisplay rating={2} size="lg" className="display-stars" />)
    
    const stars = screen.getByRole('img').querySelectorAll('button')
    expect(stars[0]).toHaveClass('w-8', 'h-8')
    expect(screen.getByRole('img').parentElement).toHaveClass('display-stars')
  })
})