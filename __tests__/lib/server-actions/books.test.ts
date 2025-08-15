/**
 * books.test.ts - Server Actionsの統合テスト
 */

import { BookStatus, BookType } from '@/lib/models/book'
import type { GoogleBooksApiResponse } from '@/lib/models/book'

// 認証関連のモック
const mockGetUser = jest.fn()
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve({
    auth: {
      getUser: mockGetUser
    }
  })
}))

// Prismaクライアントのモック
jest.mock('@/lib/generated/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    book: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userBook: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    }
  }
}))

// モックユーザー認証を設定する関数
function mockAuth(user: { id: string } | null) {
  mockGetUser.mockResolvedValue({
    data: { user }
  })
}

// テスト用に動的インポート
let addBookToLibrary: any
let updateBookStatus: any
let removeBookFromLibrary: any
let getUserBooks: any

beforeAll(async () => {
  const module = await import('@/lib/server-actions/books')
  addBookToLibrary = module.addBookToLibrary
  updateBookStatus = module.updateBookStatus
  removeBookFromLibrary = module.removeBookFromLibrary
  getUserBooks = module.getUserBooks
})

describe('addBookToLibrary', () => {
  const mockGoogleBookData: GoogleBooksApiResponse = {
    id: 'test-google-id',
    volumeInfo: {
      title: 'テスト書籍',
      authors: ['著者1'],
      publisher: 'テスト出版社'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('新しい書籍を正常にライブラリに追加できる', async () => {
    mockAuth({ id: 'test-user-id' })
    
    const { prisma } = require('@/lib/generated/prisma')
    const mockBook = { 
      id: 'book-id', 
      googleBooksId: 'test-google-id',
      title: 'テスト書籍'
    }
    const mockUserBook = { 
      id: 'user-book-id', 
      userId: 'test-user-id', 
      bookId: 'book-id',
      book: mockBook
    }
    
    mockAuth({ id: 'test-user-id' })
    
    prisma.$transaction.mockImplementation(async (callback) => {
      return callback({
        book: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockBook)
        },
        userBook: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(mockUserBook)
        }
      })
    })

    const result = await addBookToLibrary(mockGoogleBookData)
    
    expect(result).not.toHaveProperty('error')
    expect(result).toEqual(mockUserBook)
  })

  test('未認証ユーザーはエラーになる', async () => {
    mockAuth(null)
    
    const result = await addBookToLibrary(mockGoogleBookData)
    
    expect(result).toEqual({ error: 'Authentication required' })
  })

  test('重複書籍の追加でエラーになる', async () => {
    mockAuth({ id: 'test-user-id' })
    
    const { prisma } = require('@/lib/generated/prisma')
    const mockBook = { id: 'book-id' }
    const existingUserBook = { id: 'existing-user-book' }
    
    prisma.$transaction.mockImplementation(async (callback) => {
      return callback({
        book: {
          findUnique: jest.fn().mockResolvedValue(mockBook),
          create: jest.fn()
        },
        userBook: {
          findUnique: jest.fn().mockResolvedValue(existingUserBook),
          create: jest.fn()
        }
      })
    })

    const result = await addBookToLibrary(mockGoogleBookData)
    
    expect(result).toEqual({ error: 'Book already exists in library' })
  })

  test('無効なGoogle Booksデータでエラーになる', async () => {
    mockAuth({ id: 'test-user-id' })
    
    const invalidData = {
      id: '',
      volumeInfo: { title: '' }
    } as GoogleBooksApiResponse

    const result = await addBookToLibrary(invalidData)
    
    expect(result).toEqual({ error: 'Invalid book data' })
  })

  test('無効なBookStatusでエラーになる', async () => {
    mockAuth({ id: 'test-user-id' })

    const result = await addBookToLibrary(mockGoogleBookData, 'invalid_status' as BookStatus)
    
    expect(result).toEqual({ error: 'Invalid book status' })
  })
})

describe('updateBookStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('読書ステータスを正常に更新できる', async () => {
    mockAuth({ id: 'test-user-id' })
    
    const { prisma } = require('@/lib/generated/prisma')
    const mockUpdatedUserBook = {
      id: 'user-book-id',
      status: BookStatus.READING,
      book: { id: 'book-id', title: 'テスト書籍' }
    }
    
    prisma.userBook.update.mockResolvedValue(mockUpdatedUserBook)

    const result = await updateBookStatus('user-book-id', BookStatus.READING)
    
    expect(result).toEqual(mockUpdatedUserBook)
  })

  test('未認証ユーザーはエラーになる', async () => {
    mockAuth(null)

    const result = await updateBookStatus('user-book-id', BookStatus.READING)
    
    expect(result).toEqual({ error: 'Authentication required' })
  })

  test('存在しない書籍でエラーになる', async () => {
    mockAuth({ id: 'test-user-id' })
    
    const { prisma } = require('@/lib/generated/prisma')
    prisma.userBook.update.mockRejectedValue(new Error('Record not found'))

    const result = await updateBookStatus('non-existing-id', BookStatus.READING)
    
    expect(result).toEqual({ error: 'Book not found or access denied' })
  })
})

describe('removeBookFromLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('書籍をライブラリから削除できる', async () => {
    mockAuth({ id: 'test-user-id' })
    
    const { prisma } = require('@/lib/generated/prisma')
    prisma.userBook.delete.mockResolvedValue({ id: 'deleted-id' })

    const result = await removeBookFromLibrary('user-book-id')
    
    expect(result).toEqual({ success: true })
  })

  test('未認証ユーザーはエラーになる', async () => {
    mockAuth(null)

    const result = await removeBookFromLibrary('user-book-id')
    
    expect(result).toEqual({ error: 'Authentication required' })
  })

  test('存在しない書籍でエラーになる', async () => {
    mockAuth({ id: 'test-user-id' })
    
    const { prisma } = require('@/lib/generated/prisma')
    prisma.userBook.delete.mockRejectedValue(new Error('Record not found'))

    const result = await removeBookFromLibrary('non-existing-id')
    
    expect(result).toEqual({ error: 'Book not found or access denied' })
  })
})

describe('getUserBooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('ユーザーの全書籍を取得できる', async () => {
    mockAuth({ id: 'test-user-id' })
    
    const { prisma } = require('@/lib/generated/prisma')
    const mockUserBooks = [
      { id: '1', book: { title: '書籍1' } },
      { id: '2', book: { title: '書籍2' } }
    ]
    
    prisma.userBook.findMany.mockResolvedValue(mockUserBooks)

    const result = await getUserBooks()
    
    expect(result).toEqual(mockUserBooks)
  })

  test('ステータスでフィルタリングできる', async () => {
    mockAuth({ id: 'test-user-id' })
    
    const { prisma } = require('@/lib/generated/prisma')
    const mockFilteredBooks = [
      { id: '1', status: BookStatus.READING, book: { title: '読書中の本' } }
    ]
    
    prisma.userBook.findMany.mockResolvedValue(mockFilteredBooks)

    const result = await getUserBooks(BookStatus.READING)
    
    expect(result).toEqual(mockFilteredBooks)
  })

  test('未認証ユーザーはエラーになる', async () => {
    mockAuth(null)

    const result = await getUserBooks()
    
    expect(result).toEqual({ error: 'Authentication required' })
  })

  test('無効なlimitでエラーになる', async () => {
    mockAuth({ id: 'test-user-id' })

    const result = await getUserBooks(undefined, 101) // 上限超過
    
    expect(result).toEqual({ error: 'Limit must be between 1 and 100' })
  })

  test('負のoffsetでエラーになる', async () => {
    mockAuth({ id: 'test-user-id' })

    const result = await getUserBooks(undefined, 50, -1)
    
    expect(result).toEqual({ error: 'Offset must be non-negative' })
  })
})