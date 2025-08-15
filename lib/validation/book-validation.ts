/**
 * 書籍データのバリデーション関数
 */

import type { NormalizedBookData } from '@/lib/models/book'
import { BookStatus, BookType } from '@/lib/models/book'
import { BOOK_LIMITS, ERROR_MESSAGES, REGEX } from '@/lib/config/book-constants'
import { ValidationError } from '@/lib/errors/book-errors'

/**
 * ISBN形式をチェック
 */
function isValidISBN10(isbn?: string): boolean {
  if (!isbn) return true
  return REGEX.ISBN_10.test(isbn)
}

function isValidISBN13(isbn?: string): boolean {
  if (!isbn) return true
  return REGEX.ISBN_13.test(isbn)
}

/**
 * URL形式をチェック
 */
function isValidUrl(url?: string): boolean {
  if (!url) return true // URLはオプショナル
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * BookStatusの有効性をチェック
 */
export function isValidBookStatus(status: any): status is BookStatus {
  return Object.values(BookStatus).includes(status)
}

/**
 * BookTypeの有効性をチェック
 */
export function isValidBookType(type: any): type is BookType {
  return Object.values(BookType).includes(type)
}

/**
 * 正規化された書籍データのバリデーション
 */
export function validateNormalizedBookData(data: NormalizedBookData): void {
  // 必須フィールドのチェック
  if (!data.googleBooksId || data.googleBooksId.trim() === '') {
    throw new ValidationError(ERROR_MESSAGES.GOOGLE_BOOKS_ID_REQUIRED)
  }
  
  if (!data.title || data.title.trim() === '') {
    throw new ValidationError(ERROR_MESSAGES.TITLE_REQUIRED)
  }
  
  if (data.title.length > BOOK_LIMITS.TITLE_MAX_LENGTH) {
    throw new ValidationError(ERROR_MESSAGES.TITLE_TOO_LONG)
  }
  
  // 配列フィールドのチェック
  if (!Array.isArray(data.authors)) {
    throw new ValidationError(ERROR_MESSAGES.AUTHORS_MUST_BE_ARRAY)
  }
  
  if (data.authors.some(author => typeof author !== 'string' || author.length > BOOK_LIMITS.AUTHOR_MAX_LENGTH)) {
    throw new ValidationError(ERROR_MESSAGES.AUTHOR_TOO_LONG)
  }
  
  if (!Array.isArray(data.categories)) {
    throw new ValidationError(ERROR_MESSAGES.CATEGORIES_MUST_BE_ARRAY)
  }
  
  // オプショナルフィールドのチェック
  if (data.publisher && data.publisher.length > BOOK_LIMITS.PUBLISHER_MAX_LENGTH) {
    throw new ValidationError(ERROR_MESSAGES.PUBLISHER_TOO_LONG)
  }
  
  if (data.description && data.description.length > BOOK_LIMITS.DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(ERROR_MESSAGES.DESCRIPTION_TOO_LONG)
  }
  
  // ISBN形式チェック
  if (!isValidISBN10(data.isbn10)) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_ISBN_10)
  }
  
  if (!isValidISBN13(data.isbn13)) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_ISBN_13)
  }
  
  // ページ数チェック
  if (data.pageCount !== undefined) {
    if (!Number.isInteger(data.pageCount) || 
        data.pageCount < BOOK_LIMITS.MIN_PAGE_COUNT || 
        data.pageCount > BOOK_LIMITS.MAX_PAGE_COUNT) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_PAGE_COUNT)
    }
  }
  
  // URL形式チェック
  if (!isValidUrl(data.thumbnailUrl)) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_THUMBNAIL_URL)
  }
  
  if (!isValidUrl(data.previewLink)) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_PREVIEW_LINK)
  }
  
  if (!isValidUrl(data.infoLink)) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_INFO_LINK)
  }
  
  // 言語コードチェック
  if (!data.language || 
      data.language.length < BOOK_LIMITS.LANGUAGE_MIN_LENGTH || 
      data.language.length > BOOK_LIMITS.LANGUAGE_MAX_LENGTH) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_LANGUAGE_CODE)
  }
  
  // レーティングチェック
  if (data.averageRating !== undefined) {
    if (data.averageRating < BOOK_LIMITS.MIN_RATING || data.averageRating > BOOK_LIMITS.MAX_RATING) {
      throw new ValidationError(ERROR_MESSAGES.INVALID_RATING)
    }
  }
  
  if (data.ratingsCount < 0) {
    throw new ValidationError(ERROR_MESSAGES.NEGATIVE_RATINGS_COUNT)
  }
}

/**
 * ユーザーIDのバリデーション
 */
export function validateUserId(userId: string): void {
  if (!userId || userId.trim() === '') {
    throw new ValidationError(ERROR_MESSAGES.AUTH_REQUIRED)
  }
  
  // UUIDの形式チェック
  if (!REGEX.UUID.test(userId)) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_USER_ID)
  }
}