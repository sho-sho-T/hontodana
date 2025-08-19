'use client'

import { BookCard } from './BookCard'
import type { BookStatus, UserBookWithBook } from '@/lib/models/book'

interface BookCardListProps {
  books: UserBookWithBook[]
  viewMode?: 'grid' | 'list'
}

export function BookCardList({ books, viewMode = 'grid' }: BookCardListProps) {
  const handleStatusChange = (bookId: string, status: BookStatus) => {
    console.log('Status changed:', bookId, status)
    // TODO: Implement actual status change logic with Server Actions
  }
  
  const handleRemove = (bookId: string) => {
    console.log('Book removed:', bookId)
    // TODO: Implement actual remove logic with Server Actions
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