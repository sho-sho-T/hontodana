/**
 * 書籍操作カスタムフック
 */

import { useState } from 'react'
import { updateBookStatus, removeBookFromLibrary } from '@/lib/server-actions/books'
import type { BookStatus, ServerActionResult, UserBookWithBook } from '@/lib/models/book'

interface UseBookActionsResult {
  updateStatus: (bookId: string, status: BookStatus) => Promise<ServerActionResult<UserBookWithBook>>
  removeBook: (bookId: string) => Promise<ServerActionResult<{ success: boolean }>>
  isLoading: boolean
  error: { error: string } | null
  clearError: () => void
}

export function useBookActions(): UseBookActionsResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<{ error: string } | null>(null)

  const updateStatus = async (bookId: string, status: BookStatus) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateBookStatus(bookId, status)
      
      if ('error' in result) {
        setError(result)
      }
      
      return result
    } catch (err) {
      const errorObj = { error: err instanceof Error ? err.message : 'Unknown error' }
      setError(errorObj)
      return errorObj
    } finally {
      setIsLoading(false)
    }
  }

  const removeBook = async (bookId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await removeBookFromLibrary(bookId)
      
      if ('error' in result) {
        setError(result)
      }
      
      return result
    } catch (err) {
      const errorObj = { error: err instanceof Error ? err.message : 'Unknown error' }
      setError(errorObj)
      return errorObj
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    updateStatus,
    removeBook,
    isLoading,
    error,
    clearError
  }
}