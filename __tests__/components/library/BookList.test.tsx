/**
 * BookList コンポーネントのテスト
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BookList } from '@/components/library/BookList'
import { mockBooks, emptyBooks } from '@/__tests__/fixtures/bookData'

describe('BookList - 基本表示', () => {
  const defaultProps = {
    books: mockBooks,
    onStatusChange: jest.fn(),
    onRemove: jest.fn(),
    sortBy: 'title' as const,
    sortOrder: 'asc' as const,
    onSort: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('書籍リストが正しく表示される', () => {
    render(<BookList {...defaultProps} />)
    
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('テスト書籍のタイトル')).toBeInTheDocument()
    expect(screen.getByText('読みたい本')).toBeInTheDocument()
    expect(screen.getByText('読了済みの本')).toBeInTheDocument()
  })

  test('空の書籍リストの場合、適切なメッセージが表示される', () => {
    render(<BookList {...defaultProps} books={emptyBooks} />)
    
    expect(screen.getByText('書籍がありません')).toBeInTheDocument()
    expect(screen.getByText('新しい書籍を追加してください')).toBeInTheDocument()
  })

  test('各書籍項目の詳細情報が正しく表示される', () => {
    render(<BookList {...defaultProps} />)
    
    // 1冊目の情報確認
    expect(screen.getByText('テスト書籍のタイトル')).toBeInTheDocument()
    expect(screen.getByText('テスト著者1, テスト著者2')).toBeInTheDocument()
    expect(screen.getByText('300ページ')).toBeInTheDocument()
    expect(screen.getByText('2024-01-01')).toBeInTheDocument()
  })
})

describe('BookList - ソート機能', () => {
  const defaultProps = {
    books: mockBooks,
    onStatusChange: jest.fn(),
    onRemove: jest.fn(),
    sortBy: 'title' as const,
    sortOrder: 'asc' as const,
    onSort: jest.fn()
  }

  test('タイトル昇順ソートが正しく動作する', () => {
    render(<BookList {...defaultProps} />)
    
    const titleHeader = screen.getByRole('columnheader', { name: /タイトル/i })
    fireEvent.click(titleHeader)
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('title', 'asc')
  })

  test('タイトル降順ソートが正しく動作する', () => {
    render(<BookList {...defaultProps} sortOrder="desc" />)
    
    const titleHeader = screen.getByRole('columnheader', { name: /タイトル/i })
    fireEvent.click(titleHeader)
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('title', 'desc')
  })

  test('著者名ソートが正しく動作する', () => {
    render(<BookList {...defaultProps} />)
    
    const authorHeader = screen.getByRole('columnheader', { name: /著者/i })
    fireEvent.click(authorHeader)
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('author', 'asc')
  })

  test('追加日ソートが正しく動作する', () => {
    render(<BookList {...defaultProps} />)
    
    const addedHeader = screen.getByRole('columnheader', { name: /追加日/i })
    fireEvent.click(addedHeader)
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('createdAt', 'asc')
  })

  test('更新日ソートが正しく動作する', () => {
    render(<BookList {...defaultProps} />)
    
    const updatedHeader = screen.getByRole('columnheader', { name: /更新日/i })
    fireEvent.click(updatedHeader)
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('updatedAt', 'asc')
  })
})

describe('BookList - フィルタ表示', () => {
  const defaultProps = {
    books: mockBooks,
    onStatusChange: jest.fn(),
    onRemove: jest.fn(),
    sortBy: 'title' as const,
    sortOrder: 'asc' as const,
    onSort: jest.fn(),
    activeFilters: [
      { type: 'status', value: 'reading', label: '読書中' }
    ],
    onClearFilters: jest.fn()
  }

  test('適用中のステータスフィルタが表示される', () => {
    render(<BookList {...defaultProps} />)
    
    expect(screen.getByText('フィルタ:')).toBeInTheDocument()
    expect(screen.getByText('読書中')).toBeInTheDocument()
  })

  test('複数フィルタが同時に表示される', () => {
    const propsWithMultipleFilters = {
      ...defaultProps,
      activeFilters: [
        { type: 'status', value: 'reading', label: '読書中' },
        { type: 'author', value: 'テスト著者1', label: 'テスト著者1' }
      ]
    }
    
    render(<BookList {...propsWithMultipleFilters} />)
    
    expect(screen.getByText('読書中')).toBeInTheDocument()
    expect(screen.getByText('テスト著者1')).toBeInTheDocument()
  })

  test('フィルタクリア機能が動作する', () => {
    render(<BookList {...defaultProps} />)
    
    const clearButton = screen.getByRole('button', { name: /フィルタをクリア/i })
    fireEvent.click(clearButton)
    
    expect(defaultProps.onClearFilters).toHaveBeenCalled()
  })
})