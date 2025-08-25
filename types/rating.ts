// Rating・Review関連の型定義

// 星評価の型（1-5の整数またはnull）
export type Rating = 1 | 2 | 3 | 4 | 5 | null;

// レビューテキストの型
export type Review = string | null;

// 評価・レビュー更新用のデータ型
export interface UpdateRatingData {
  userBookId: string;
  rating: Rating;
}

export interface UpdateReviewData {
  userBookId: string;
  review: Review;
}

export interface UpdateRatingAndReviewData {
  userBookId: string;
  rating: Rating;
  review: Review;
}

// 評価統計の型
export interface RatingStats {
  averageRating: number | null;
  totalRated: number;
  totalBooks: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  reviewsCount: number;
}

// 評価分布の型
export interface RatingDistribution {
  rating: 1 | 2 | 3 | 4 | 5;
  count: number;
  percentage: number;
}

// 書籍評価・レビュー表示用の型
export interface BookWithRating {
  userBookId: string;
  rating: Rating;
  review: Review;
  reviewDate: Date | null;
  book: {
    id: string;
    title: string;
    authors: string[];
    thumbnailUrl: string | null;
  };
}

// 評価・レビューフィルタの型
export interface RatingFilters {
  rating?: Rating;
  hasReview?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'rating' | 'reviewDate' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Server Action用の結果型
export interface RatingActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// StarRatingコンポーネント用の型
export interface StarRatingProps {
  rating: Rating;
  onChange?: (rating: Rating) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

// ReviewEditorコンポーネント用の型
export interface ReviewEditorProps {
  review: Review;
  onSave?: (review: Review) => Promise<void> | void;
  onCancel?: () => void;
  readonly?: boolean;
  placeholder?: string;
  className?: string;
}

// ReviewDisplayコンポーネント用の型
export interface ReviewDisplayProps {
  review: Review;
  reviewDate?: Date | null;
  showEditButton?: boolean;
  onEdit?: () => void;
  maxLength?: number;
  expandable?: boolean;
}

// RatingStatsCardコンポーネント用の型
export interface RatingStatsCardProps {
  stats: RatingStats | null;
  loading?: boolean;
  className?: string;
}

// バリデーション用のスキーマ型
export interface RatingValidationSchema {
  rating: Rating;
  review: Review;
}

// 評価・レビュー履歴の型
export interface RatingHistory {
  id: string;
  userBookId: string;
  previousRating: Rating;
  newRating: Rating;
  previousReview: Review;
  newReview: Review;
  updatedAt: Date;
}

// エラーメッセージの型
export interface RatingErrorMessages {
  INVALID_RATING: string;
  REVIEW_TOO_LONG: string;
  BOOK_NOT_FOUND: string;
  PERMISSION_DENIED: string;
  SAVE_FAILED: string;
}

// 定数定義
export const RATING_CONSTANTS = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  MAX_REVIEW_LENGTH: 2000,
  STATS_CACHE_TTL: 300000, // 5分
} as const;

// 評価ラベルのマッピング
export const RATING_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '不満',
  2: 'いまいち',
  3: '普通',
  4: '良い',
  5: '最高',
} as const;

// 評価カラーのマッピング
export const RATING_COLORS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#ef4444', // red-500
  2: '#f97316', // orange-500
  3: '#eab308', // yellow-500
  4: '#22c55e', // green-500
  5: '#10b981', // emerald-500
} as const;

// 型ガード関数
export function isValidRating(value: any): value is Rating {
  return value === null || (Number.isInteger(value) && value >= 1 && value <= 5);
}

export function isValidReview(value: any): value is Review {
  return value === null || (typeof value === 'string' && value.length <= RATING_CONSTANTS.MAX_REVIEW_LENGTH);
}

// ユーティリティ型
export type RatingValue = Exclude<Rating, null>; // 1-5の値のみ
export type NonEmptyReview = Exclude<Review, null | ''>; // 空でないレビュー