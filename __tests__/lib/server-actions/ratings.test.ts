import { 
  updateBookRating,
  updateBookReview,
  updateBookRatingAndReview,
  getUserRatingStats,
  getBooksWithRatings
} from '@/lib/server-actions/ratings';
import { prisma } from '@/lib/prisma';
import type { UpdateRatingData, UpdateReviewData, UpdateRatingAndReviewData } from '@/types/rating';

// Prismaのモック
jest.mock('@/lib/prisma', () => ({
  prisma: {
    userBook: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// AuthのモックUser
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

jest.mock('@/lib/supabase/server', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve(mockUser)),
}));

const prismaMock = prisma as jest.Mocked<typeof prisma>;

describe('Rating Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateBookRating', () => {
    test('should update book rating with valid value', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const rating = 4;
      
      const mockUserBook = {
        id: userBookId,
        userId: 'user-123',
        bookId: 'book-123',
        rating: null,
      };

      const updatedUserBook = {
        ...mockUserBook,
        rating: 4,
        updatedAt: new Date(),
      };

      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);
      prismaMock.userBook.update.mockResolvedValue(updatedUserBook as any);

      const result = await updateBookRating(userBookId, rating);

      expect(result.success).toBe(true);
      expect(result.data.rating).toBe(4);
      expect(prismaMock.userBook.update).toHaveBeenCalledWith({
        where: { id: userBookId },
        data: { rating: 4 },
      });
    });

    test('should clear book rating with null value', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const rating = null;
      
      const mockUserBook = {
        id: userBookId,
        userId: 'user-123',
        rating: 3,
      };

      const updatedUserBook = {
        ...mockUserBook,
        rating: null,
      };

      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);
      prismaMock.userBook.update.mockResolvedValue(updatedUserBook as any);

      const result = await updateBookRating(userBookId, rating);

      expect(result.success).toBe(true);
      expect(result.data.rating).toBeNull();
    });

    test('should update rating for all valid values 1-5', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const mockUserBook = {
        id: userBookId,
        userId: 'user-123',
        rating: null,
      };

      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);

      for (const rating of [1, 2, 3, 4, 5]) {
        const updatedUserBook = { ...mockUserBook, rating };
        prismaMock.userBook.update.mockResolvedValue(updatedUserBook as any);

        const result = await updateBookRating(userBookId, rating);

        expect(result.success).toBe(true);
        expect(result.data.rating).toBe(rating);
      }
    });

    test('should fail with invalid rating value', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      
      // 範囲外の値をテスト
      const invalidRatings = [0, 6, -1, 10, 3.5];
      
      for (const rating of invalidRatings) {
        const result = await updateBookRating(userBookId, rating as any);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('評価は1-5の整数値');
      }
    });

    test('should fail with non-existent userBook', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const rating = 4;

      prismaMock.userBook.findUnique.mockResolvedValue(null);

      const result = await updateBookRating(userBookId, rating);

      expect(result.success).toBe(false);
      expect(result.error).toContain('書籍が見つかりません');
    });

    test('should fail when user is not owner', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const rating = 4;

      const mockUserBook = {
        id: userBookId,
        userId: 'other-user-456',
        rating: null,
      };

      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);

      const result = await updateBookRating(userBookId, rating);

      expect(result.success).toBe(false);
      expect(result.error).toContain('権限がありません');
    });

    test('should fail with invalid UUID format', async () => {
      const userBookId = 'invalid-uuid';
      const rating = 4;

      const result = await updateBookRating(userBookId, rating);

      expect(result.success).toBe(false);
      expect(result.error).toContain('無効な書籍ID');
    });
  });

  describe('updateBookReview', () => {
    test('should update book review with valid text', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const review = '素晴らしい本でした。特に第3章の内容が印象的で、著者の深い洞察に感動しました。';
      
      const mockUserBook = {
        id: userBookId,
        userId: 'user-123',
        review: null,
      };

      const updatedUserBook = {
        ...mockUserBook,
        review,
        updatedAt: new Date(),
      };

      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);
      prismaMock.userBook.update.mockResolvedValue(updatedUserBook as any);

      const result = await updateBookReview(userBookId, review);

      expect(result.success).toBe(true);
      expect(result.data.review).toBe(review);
    });

    test('should clear book review with null value', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const review = null;
      
      const mockUserBook = {
        id: userBookId,
        userId: 'user-123',
        review: '既存のレビュー',
      };

      const updatedUserBook = {
        ...mockUserBook,
        review: null,
      };

      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);
      prismaMock.userBook.update.mockResolvedValue(updatedUserBook as any);

      const result = await updateBookReview(userBookId, review);

      expect(result.success).toBe(true);
      expect(result.data.review).toBeNull();
    });

    test('should handle empty string review', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const review = '';
      
      const mockUserBook = {
        id: userBookId,
        userId: 'user-123',
        review: null,
      };

      const updatedUserBook = {
        ...mockUserBook,
        review: null, // 空文字列はnullに変換
      };

      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);
      prismaMock.userBook.update.mockResolvedValue(updatedUserBook as any);

      const result = await updateBookReview(userBookId, review);

      expect(result.success).toBe(true);
      expect(result.data.review).toBeNull();
    });

    test('should handle review with maximum length', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const review = 'a'.repeat(2000); // 最大文字数
      
      const mockUserBook = {
        id: userBookId,
        userId: 'user-123',
        review: null,
      };

      const updatedUserBook = {
        ...mockUserBook,
        review,
      };

      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);
      prismaMock.userBook.update.mockResolvedValue(updatedUserBook as any);

      const result = await updateBookReview(userBookId, review);

      expect(result.success).toBe(true);
      expect(result.data.review).toBe(review);
    });

    test('should fail with review exceeding maximum length', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const review = 'a'.repeat(2001); // 最大文字数超過

      const result = await updateBookReview(userBookId, review);

      expect(result.success).toBe(false);
      expect(result.error).toContain('2000文字以下');
    });

    test('should fail with non-existent userBook', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const review = 'テストレビュー';

      prismaMock.userBook.findUnique.mockResolvedValue(null);

      const result = await updateBookReview(userBookId, review);

      expect(result.success).toBe(false);
      expect(result.error).toContain('書籍が見つかりません');
    });

    test('should fail when user is not owner', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const review = 'テストレビュー';

      const mockUserBook = {
        id: userBookId,
        userId: 'other-user-456',
        review: null,
      };

      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);

      const result = await updateBookReview(userBookId, review);

      expect(result.success).toBe(false);
      expect(result.error).toContain('権限がありません');
    });
  });

  describe('updateBookRatingAndReview', () => {
    test('should update both rating and review simultaneously', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const rating = 5;
      const review = '最高の一冊でした！';
      
      const mockUserBook = {
        id: userBookId,
        userId: 'user-123',
        rating: null,
        review: null,
      };

      const updatedUserBook = {
        ...mockUserBook,
        rating,
        review,
        updatedAt: new Date(),
      };

      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);
      prismaMock.userBook.update.mockResolvedValue(updatedUserBook as any);

      const result = await updateBookRatingAndReview(userBookId, rating, review);

      expect(result.success).toBe(true);
      expect(result.data.rating).toBe(rating);
      expect(result.data.review).toBe(review);
      expect(prismaMock.userBook.update).toHaveBeenCalledWith({
        where: { id: userBookId },
        data: { rating, review },
      });
    });

    test('should handle partial updates (rating only)', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const rating = 3;
      const review = null;
      
      const mockUserBook = {
        id: userBookId,
        userId: 'user-123',
        rating: null,
        review: '既存のレビュー',
      };

      const updatedUserBook = {
        ...mockUserBook,
        rating,
        review, // nullに更新
      };

      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);
      prismaMock.userBook.update.mockResolvedValue(updatedUserBook as any);

      const result = await updateBookRatingAndReview(userBookId, rating, review);

      expect(result.success).toBe(true);
      expect(result.data.rating).toBe(rating);
      expect(result.data.review).toBeNull();
    });

    test('should handle partial updates (review only)', async () => {
      const userBookId = '550e8400-e29b-41d4-a716-446655440000';
      const rating = null;
      const review = '新しいレビュー';
      
      const mockUserBook = {
        id: userBookId,
        userId: 'user-123',
        rating: 4,
        review: null,
      };

      const updatedUserBook = {
        ...mockUserBook,
        rating, // nullに更新
        review,
      };

      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);
      prismaMock.userBook.update.mockResolvedValue(updatedUserBook as any);

      const result = await updateBookRatingAndReview(userBookId, rating, review);

      expect(result.success).toBe(true);
      expect(result.data.rating).toBeNull();
      expect(result.data.review).toBe(review);
    });
  });

  describe('getUserRatingStats', () => {
    test('should calculate rating statistics correctly', async () => {
      const mockUserBooks = [
        { rating: 5, review: 'Great!' },
        { rating: 4, review: null },
        { rating: 4, review: 'Good' },
        { rating: 3, review: null },
        { rating: 5, review: 'Amazing' },
        { rating: null, review: 'No rating' }, // 統計から除外
      ];

      prismaMock.userBook.findMany.mockResolvedValue(mockUserBooks as any);

      const result = await getUserRatingStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        averageRating: 4.2, // (5+4+4+3+5)/5 = 4.2
        totalRated: 5,
        totalBooks: 6,
        distribution: {
          1: 0,
          2: 0,
          3: 1,
          4: 2,
          5: 2,
        },
        reviewsCount: 4, // レビューあり
      });
    });

    test('should handle no rated books', async () => {
      const mockUserBooks = [
        { rating: null, review: null },
        { rating: null, review: 'Review only' },
      ];

      prismaMock.userBook.findMany.mockResolvedValue(mockUserBooks as any);

      const result = await getUserRatingStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        averageRating: null,
        totalRated: 0,
        totalBooks: 2,
        distribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        reviewsCount: 1,
      });
    });

    test('should handle empty book list', async () => {
      prismaMock.userBook.findMany.mockResolvedValue([]);

      const result = await getUserRatingStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        averageRating: null,
        totalRated: 0,
        totalBooks: 0,
        distribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        reviewsCount: 0,
      });
    });
  });

  describe('getBooksWithRatings', () => {
    test('should return books with ratings and reviews', async () => {
      const mockUserBooks = [
        {
          id: 'ub-1',
          rating: 5,
          review: 'Excellent book!',
          updatedAt: new Date('2024-01-15'),
          book: {
            id: 'book-1',
            title: 'Test Book 1',
            authors: ['Author 1'],
            thumbnailUrl: 'http://example.com/thumb1.jpg',
          },
        },
        {
          id: 'ub-2',
          rating: 3,
          review: null,
          updatedAt: new Date('2024-01-10'),
          book: {
            id: 'book-2',
            title: 'Test Book 2',
            authors: ['Author 2'],
            thumbnailUrl: null,
          },
        },
      ];

      prismaMock.userBook.findMany.mockResolvedValue(mockUserBooks as any);

      const result = await getBooksWithRatings();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        userBookId: 'ub-1',
        rating: 5,
        review: 'Excellent book!',
        reviewDate: new Date('2024-01-15'),
        book: {
          id: 'book-1',
          title: 'Test Book 1',
          authors: ['Author 1'],
          thumbnailUrl: 'http://example.com/thumb1.jpg',
        },
      });
    });

    test('should filter by rating', async () => {
      const mockUserBooks = [
        { id: 'ub-1', rating: 5, book: { title: 'Book 1' } },
        { id: 'ub-2', rating: 4, book: { title: 'Book 2' } },
      ];

      prismaMock.userBook.findMany.mockResolvedValue([mockUserBooks[0]] as any);

      const result = await getBooksWithRatings({ rating: 5 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].rating).toBe(5);
      expect(prismaMock.userBook.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', rating: 5 },
        include: { book: expect.any(Object) },
        orderBy: { updatedAt: 'desc' },
      });
    });

    test('should filter by hasReview', async () => {
      const mockUserBooks = [
        { id: 'ub-1', rating: 5, review: 'Great!', book: { title: 'Book 1' } },
      ];

      prismaMock.userBook.findMany.mockResolvedValue(mockUserBooks as any);

      const result = await getBooksWithRatings({ hasReview: true });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(prismaMock.userBook.findMany).toHaveBeenCalledWith({
        where: { 
          userId: 'user-123', 
          review: { not: null },
        },
        include: { book: expect.any(Object) },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });
});