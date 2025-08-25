'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/supabase/server';
import { COLLECTION_ERROR_MESSAGES } from '@/lib/constants/error-messages';
import type { 
  Rating,
  Review,
  RatingStats,
  BookWithRating,
  RatingFilters,
  RatingActionResult
} from '@/types/rating';
import { z } from 'zod';

// バリデーションスキーマ
const ratingSchema = z.union([
  z.number().int().min(1).max(5),
  z.null()
]);

const reviewSchema = z.union([
  z.string().max(2000),
  z.null()
]);

const userBookIdSchema = z.string().uuid();

const updateRatingSchema = z.object({
  userBookId: userBookIdSchema,
  rating: ratingSchema,
});

const updateReviewSchema = z.object({
  userBookId: userBookIdSchema,
  review: reviewSchema,
});

const updateRatingAndReviewSchema = z.object({
  userBookId: userBookIdSchema,
  rating: ratingSchema,
  review: reviewSchema,
});

const ratingFiltersSchema = z.object({
  rating: ratingSchema.optional(),
  hasReview: z.boolean().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  sortBy: z.enum(['rating', 'reviewDate', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
}).optional();

/**
 * 共通のUserBook権限チェック関数
 */
/**
 * 認証・権限チェックと基本バリデーションを行う共通関数
 */
/**
 * 評価とレビューの複合バリデーション
 */
/**
 * 共通エラーハンドラー
 */
function handleRatingError(error: unknown, operation: string): RatingActionResult {
  console.error(`Failed to ${operation}:`, error);
  
  // 操作タイプによるエラーメッセージの選択
  const errorMessage = operation.includes('stats') 
    ? COLLECTION_ERROR_MESSAGES.RATING_STATS_GET_FAILED
    : operation.includes('get books')
    ? COLLECTION_ERROR_MESSAGES.RATED_BOOKS_GET_FAILED
    : operation.includes('review')
    ? COLLECTION_ERROR_MESSAGES.REVIEW_UPDATE_FAILED
    : COLLECTION_ERROR_MESSAGES.RATING_UPDATE_FAILED;

  return {
    success: false,
    error: errorMessage,
  };
}

function validateRatingAndReview(rating: Rating, review: Review): { success: false; error: string } | { success: true; processedReview: Review } {
  const processedReview = normalizeReview(review);

  // 評価バリデーション
  if (rating !== undefined && rating !== null) {
    const ratingValidation = ratingSchema.safeParse(rating);
    if (!ratingValidation.success) {
      return {
        success: false,
        error: COLLECTION_ERROR_MESSAGES.INVALID_RATING,
      };
    }
  }

  // レビューバリデーション
  if (processedReview !== null) {
    const reviewValidation = reviewSchema.safeParse(processedReview);
    if (!reviewValidation.success) {
      return {
        success: false,
        error: COLLECTION_ERROR_MESSAGES.INVALID_REVIEW_LENGTH,
      };
    }
  }

  return { success: true, processedReview };
}

async function validateUserAndPermission(
  userBookId: string
): Promise<{ success: false; error: string } | { success: true; user: { id: string } }> {
  // 認証チェック
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: COLLECTION_ERROR_MESSAGES.AUTH_REQUIRED,
    };
  }

  // UUID形式の事前チェック
  const uuidValidation = userBookIdSchema.safeParse(userBookId);
  if (!uuidValidation.success) {
    return {
      success: false,
      error: COLLECTION_ERROR_MESSAGES.INVALID_BOOK_ID,
    };
  }

  // 権限チェック
  const permissionCheck = await checkUserBookPermission(userBookId, user.id);
  if (!permissionCheck.success) {
    return { success: false, error: permissionCheck.error };
  }

  return { success: true, user };
}

/**
 * 空文字列をnullに正規化する共通関数
 */
function normalizeReview(review: Review): Review {
  return review === '' ? null : review;
}

async function checkUserBookPermission(userBookId: string, userId: string) {
  const userBook = await prisma.userBook.findUnique({
    where: { id: userBookId },
    select: { id: true, userId: true },
  });

  if (!userBook) {
    return {
      success: false,
      error: COLLECTION_ERROR_MESSAGES.BOOK_NOT_FOUND,
    };
  }

  if (userBook.userId !== userId) {
    return {
      success: false,
      error: COLLECTION_ERROR_MESSAGES.PERMISSION_DENIED,
    };
  }

  return { success: true, userBook };
}

/**
 * 書籍の星評価を更新します
 */
export async function updateBookRating(
  userBookId: string, 
  rating: Rating
): Promise<RatingActionResult> {
  try {
    // 認証・権限・基本バリデーションチェック
    const authResult = await validateUserAndPermission(userBookId);
    if (!authResult.success) {
      return authResult;
    }

    // 評価バリデーション
    const ratingValidation = ratingSchema.safeParse(rating);
    if (!ratingValidation.success) {
      return {
        success: false,
        error: COLLECTION_ERROR_MESSAGES.INVALID_RATING,
      };
    }

    // 評価更新
    const updatedUserBook = await prisma.userBook.update({
      where: { id: userBookId },
      data: { rating },
    });

    return {
      success: true,
      data: updatedUserBook,
    };
  } catch (error) {
    return handleRatingError(error, 'update book rating');
  }
}

/**
 * 書籍のレビューを更新します
 */
export async function updateBookReview(
  userBookId: string,
  review: Review
): Promise<RatingActionResult> {
  try {
    // 認証・権限・基本バリデーションチェック
    const authResult = await validateUserAndPermission(userBookId);
    if (!authResult.success) {
      return authResult;
    }

    // 空文字列をnullに変換
    const processedReview = normalizeReview(review);

    // レビューバリデーション
    const reviewValidation = reviewSchema.safeParse(processedReview);
    if (!reviewValidation.success) {
      return {
        success: false,
        error: COLLECTION_ERROR_MESSAGES.INVALID_REVIEW_LENGTH,
      };
    }

    // レビュー更新
    const updatedUserBook = await prisma.userBook.update({
      where: { id: userBookId },
      data: { review: processedReview },
    });

    return {
      success: true,
      data: updatedUserBook,
    };
  } catch (error) {
    return handleRatingError(error, 'update book review');
  }
}

/**
 * 書籍の評価とレビューを同時に更新します
 */
export async function updateBookRatingAndReview(
  userBookId: string,
  rating: Rating,
  review: Review
): Promise<RatingActionResult> {
  try {
    // 認証・権限・基本バリデーションチェック
    const authResult = await validateUserAndPermission(userBookId);
    if (!authResult.success) {
      return authResult;
    }

    // 評価・レビュー複合バリデーション
    const validationResult = validateRatingAndReview(rating, review);
    if (!validationResult.success) {
      return validationResult;
    }

    // 評価・レビュー同時更新
    const updatedUserBook = await prisma.userBook.update({
      where: { id: userBookId },
      data: {
        rating,
        review: validationResult.processedReview,
      },
    });

    return {
      success: true,
      data: updatedUserBook,
    };
  } catch (error) {
    return handleRatingError(error, 'update book rating and review');
  }
}

/**
 * ユーザーの評価統計を取得します
 */
export async function getUserRatingStats(): Promise<RatingActionResult<RatingStats>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: COLLECTION_ERROR_MESSAGES.AUTH_REQUIRED,
      };
    }

    // ユーザーの全書籍データを取得
    const userBooks = await prisma.userBook.findMany({
      where: { userId: user.id },
      select: {
        rating: true,
        review: true,
      },
    });

    // 統計計算
    const totalBooks = userBooks.length;
    const ratedBooks = userBooks.filter(book => book.rating !== null);
    const totalRated = ratedBooks.length;
    const reviewsCount = userBooks.filter(book => 
      book.review !== null && 
      typeof book.review === 'string' && 
      book.review.trim() !== ''
    ).length;

    // 平均評価計算
    let averageRating: number | null = null;
    if (totalRated > 0) {
      const ratingSum = ratedBooks.reduce((sum, book) => sum + (book.rating || 0), 0);
      averageRating = Math.round((ratingSum / totalRated) * 10) / 10; // 小数点第1位まで
    }

    // 評価分布計算
    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratedBooks.forEach(book => {
      if (book.rating && book.rating >= 1 && book.rating <= 5) {
        distribution[book.rating as 1 | 2 | 3 | 4 | 5]++;
      }
    });

    const stats: RatingStats = {
      averageRating,
      totalRated,
      totalBooks,
      distribution,
      reviewsCount,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    return handleRatingError(error, 'get user rating stats');
  }
}

/**
 * 評価・レビュー付きの書籍一覧を取得します
 */
export async function getBooksWithRatings(
  filters?: RatingFilters
): Promise<RatingActionResult<BookWithRating[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: COLLECTION_ERROR_MESSAGES.AUTH_REQUIRED,
      };
    }

    // フィルター条件のバリデーション
    const validatedFilters = filters ? ratingFiltersSchema.parse(filters) : {};

    // WHERE条件を構築
    const whereConditions: any = {
      userId: user.id,
    };

    if (validatedFilters?.rating !== undefined) {
      whereConditions.rating = validatedFilters.rating;
    }

    if (validatedFilters?.hasReview === true) {
      whereConditions.review = { not: null };
    } else if (validatedFilters?.hasReview === false) {
      whereConditions.review = null;
    }

    if (validatedFilters?.dateFrom || validatedFilters?.dateTo) {
      whereConditions.updatedAt = {};
      if (validatedFilters.dateFrom) {
        whereConditions.updatedAt.gte = validatedFilters.dateFrom;
      }
      if (validatedFilters.dateTo) {
        whereConditions.updatedAt.lte = validatedFilters.dateTo;
      }
    }

    // ORDER BY条件を構築
    let orderBy: any = { updatedAt: 'desc' }; // デフォルト
    
    if (validatedFilters?.sortBy) {
      const sortOrder = validatedFilters.sortOrder || 'desc';
      switch (validatedFilters.sortBy) {
        case 'rating':
          orderBy = { rating: sortOrder };
          break;
        case 'reviewDate':
          orderBy = { updatedAt: sortOrder };
          break;
        case 'title':
          orderBy = { book: { title: sortOrder } };
          break;
      }
    }

    // データ取得
    const userBooks = await prisma.userBook.findMany({
      where: whereConditions,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy,
    });

    // レスポンス用データに変換
    const booksWithRating: BookWithRating[] = userBooks.map(userBook => ({
      userBookId: userBook.id,
      rating: userBook.rating as Rating,
      review: userBook.review as Review,
      reviewDate: userBook.updatedAt,
      book: {
        id: userBook.book.id,
        title: userBook.book.title,
        authors: userBook.book.authors,
        thumbnailUrl: userBook.book.thumbnailUrl,
      },
    }));

    return {
      success: true,
      data: booksWithRating,
    };
  } catch (error) {
    return handleRatingError(error, 'get books with ratings');
  }
}