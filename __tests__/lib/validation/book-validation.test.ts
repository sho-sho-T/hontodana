/**
 * book-validation.test.ts - 書籍バリデーションのテスト
 */

import { 
  validateNormalizedBookData, 
  validateUserId, 
  isValidBookStatus, 
  isValidBookType,
  ValidationError 
} from '@/lib/validation/book-validation'
import { BookStatus, BookType } from '@/lib/models/book'
import type { NormalizedBookData } from '@/lib/models/book'

describe('validateNormalizedBookData', () => {
  const validBookData: NormalizedBookData = {
    googleBooksId: 'valid-google-id',
    title: '有効な書籍',
    authors: ['著者1', '著者2'],
    publisher: '出版社',
    publishedDate: '2023-01-01',
    description: '書籍の説明',
    isbn10: '4123456789',
    isbn13: '9784123456789',
    pageCount: 300,
    categories: ['Fiction'],
    thumbnailUrl: 'https://example.com/thumb.jpg',
    language: 'ja',
    averageRating: 4.5,
    ratingsCount: 100,
    previewLink: 'https://example.com/preview',
    infoLink: 'https://example.com/info'
  }

  test('有効な書籍データを通す', () => {
    expect(() => validateNormalizedBookData(validBookData)).not.toThrow()
  })

  test('Google Books ID が空でエラー', () => {
    const invalidData = { ...validBookData, googleBooksId: '' }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Google Books ID is required')
  })

  test('タイトルが空でエラー', () => {
    const invalidData = { ...validBookData, title: '' }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Title is required')
  })

  test('タイトルが長すぎるとエラー', () => {
    const invalidData = { ...validBookData, title: 'a'.repeat(501) }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Title must be 500 characters or less')
  })

  test('著者が配列でないとエラー', () => {
    const invalidData = { ...validBookData, authors: 'not-array' as any }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Authors must be an array')
  })

  test('著者名が長すぎるとエラー', () => {
    const invalidData = { ...validBookData, authors: ['a'.repeat(501)] }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Each author must be a string of 500 characters or less')
  })

  test('カテゴリが配列でないとエラー', () => {
    const invalidData = { ...validBookData, categories: 'not-array' as any }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Categories must be an array')
  })

  test('出版社名が長すぎるとエラー', () => {
    const invalidData = { ...validBookData, publisher: 'a'.repeat(501) }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Publisher must be 500 characters or less')
  })

  test('説明が長すぎるとエラー', () => {
    const invalidData = { ...validBookData, description: 'a'.repeat(10001) }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Description must be 10000 characters or less')
  })

  test('無効なISBN-10形式でエラー', () => {
    const invalidData = { ...validBookData, isbn10: 'invalid-isbn' }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Invalid ISBN-10 format')
  })

  test('無効なISBN-13形式でエラー', () => {
    const invalidData = { ...validBookData, isbn13: 'invalid-isbn' }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Invalid ISBN-13 format')
  })

  test('ページ数が範囲外でエラー - 0以下', () => {
    const invalidData = { ...validBookData, pageCount: 0 }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Page count must be an integer between 1 and 10000')
  })

  test('ページ数が範囲外でエラー - 10000超', () => {
    const invalidData = { ...validBookData, pageCount: 10001 }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Page count must be an integer between 1 and 10000')
  })

  test('無効なURL形式でエラー - thumbnail', () => {
    const invalidData = { ...validBookData, thumbnailUrl: 'invalid-url' }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Invalid thumbnail URL format')
  })

  test('言語コードが短すぎるとエラー', () => {
    const invalidData = { ...validBookData, language: 'a' }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Language code must be between 2 and 10 characters')
  })

  test('言語コードが長すぎるとエラー', () => {
    const invalidData = { ...validBookData, language: 'a'.repeat(11) }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Language code must be between 2 and 10 characters')
  })

  test('レーティングが範囲外でエラー - 負の値', () => {
    const invalidData = { ...validBookData, averageRating: -1 }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Average rating must be between 0 and 5')
  })

  test('レーティングが範囲外でエラー - 5超', () => {
    const invalidData = { ...validBookData, averageRating: 6 }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Average rating must be between 0 and 5')
  })

  test('レーティング数が負の値でエラー', () => {
    const invalidData = { ...validBookData, ratingsCount: -1 }
    expect(() => validateNormalizedBookData(invalidData))
      .toThrow('Ratings count must be non-negative')
  })
})

describe('validateUserId', () => {
  test('有効なUUIDを通す', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000'
    expect(() => validateUserId(validUuid)).not.toThrow()
  })

  test('空のIDでエラー', () => {
    expect(() => validateUserId('')).toThrow('Authentication required')
  })

  test('無効なUUID形式でエラー', () => {
    expect(() => validateUserId('invalid-uuid')).toThrow('Invalid User ID format')
  })
})

describe('isValidBookStatus', () => {
  test('有効なBookStatusを通す', () => {
    expect(isValidBookStatus(BookStatus.WANT_TO_READ)).toBe(true)
    expect(isValidBookStatus(BookStatus.READING)).toBe(true)
    expect(isValidBookStatus(BookStatus.READ)).toBe(true)
  })

  test('無効な値でfalse', () => {
    expect(isValidBookStatus('invalid_status')).toBe(false)
    expect(isValidBookStatus(null)).toBe(false)
    expect(isValidBookStatus(undefined)).toBe(false)
  })
})

describe('isValidBookType', () => {
  test('有効なBookTypeを通す', () => {
    expect(isValidBookType(BookType.PHYSICAL)).toBe(true)
    expect(isValidBookType(BookType.KINDLE)).toBe(true)
    expect(isValidBookType(BookType.EPUB)).toBe(true)
  })

  test('無効な値でfalse', () => {
    expect(isValidBookType('invalid_type')).toBe(false)
    expect(isValidBookType(null)).toBe(false)
    expect(isValidBookType(undefined)).toBe(false)
  })
})