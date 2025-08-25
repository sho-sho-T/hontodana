import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewEditor, ReviewDisplay } from '@/components/rating/ReviewEditor'

describe('ReviewEditor', () => {
  describe('表示モード', () => {
    test('should show existing review in display mode', () => {
      const review = 'とても面白い本でした'
      render(<ReviewEditor review={review} onSave={jest.fn()} />)
      
      expect(screen.getByText(review)).toBeInTheDocument()
      expect(screen.getByText('編集')).toBeInTheDocument()
      expect(screen.getByText('削除')).toBeInTheDocument()
    })

    test('should show empty state when no review in readonly mode', () => {
      render(<ReviewEditor review={null} onSave={jest.fn()} readonly />)
      
      expect(screen.getByText('まだレビューが書かれていません')).toBeInTheDocument()
      expect(screen.queryByText('レビューを書く')).not.toBeInTheDocument()
    })

    test('should show write review button when no review and not readonly', () => {
      render(<ReviewEditor review="" onSave={jest.fn()} />)
      
      expect(screen.getByText('まだレビューが書かれていません')).toBeInTheDocument()
      expect(screen.getByText('レビューを書く')).toBeInTheDocument()
    })

    test('should handle edit button click', () => {
      const review = 'existing review'
      render(<ReviewEditor review={review} onSave={jest.fn()} />)
      
      const editButton = screen.getByText('編集')
      fireEvent.click(editButton)
      
      expect(screen.getByDisplayValue(review)).toBeInTheDocument()
      expect(screen.getByText('保存')).toBeInTheDocument()
      expect(screen.getByText('キャンセル')).toBeInTheDocument()
    })

    test('should handle delete button click', async () => {
      const handleSave = jest.fn()
      const review = 'existing review'
      render(<ReviewEditor review={review} onSave={handleSave} />)
      
      const deleteButton = screen.getByText('削除')
      fireEvent.click(deleteButton)
      
      expect(handleSave).toHaveBeenCalledWith(null)
    })

    test('should not show edit buttons in readonly mode', () => {
      const review = 'some review'
      render(<ReviewEditor review={review} onSave={jest.fn()} readonly />)
      
      expect(screen.getByText(review)).toBeInTheDocument()
      expect(screen.queryByText('編集')).not.toBeInTheDocument()
      expect(screen.queryByText('削除')).not.toBeInTheDocument()
    })
  })

  describe('編集モード', () => {
    test('should start in edit mode when no review exists', () => {
      render(<ReviewEditor review={null} onSave={jest.fn()} />)
      
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByText('保存')).toBeInTheDocument()
    })

    test('should show character count', async () => {
      const user = userEvent.setup()
      render(<ReviewEditor review={null} onSave={jest.fn()} />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'hello')
      
      expect(screen.getByText('5 / 2000')).toBeInTheDocument()
    })

    test('should show error when exceeding character limit', async () => {
      const user = userEvent.setup()
      render(<ReviewEditor review={null} onSave={jest.fn()} />)
      
      const textarea = screen.getByRole('textbox')
      const longText = 'a'.repeat(2001)
      await user.type(textarea, longText)
      
      expect(screen.getByText('2001 / 2000')).toBeInTheDocument()
      expect(screen.getByText(/2000文字以下で入力してください/)).toBeInTheDocument()
      
      const saveButton = screen.getByText('保存')
      expect(saveButton).toBeDisabled()
    })

    test('should handle save button click', async () => {
      const handleSave = jest.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      
      render(<ReviewEditor review={null} onSave={handleSave} />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'new review')
      
      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith('new review')
      })
    })

    test('should trim whitespace when saving', async () => {
      const handleSave = jest.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      
      render(<ReviewEditor review={null} onSave={handleSave} />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, '  review with spaces  ')
      
      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith('review with spaces')
      })
    })

    test('should save null for empty review', async () => {
      const handleSave = jest.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      
      render(<ReviewEditor review={null} onSave={handleSave} />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, '   ')
      
      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith(null)
      })
    })

    test('should handle cancel button click', async () => {
      const handleCancel = jest.fn()
      const user = userEvent.setup()
      
      render(<ReviewEditor review="original" onSave={jest.fn()} onCancel={handleCancel} />)
      
      // 編集モードに入る
      const editButton = screen.getByText('編集')
      fireEvent.click(editButton)
      
      // テキストを変更
      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, 'changed')
      
      // キャンセル
      const cancelButton = screen.getByText('キャンセル')
      fireEvent.click(cancelButton)
      
      expect(handleCancel).toHaveBeenCalled()
      expect(screen.getByText('original')).toBeInTheDocument() // 元のテキストが表示される
    })

    test('should disable save button when no changes', () => {
      render(<ReviewEditor review="existing" onSave={jest.fn()} />)
      
      // 編集モードに入る
      const editButton = screen.getByText('編集')
      fireEvent.click(editButton)
      
      // 変更がない状態では保存ボタンが無効
      const saveButton = screen.getByText('保存')
      expect(saveButton).toBeDisabled()
    })

    test('should handle keyboard shortcuts', async () => {
      const handleSave = jest.fn().mockResolvedValue(undefined)
      const handleCancel = jest.fn()
      const user = userEvent.setup()
      
      render(<ReviewEditor review={null} onSave={handleSave} onCancel={handleCancel} />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'test review')
      
      // Ctrl+Enter で保存
      await user.keyboard('{Control>}{Enter}{/Control}')
      await waitFor(() => {
        expect(handleSave).toHaveBeenCalledWith('test review')
      })
      
      // Escapeでキャンセル（新しいインスタンスでテスト）
      const { rerender } = render(<ReviewEditor review="original" onSave={jest.fn()} onCancel={handleCancel} />)
      const editButton = screen.getByText('編集')
      fireEvent.click(editButton)
      
      const newTextarea = screen.getByRole('textbox')
      await user.keyboard('{Escape}')
      expect(handleCancel).toHaveBeenCalled()
    })

    test('should show loading state while saving', async () => {
      let resolvePromise: () => void
      const handleSave = jest.fn(() => new Promise(resolve => {
        resolvePromise = resolve
      }))
      const user = userEvent.setup()
      
      render(<ReviewEditor review={null} onSave={handleSave} />)
      
      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'test')
      
      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)
      
      expect(screen.getByText('保存中...')).toBeInTheDocument()
      expect(saveButton).toBeDisabled()
      
      resolvePromise!()
      await waitFor(() => {
        expect(screen.queryByText('保存中...')).not.toBeInTheDocument()
      })
    })
  })

  describe('カスタマイゼーション', () => {
    test('should use custom placeholder', () => {
      const placeholder = 'カスタムプレースホルダー'
      render(<ReviewEditor review={null} onSave={jest.fn()} placeholder={placeholder} />)
      
      expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument()
    })

    test('should apply custom className', () => {
      render(<ReviewEditor review="test" onSave={jest.fn()} className="custom-class" />)
      
      const container = screen.getByText('test').closest('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })
})

describe('ReviewDisplay', () => {
  test('should show review text', () => {
    const review = 'This is a great book!'
    render(<ReviewDisplay review={review} />)
    
    expect(screen.getByText(review)).toBeInTheDocument()
  })

  test('should show empty state for null review', () => {
    render(<ReviewDisplay review={null} />)
    
    expect(screen.getByText('レビューなし')).toBeInTheDocument()
  })

  test('should truncate long reviews', () => {
    const longReview = 'a'.repeat(200)
    render(<ReviewDisplay review={longReview} maxLength={100} />)
    
    expect(screen.getByText('続きを読む')).toBeInTheDocument()
    expect(screen.queryByText(longReview)).not.toBeInTheDocument()
  })

  test('should expand truncated reviews', async () => {
    const longReview = 'a'.repeat(200)
    render(<ReviewDisplay review={longReview} maxLength={100} />)
    
    const expandButton = screen.getByText('続きを読む')
    fireEvent.click(expandButton)
    
    expect(screen.getByText(longReview)).toBeInTheDocument()
    expect(screen.getByText('折りたたむ')).toBeInTheDocument()
  })

  test('should apply custom className', () => {
    render(<ReviewDisplay review="test" className="custom-display" />)
    
    const container = screen.getByText('test').closest('.custom-display')
    expect(container).toBeInTheDocument()
  })
})