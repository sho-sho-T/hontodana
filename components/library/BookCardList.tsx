'use client'

import { BookCard } from './BookCard'
import type { BookStatus, UserBookWithBook } from '@/lib/models/book'

interface BookCardListProps {
  books: UserBookWithBook[]
  viewMode?: 'grid' | 'list'
  onStatusChange?: (bookId: string, status: BookStatus) => Promise<void> | void
  onRemove?: (bookId: string) => Promise<void> | void
}

export function BookCardList({ 
  books, 
  viewMode = 'grid', 
  onStatusChange,
  onRemove 
}: BookCardListProps) {
  const handleStatusChange = async (bookId: string, status: BookStatus) => {
    if (onStatusChange) {
      await onStatusChange(bookId, status)
    } else {
      console.log('Status changed:', bookId, status)
    }
  }
  
  const handleRemove = async (bookId: string) => {
    if (onRemove) {
      await onRemove(bookId)
    } else {
      console.log('Book removed:', bookId)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          viewMode={viewMode}
          onStatusChange={handleStatusChange}
          onRemove={handleRemove}
        />
      ))}
    </div>
  )
}