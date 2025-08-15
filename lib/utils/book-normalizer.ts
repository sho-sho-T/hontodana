/**
 * Google Books APIレスポンスを正規化するユーティリティ関数
 */

import type { GoogleBooksApiResponse, NormalizedBookData } from '@/lib/models/book'
import { BOOK_LIMITS, ERROR_MESSAGES, REGEX } from '@/lib/config/book-constants'

/**
 * 文字列をサニタイズ（HTMLタグ除去、長さ制限）
 */
function sanitizeString(input?: string, maxLength?: number): string | undefined {
  if (!input) return undefined
  
  // script/style タグの中身も含めて除去
  let cleaned = input
    .replace(REGEX.SCRIPT_TAGS, '')
    .replace(REGEX.STYLE_TAGS, '')
    .replace(REGEX.HTML_TAGS, '')
    .trim()
  
  // 長さ制限
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength)
  }
  
  return cleaned || undefined
}

/**
 * HTTPURLをHTTPSに変換
 */
function ensureHttps(url?: string): string | undefined {
  if (!url) return undefined
  return url.replace(REGEX.HTTP_TO_HTTPS, 'https:')
}

/**
 * ISBN情報を抽出（ISBN_13を優先）
 */
function extractISBN(industryIdentifiers?: Array<{ type: string; identifier: string }>): {
  isbn10?: string
  isbn13?: string
} {
  if (!industryIdentifiers) return {}
  
  const isbn10 = industryIdentifiers.find(id => id.type === 'ISBN_10')?.identifier
  const isbn13 = industryIdentifiers.find(id => id.type === 'ISBN_13')?.identifier
  
  return { isbn10, isbn13 }
}

/**
 * 出版日を正規化（YYYY-MM-DD形式に統一）
 */
function normalizeDate(dateString?: string): string | undefined {
  if (!dateString) return undefined
  
  // YYYY, YYYY-MM, YYYY-MM-DD 形式に対応
  const yearMatch = dateString.match(/^\d{4}/)
  if (!yearMatch) return undefined
  
  const year = yearMatch[0]
  
  if (REGEX.YEAR_MONTH_DAY.test(dateString)) {
    return dateString // 既にYYYY-MM-DD形式
  } else if (REGEX.YEAR_MONTH.test(dateString)) {
    return `${dateString}-01` // YYYY-MM形式なので-01を付加
  } else if (REGEX.YEAR_ONLY.test(dateString)) {
    return `${year}-01-01` // YYYY形式なので-01-01を付加
  }
  
  return undefined
}

/**
 * Google Books APIレスポンスを正規化してNormalizedBookDataに変換
 */
export function normalizeBookData(googleBookData: GoogleBooksApiResponse): NormalizedBookData {
  const { id, volumeInfo } = googleBookData
  
  if (!id || !volumeInfo?.title) {
    throw new Error(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS)
  }
  
  const title = sanitizeString(volumeInfo.title, BOOK_LIMITS.TITLE_MAX_LENGTH)
  if (!title) {
    throw new Error(ERROR_MESSAGES.EMPTY_TITLE)
  }
  
  const { isbn10, isbn13 } = extractISBN(volumeInfo.industryIdentifiers)
  
  return {
    googleBooksId: id,
    title,
    authors: volumeInfo.authors?.slice(0, BOOK_LIMITS.MAX_AUTHORS) || [],
    publisher: sanitizeString(volumeInfo.publisher, BOOK_LIMITS.PUBLISHER_MAX_LENGTH),
    publishedDate: normalizeDate(volumeInfo.publishedDate),
    description: sanitizeString(volumeInfo.description, BOOK_LIMITS.DESCRIPTION_MAX_LENGTH),
    isbn10: isbn10?.replace(/[^\d]/g, '') || undefined, // 数字のみ
    isbn13: isbn13?.replace(/[^\d]/g, '') || undefined, // 数字のみ
    pageCount: volumeInfo.pageCount && 
      volumeInfo.pageCount >= BOOK_LIMITS.MIN_PAGE_COUNT && 
      volumeInfo.pageCount <= BOOK_LIMITS.MAX_PAGE_COUNT
      ? volumeInfo.pageCount 
      : undefined,
    categories: volumeInfo.categories?.slice(0, BOOK_LIMITS.MAX_CATEGORIES) || [],
    thumbnailUrl: ensureHttps(volumeInfo.imageLinks?.thumbnail),
    language: volumeInfo.language || 'ja', // デフォルトは日本語
    averageRating: volumeInfo.averageRating && 
      volumeInfo.averageRating >= BOOK_LIMITS.MIN_RATING && 
      volumeInfo.averageRating <= BOOK_LIMITS.MAX_RATING
      ? volumeInfo.averageRating
      : undefined,
    ratingsCount: volumeInfo.ratingsCount && volumeInfo.ratingsCount >= 0
      ? volumeInfo.ratingsCount
      : 0,
    previewLink: volumeInfo.previewLink,
    infoLink: volumeInfo.infoLink
  }
}