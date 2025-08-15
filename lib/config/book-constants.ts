/**
 * 書籍関連の定数定義
 */

export const BOOK_LIMITS = {
  TITLE_MAX_LENGTH: 500,
  AUTHOR_MAX_LENGTH: 500,
  PUBLISHER_MAX_LENGTH: 500,
  DESCRIPTION_MAX_LENGTH: 10000,
  LANGUAGE_MIN_LENGTH: 2,
  LANGUAGE_MAX_LENGTH: 10,
  MAX_AUTHORS: 10,
  MAX_CATEGORIES: 20,
  MIN_PAGE_COUNT: 1,
  MAX_PAGE_COUNT: 10000,
  MIN_RATING: 0,
  MAX_RATING: 5,
} as const

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  MIN_OFFSET: 0,
} as const

export const ERROR_MESSAGES = {
  // Authentication
  AUTH_REQUIRED: 'Authentication required',
  INVALID_USER_ID: 'Invalid User ID format',
  
  // Book data validation
  GOOGLE_BOOKS_ID_REQUIRED: 'Google Books ID is required',
  TITLE_REQUIRED: 'Title is required',
  TITLE_TOO_LONG: `Title must be ${BOOK_LIMITS.TITLE_MAX_LENGTH} characters or less`,
  AUTHORS_MUST_BE_ARRAY: 'Authors must be an array',
  AUTHOR_TOO_LONG: `Each author must be a string of ${BOOK_LIMITS.AUTHOR_MAX_LENGTH} characters or less`,
  CATEGORIES_MUST_BE_ARRAY: 'Categories must be an array',
  PUBLISHER_TOO_LONG: `Publisher must be ${BOOK_LIMITS.PUBLISHER_MAX_LENGTH} characters or less`,
  DESCRIPTION_TOO_LONG: `Description must be ${BOOK_LIMITS.DESCRIPTION_MAX_LENGTH} characters or less`,
  INVALID_ISBN_10: 'Invalid ISBN-10 format',
  INVALID_ISBN_13: 'Invalid ISBN-13 format',
  INVALID_PAGE_COUNT: `Page count must be an integer between ${BOOK_LIMITS.MIN_PAGE_COUNT} and ${BOOK_LIMITS.MAX_PAGE_COUNT}`,
  INVALID_THUMBNAIL_URL: 'Invalid thumbnail URL format',
  INVALID_PREVIEW_LINK: 'Invalid preview link format',
  INVALID_INFO_LINK: 'Invalid info link format',
  INVALID_LANGUAGE_CODE: `Language code must be between ${BOOK_LIMITS.LANGUAGE_MIN_LENGTH} and ${BOOK_LIMITS.LANGUAGE_MAX_LENGTH} characters`,
  INVALID_RATING: `Average rating must be between ${BOOK_LIMITS.MIN_RATING} and ${BOOK_LIMITS.MAX_RATING}`,
  NEGATIVE_RATINGS_COUNT: 'Ratings count must be non-negative',
  
  // Server actions
  INVALID_BOOK_STATUS: 'Invalid book status',
  INVALID_BOOK_TYPE: 'Invalid book type',
  INVALID_BOOK_DATA: 'Invalid book data',
  BOOK_ALREADY_EXISTS: 'Book already exists in library',
  BOOK_NOT_FOUND: 'Book not found or access denied',
  DATABASE_ERROR: 'Database error occurred',
  
  // Pagination
  INVALID_LIMIT: `Limit must be between ${PAGINATION.MIN_LIMIT} and ${PAGINATION.MAX_LIMIT}`,
  INVALID_OFFSET: 'Offset must be non-negative',
  
  // Google Books API
  MISSING_REQUIRED_FIELDS: 'Invalid Google Books data: missing required fields',
  EMPTY_TITLE: 'Invalid book data: title is required',
} as const

export const REGEX = {
  ISBN_10: /^\d{10}$/,
  ISBN_13: /^\d{13}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  HTML_TAGS: /<[^>]*>/g,
  SCRIPT_TAGS: /<script[^>]*>.*?<\/script>/gi,
  STYLE_TAGS: /<style[^>]*>.*?<\/style>/gi,
  YEAR_ONLY: /^\d{4}$/,
  YEAR_MONTH: /^\d{4}-\d{2}$/,
  YEAR_MONTH_DAY: /^\d{4}-\d{2}-\d{2}$/,
  HTTP_TO_HTTPS: /^http:/,
} as const