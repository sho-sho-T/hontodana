import { ErrorType } from '@/lib/errors/app-error';

// Mock Prisma client using jest.fn() factory
jest.mock('@/lib/prisma', () => ({
  prisma: {
    book: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    userBook: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

import { addBookToLibrary } from '@/app/actions/books';
import { prisma } from '@/lib/prisma';

// Cast to access mocked methods
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const mockBookData = {
  title: 'Test Book',
  authors: ['Test Author'],
  isbn: '1234567890',
  publishedDate: '2024-01-01',
  description: 'Test book description',
  thumbnail: 'https://example.com/thumbnail.jpg'
};

describe('Database Error Handling Integration', () => {
  beforeEach(() => {
    Object.values(mockPrisma).forEach(table => {
      Object.values(table).forEach(method => {
        (method as jest.Mock).mockClear();
      });
    });
  });

  test('should handle database connection failure', async () => {
    // Given
    mockPrisma.book.create.mockRejectedValue(new Error('Connection failed'));
    
    // When
    const result = await addBookToLibrary(mockBookData);
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.DATABASE,
        code: 'CONNECTION_FAILED',
        message: 'データベースに接続できませんでした。',
        context: expect.objectContaining({
          operation: 'addBookToLibrary',
          data: mockBookData,
          timestamp: expect.any(Number)
        })
      }
    });
  });

  test('should handle unique constraint violation', async () => {
    // Given
    mockPrisma.book.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['isbn'] }
    });
    
    // When
    const result = await addBookToLibrary(mockBookData);
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.CONFLICT,
        code: 'BOOK_ALREADY_EXISTS',
        message: 'この書籍は既に登録されています。',
        context: expect.objectContaining({
          operation: 'addBookToLibrary',
          data: mockBookData,
          timestamp: expect.any(Number)
        })
      }
    });
  });

  test('should handle foreign key constraint violation', async () => {
    // Given
    mockPrisma.userBook.create.mockRejectedValue({
      code: 'P2003',
      meta: { field_name: 'userId' }
    });
    
    // When
    const result = await addBookToLibrary(mockBookData);
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.DATABASE,
        code: 'FOREIGN_KEY_VIOLATION',
        message: '関連するデータが見つかりません。',
        context: expect.objectContaining({
          operation: 'addBookToLibrary',
          data: mockBookData,
          timestamp: expect.any(Number)
        })
      }
    });
  });

  test('should handle record not found error', async () => {
    // Given
    mockPrisma.book.findUnique.mockResolvedValue(null);
    
    // When
    const result = await addBookToLibrary(mockBookData);
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.NOT_FOUND,
        code: 'BOOK_NOT_FOUND',
        message: '指定された書籍が見つかりません。',
        context: expect.objectContaining({
          operation: 'addBookToLibrary',
          data: mockBookData,
          timestamp: expect.any(Number)
        })
      }
    });
  });

  test('should handle timeout errors', async () => {
    // Given
    mockPrisma.book.create.mockRejectedValue(new Error('Query timeout'));
    
    // When
    const result = await addBookToLibrary(mockBookData);
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.DATABASE,
        code: 'QUERY_TIMEOUT',
        message: 'データベースの処理がタイムアウトしました。',
        context: expect.objectContaining({
          operation: 'addBookToLibrary',
          data: mockBookData,
          timestamp: expect.any(Number)
        })
      }
    });
  });

  test('should handle validation errors', async () => {
    // Given
    mockPrisma.book.create.mockRejectedValue({
      code: 'P2000',
      message: 'The provided value for the column is too long'
    });
    
    // When
    const result = await addBookToLibrary(mockBookData);
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.VALIDATION,
        code: 'DATABASE_VALIDATION_ERROR',
        message: 'データベースの検証エラーが発生しました。'
      }
    });
  });

  test('should handle transaction rollback', async () => {
    // Given
    mockPrisma.book.create.mockRejectedValue(new Error('Transaction rolled back'));
    
    // When
    const result = await addBookToLibrary(mockBookData);
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.DATABASE,
        code: 'TRANSACTION_FAILED',
        message: 'データの処理中にエラーが発生しました。'
      }
    });
  });

  test('should include database context in error details', async () => {
    // Given
    mockPrisma.book.create.mockRejectedValue(new Error('Connection failed'));
    
    // When
    const result = await addBookToLibrary(mockBookData);
    
    // Then
    expect(result.error?.context).toEqual({
      operation: 'addBookToLibrary',
      data: mockBookData,
      timestamp: expect.any(Number)
    });
  });

  test('should handle concurrent modification errors', async () => {
    // Given
    mockPrisma.book.update.mockRejectedValue({
      code: 'P2034',
      message: 'Transaction failed due to a write conflict or a deadlock'
    });
    
    // When
    const result = await addBookToLibrary(mockBookData);
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.CONFLICT,
        code: 'CONCURRENT_MODIFICATION',
        message: '他のユーザーが同時に変更を行いました。再度お試しください。'
      }
    });
  });
});