/**
 * テスト用の書籍データ fixtures
 */

import { BookStatus, BookType } from '@/lib/models/book'
import type { UserBookWithBook } from '@/lib/models/book'

export const mockBook = {
  id: 'book-1',
  googleBooksId: 'google-book-1',
  title: 'テスト書籍のタイトル',
  authors: ['テスト著者1', 'テスト著者2'],
  publisher: 'テスト出版社',
  publishedDate: '2023-01-01',
  isbn10: '1234567890',
  isbn13: '9781234567890',
  pageCount: 300,
  language: 'ja',
  description: 'これはテスト用の書籍説明です。',
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  previewLink: 'https://example.com/preview',
  infoLink: 'https://example.com/info',
  categories: ['Fiction', 'Test'],
  averageRating: 4.5,
  ratingsCount: 100,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
}

export const mockUserBook: UserBookWithBook = {
  id: 'user-book-1',
  userId: 'user-1',
  bookId: 'book-1',
  status: BookStatus.READING,
  bookType: BookType.PHYSICAL,
  progress: 150,
  startDate: new Date('2024-01-01'),
  finishDate: null,
  rating: null,
  review: null,
  notes: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  book: mockBook
}

export const mockBooks: UserBookWithBook[] = [
  mockUserBook,
  {
    id: 'user-book-2',
    userId: 'user-1',
    bookId: 'book-2',
    status: BookStatus.WANT_TO_READ,
    bookType: BookType.KINDLE,
    progress: 0,
    startDate: null,
    finishDate: null,
    rating: null,
    review: null,
    notes: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    book: {
      ...mockBook,
      id: 'book-2',
      googleBooksId: 'google-book-2',
      title: '読みたい本',
      authors: ['別の著者'],
      thumbnailUrl: null // 書影なしの場合をテスト
    }
  },
  {
    id: 'user-book-3',
    userId: 'user-1',
    bookId: 'book-3',
    status: BookStatus.READ,
    bookType: BookType.EPUB,
    progress: 250,
    startDate: new Date('2023-12-01'),
    finishDate: new Date('2023-12-25'),
    rating: 5,
    review: '素晴らしい本でした！',
    notes: null,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2023-12-25'),
    book: {
      ...mockBook,
      id: 'book-3',
      googleBooksId: 'google-book-3',
      title: '読了済みの本',
      authors: ['完読著者'],
      pageCount: 250
    }
  }
]

/**
 * カスタムな書籍データを作成するファクトリー関数
 */
export const createMockBook = (overrides?: Partial<UserBookWithBook>): UserBookWithBook => {
  return {
    ...mockUserBook,
    ...overrides,
    book: {
      ...mockUserBook.book,
      ...(overrides?.book || {})
    }
  }
}

/**
 * 空の書籍リスト
 */
export const emptyBooks: UserBookWithBook[] = []

/**
 * テスト用のデータベース操作ヘルパー関数
 */
import { prisma } from '@/lib/generated/prisma'

export const createTestUser = async (overrides = {}) => {
  return await prisma.userProfile.create({
    data: {
      id: 'test-user-id',
      name: 'テストユーザー',
      ...overrides
    }
  })
}

export const createTestBook = async (overrides = {}) => {
  return await prisma.book.create({
    data: {
      title: 'テスト書籍',
      authors: ['テスト著者'],
      pageCount: 300,
      ...overrides
    }
  })
}

export const createTestUserBook = async (overrides = {}) => {
  let book
  if (overrides.book) {
    book = await createTestBook(overrides.book)
    delete overrides.book
  } else {
    book = await createTestBook()
  }
  
  return await prisma.userBook.create({
    data: {
      userId: 'test-user-id',
      bookId: book.id,
      status: 'want_to_read',
      currentPage: 0,
      ...overrides
    },
    include: {
      book: true
    }
  })
}

export const createTestReadingSession = async (overrides = {}) => {
  const sessionDate = overrides.sessionDate || new Date()
  const pagesRead = (overrides.endPage || 20) - (overrides.startPage || 1) + 1
  
  return await prisma.readingSession.create({
    data: {
      userBookId: 'test-user-book-id',
      startPage: 1,
      endPage: 20,
      pagesRead,
      sessionDate,
      durationMinutes: 30,
      ...overrides
    }
  })
}