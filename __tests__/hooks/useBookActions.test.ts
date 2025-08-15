/**
 * useBookActions カスタムフックのテスト
 */

import { renderHook, act } from '@testing-library/react'
import { useBookActions } from '@/hooks/useBookActions'
import { BookStatus } from '@/lib/models/book'
import * as serverActions from '@/lib/server-actions/books'

// Server Actions のモック
jest.mock('@/lib/server-actions/books', () => ({
  updateBookStatus: jest.fn(),
  removeBookFromLibrary: jest.fn()
}))

const mockUpdateBookStatus = serverActions.updateBookStatus as jest.MockedFunction<typeof serverActions.updateBookStatus>
const mockRemoveBookFromLibrary = serverActions.removeBookFromLibrary as jest.MockedFunction<typeof serverActions.removeBookFromLibrary>

describe('useBookActions - ステータス更新', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('書籍ステータスが正常に更新される', async () => {
    const mockUpdatedBook = {
      id: 'user-book-1',
      status: BookStatus.READ,
      book: { title: 'Test Book' }
    }
    
    mockUpdateBookStatus.mockResolvedValue(mockUpdatedBook)
    
    const { result } = renderHook(() => useBookActions())
    
    let updateResult
    await act(async () => {
      updateResult = await result.current.updateStatus('user-book-1', BookStatus.READ)
    })
    
    expect(mockUpdateBookStatus).toHaveBeenCalledWith('user-book-1', BookStatus.READ)
    expect(updateResult).toEqual(mockUpdatedBook)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  test('ステータス更新エラー時にエラーが返される', async () => {
    const mockError = { error: 'Update failed', details: 'Network error' }
    mockUpdateBookStatus.mockResolvedValue(mockError)
    
    const { result } = renderHook(() => useBookActions())
    
    let updateResult
    await act(async () => {
      updateResult = await result.current.updateStatus('user-book-1', BookStatus.READ)
    })
    
    expect(updateResult).toEqual(mockError)
    expect(result.current.error).toEqual(mockError)
    expect(result.current.isLoading).toBe(false)
  })

  test('更新中はloading状態になる', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    
    mockUpdateBookStatus.mockReturnValue(promise)
    
    const { result } = renderHook(() => useBookActions())
    
    // 非同期処理を開始
    act(() => {
      result.current.updateStatus('user-book-1', BookStatus.READ)
    })
    
    // loading状態を確認
    expect(result.current.isLoading).toBe(true)
    
    // 処理完了
    await act(async () => {
      resolvePromise({ id: 'user-book-1', status: BookStatus.READ })
    })
    
    expect(result.current.isLoading).toBe(false)
  })

  test('複数の同時更新が正しく処理される', async () => {
    mockUpdateBookStatus.mockResolvedValue({ id: 'user-book-1', status: BookStatus.READ })
    
    const { result } = renderHook(() => useBookActions())
    
    await act(async () => {
      const promises = [
        result.current.updateStatus('user-book-1', BookStatus.READ),
        result.current.updateStatus('user-book-2', BookStatus.READING)
      ]
      await Promise.all(promises)
    })
    
    expect(mockUpdateBookStatus).toHaveBeenCalledTimes(2)
    expect(result.current.isLoading).toBe(false)
  })
})

describe('useBookActions - 書籍削除', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('書籍が正常に削除される', async () => {
    const mockSuccessResult = { success: true }
    mockRemoveBookFromLibrary.mockResolvedValue(mockSuccessResult)
    
    const { result } = renderHook(() => useBookActions())
    
    let removeResult
    await act(async () => {
      removeResult = await result.current.removeBook('user-book-1')
    })
    
    expect(mockRemoveBookFromLibrary).toHaveBeenCalledWith('user-book-1')
    expect(removeResult).toEqual(mockSuccessResult)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  test('削除エラー時にエラーが返される', async () => {
    const mockError = { error: 'Delete failed', details: 'Unauthorized' }
    mockRemoveBookFromLibrary.mockResolvedValue(mockError)
    
    const { result } = renderHook(() => useBookActions())
    
    let removeResult
    await act(async () => {
      removeResult = await result.current.removeBook('user-book-1')
    })
    
    expect(removeResult).toEqual(mockError)
    expect(result.current.error).toEqual(mockError)
    expect(result.current.isLoading).toBe(false)
  })

  test('削除中はloading状態になる', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    
    mockRemoveBookFromLibrary.mockReturnValue(promise)
    
    const { result } = renderHook(() => useBookActions())
    
    // 非同期処理を開始
    act(() => {
      result.current.removeBook('user-book-1')
    })
    
    // loading状態を確認
    expect(result.current.isLoading).toBe(true)
    
    // 処理完了
    await act(async () => {
      resolvePromise({ success: true })
    })
    
    expect(result.current.isLoading).toBe(false)
  })
})

describe('useBookActions - エラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('ネットワークエラー時の処理', async () => {
    mockUpdateBookStatus.mockRejectedValue(new Error('Network error'))
    
    const { result } = renderHook(() => useBookActions())
    
    let updateResult
    await act(async () => {
      updateResult = await result.current.updateStatus('user-book-1', BookStatus.READ)
    })
    
    expect(result.current.error).toEqual(
      expect.objectContaining({ error: expect.stringContaining('Network error') })
    )
    expect(result.current.isLoading).toBe(false)
  })

  test('エラー状態をクリアできる', async () => {
    const mockError = { error: 'Test error' }
    mockUpdateBookStatus.mockResolvedValue(mockError)
    
    const { result } = renderHook(() => useBookActions())
    
    // エラーを発生させる
    await act(async () => {
      await result.current.updateStatus('user-book-1', BookStatus.READ)
    })
    
    expect(result.current.error).toEqual(mockError)
    
    // エラーをクリア
    act(() => {
      result.current.clearError()
    })
    
    expect(result.current.error).toBeNull()
  })

  test('新しい操作開始時にエラーがクリアされる', async () => {
    const mockError = { error: 'Previous error' }
    mockUpdateBookStatus.mockResolvedValueOnce(mockError)
    
    const { result } = renderHook(() => useBookActions())
    
    // 最初の操作でエラー
    await act(async () => {
      await result.current.updateStatus('user-book-1', BookStatus.READ)
    })
    
    expect(result.current.error).toEqual(mockError)
    
    // 成功する操作を実行
    mockUpdateBookStatus.mockResolvedValueOnce({ id: 'user-book-2', status: BookStatus.READ })
    
    await act(async () => {
      await result.current.updateStatus('user-book-2', BookStatus.READ)
    })
    
    expect(result.current.error).toBeNull()
  })
})