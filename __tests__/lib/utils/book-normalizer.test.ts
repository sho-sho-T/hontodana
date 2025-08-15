/**
 * book-normalizer.test.ts - 書籍データ正規化のテスト
 */

import { normalizeBookData } from '@/lib/utils/book-normalizer'
import type { GoogleBooksApiResponse } from '@/lib/models/book'

describe('normalizeBookData', () => {
  const mockGoogleBookData: GoogleBooksApiResponse = {
    id: 'test-google-id',
    volumeInfo: {
      title: 'テスト書籍',
      authors: ['著者1', '著者2'],
      publisher: 'テスト出版社',
      publishedDate: '2023-12-01',
      description: '書籍の説明文',
      pageCount: 300,
      categories: ['Fiction', 'Mystery'],
      imageLinks: {
        thumbnail: 'http://example.com/thumbnail.jpg'
      },
      industryIdentifiers: [
        { type: 'ISBN_13', identifier: '9784123456789' },
        { type: 'ISBN_10', identifier: '4123456789' }
      ],
      language: 'ja',
      averageRating: 4.5,
      ratingsCount: 100
    }
  }

  test('完全なGoogle Books APIデータを正しく正規化する', () => {
    const result = normalizeBookData(mockGoogleBookData)
    
    expect(result).toEqual({
      googleBooksId: 'test-google-id',
      title: 'テスト書籍',
      authors: ['著者1', '著者2'],
      publisher: 'テスト出版社',
      publishedDate: '2023-12-01',
      description: '書籍の説明文',
      isbn10: '4123456789',
      isbn13: '9784123456789',
      pageCount: 300,
      categories: ['Fiction', 'Mystery'],
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      language: 'ja',
      averageRating: 4.5,
      ratingsCount: 100,
      previewLink: undefined,
      infoLink: undefined
    })
  })

  test('最小データでも正規化できる', () => {
    const minimalData: GoogleBooksApiResponse = {
      id: 'minimal-id',
      volumeInfo: {
        title: 'ミニマル書籍'
      }
    }
    
    const result = normalizeBookData(minimalData)
    
    expect(result).toEqual({
      googleBooksId: 'minimal-id',
      title: 'ミニマル書籍',
      authors: [],
      publisher: undefined,
      publishedDate: undefined,
      description: undefined,
      isbn10: undefined,
      isbn13: undefined,
      pageCount: undefined,
      categories: [],
      thumbnailUrl: undefined,
      language: 'ja',
      averageRating: undefined,
      ratingsCount: 0,
      previewLink: undefined,
      infoLink: undefined
    })
  })

  test('ISBN_13を優先してISBN_10より選択する', () => {
    const data: GoogleBooksApiResponse = {
      id: 'isbn-priority-test',
      volumeInfo: {
        title: 'ISBN優先テスト',
        industryIdentifiers: [
          { type: 'ISBN_10', identifier: '4123456789' },
          { type: 'ISBN_13', identifier: '9784123456789' }
        ]
      }
    }
    
    const result = normalizeBookData(data)
    
    expect(result.isbn13).toBe('9784123456789')
    expect(result.isbn10).toBe('4123456789')
  })

  test('HTTPサムネイルをHTTPSに変換する', () => {
    const data: GoogleBooksApiResponse = {
      id: 'https-test',
      volumeInfo: {
        title: 'HTTPSテスト',
        imageLinks: {
          thumbnail: 'http://insecure.example.com/thumbnail.jpg'
        }
      }
    }
    
    const result = normalizeBookData(data)
    
    expect(result.thumbnailUrl).toBe('https://insecure.example.com/thumbnail.jpg')
  })

  test('長い文字列データを適切に切り詰める', () => {
    const longTitle = 'a'.repeat(600)
    const longDescription = 'b'.repeat(12000)
    
    const data: GoogleBooksApiResponse = {
      id: 'long-data-test',
      volumeInfo: {
        title: longTitle,
        description: longDescription
      }
    }
    
    const result = normalizeBookData(data)
    
    expect(result.title).toHaveLength(500)
    expect(result.description).toHaveLength(10000)
  })

  test('HTMLタグを除去する', () => {
    const data: GoogleBooksApiResponse = {
      id: 'html-test',
      volumeInfo: {
        title: '<script>alert("xss")</script>危険なタイトル',
        description: '<p>段落タグ付き説明文</p><script>悪意のあるスクリプト</script>'
      }
    }
    
    const result = normalizeBookData(data)
    
    expect(result.title).toBe('危険なタイトル')
    expect(result.description).toBe('段落タグ付き説明文')
  })

  test('無効なデータでエラーを投げる - IDなし', () => {
    const invalidData = {
      id: '',
      volumeInfo: { title: 'テスト' }
    } as GoogleBooksApiResponse
    
    expect(() => normalizeBookData(invalidData)).toThrow('Invalid Google Books data: missing required fields')
  })

  test('無効なデータでエラーを投げる - タイトルなし', () => {
    const invalidData = {
      id: 'test-id',
      volumeInfo: {}
    } as GoogleBooksApiResponse
    
    expect(() => normalizeBookData(invalidData)).toThrow('Invalid Google Books data: missing required fields')
  })

  test('空のタイトルでエラーを投げる', () => {
    const invalidData = {
      id: 'test-id',
      volumeInfo: { title: '   ' }
    } as GoogleBooksApiResponse
    
    expect(() => normalizeBookData(invalidData)).toThrow('Invalid book data: title is required')
  })

  test('出版日を正規化する - YYYY形式', () => {
    const data: GoogleBooksApiResponse = {
      id: 'date-test',
      volumeInfo: {
        title: '日付テスト',
        publishedDate: '2023'
      }
    }
    
    const result = normalizeBookData(data)
    expect(result.publishedDate).toBe('2023-01-01')
  })

  test('出版日を正規化する - YYYY-MM形式', () => {
    const data: GoogleBooksApiResponse = {
      id: 'date-test',
      volumeInfo: {
        title: '日付テスト',
        publishedDate: '2023-12'
      }
    }
    
    const result = normalizeBookData(data)
    expect(result.publishedDate).toBe('2023-12-01')
  })

  test('無効な出版日はundefinedになる', () => {
    const data: GoogleBooksApiResponse = {
      id: 'date-test',
      volumeInfo: {
        title: '日付テスト',
        publishedDate: 'invalid-date'
      }
    }
    
    const result = normalizeBookData(data)
    expect(result.publishedDate).toBeUndefined()
  })

  test('ページ数の範囲外値を除外する', () => {
    const data: GoogleBooksApiResponse = {
      id: 'page-test',
      volumeInfo: {
        title: 'ページテスト',
        pageCount: 15000 // 範囲外
      }
    }
    
    const result = normalizeBookData(data)
    expect(result.pageCount).toBeUndefined()
  })

  test('カテゴリ数を制限する', () => {
    const manyCategories = Array.from({ length: 25 }, (_, i) => `Category${i}`)
    
    const data: GoogleBooksApiResponse = {
      id: 'category-test',
      volumeInfo: {
        title: 'カテゴリテスト',
        categories: manyCategories
      }
    }
    
    const result = normalizeBookData(data)
    expect(result.categories).toHaveLength(20) // 最大20まで
  })
})