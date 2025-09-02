/**
 * DuplicateHandler のテスト
 */

import { DuplicateHandler } from '@/lib/utils/duplicate-handler'

describe('DuplicateHandler', () => {
  let handler: DuplicateHandler

  beforeEach(() => {
    handler = new DuplicateHandler()
  })

  describe('checkBookDuplicate', () => {
    test('ISBN13が一致する場合、重複として検出される', () => {
      const newBook = {
        title: '新しい書籍',
        isbn13: '9781234567890'
      }
      
      const existingBooks = [
        {
          title: '既存の書籍',
          isbn13: '9781234567890'
        }
      ]

      const result = handler.checkBookDuplicate(newBook, existingBooks)
      expect(result).toBe(true)
    })

    test('ISBN13が異なる場合、重複として検出されない', () => {
      const newBook = {
        title: '新しい書籍',
        isbn13: '9781234567890'
      }
      
      const existingBooks = [
        {
          title: '既存の書籍',
          isbn13: '9780987654321'
        }
      ]

      const result = handler.checkBookDuplicate(newBook, existingBooks)
      expect(result).toBe(false)
    })

    test('ISBN13がない場合、重複として検出されない', () => {
      const newBook = {
        title: '新しい書籍'
      }
      
      const existingBooks = [
        {
          title: '既存の書籍',
          isbn13: '9781234567890'
        }
      ]

      const result = handler.checkBookDuplicate(newBook, existingBooks)
      expect(result).toBe(false)
    })

    test('空の既存書籍リストの場合、重複として検出されない', () => {
      const newBook = {
        title: '新しい書籍',
        isbn13: '9781234567890'
      }

      const result = handler.checkBookDuplicate(newBook, [])
      expect(result).toBe(false)
    })

    test('複数の既存書籍で一つでも一致すれば重複として検出される', () => {
      const newBook = {
        title: '新しい書籍',
        isbn13: '9781234567890'
      }
      
      const existingBooks = [
        { title: '書籍1', isbn13: '9780000000001' },
        { title: '書籍2', isbn13: '9781234567890' }, // 一致
        { title: '書籍3', isbn13: '9780000000003' }
      ]

      const result = handler.checkBookDuplicate(newBook, existingBooks)
      expect(result).toBe(true)
    })
  })

  describe('calculateBookSimilarity', () => {
    test('完全に同じ書籍の場合、高い類似度が返される', () => {
      const book1 = {
        title: 'プログラミング入門',
        authors: ['田中太郎']
      }
      
      const book2 = {
        title: 'プログラミング入門',
        authors: ['田中太郎']
      }

      const similarity = handler.calculateBookSimilarity(book1, book2)
      expect(similarity).toBeGreaterThan(0.9)
    })

    test('タイトルが類似している場合、中程度の類似度が返される', () => {
      const book1 = {
        title: 'JavaScript入門',
        authors: ['田中太郎']
      }
      
      const book2 = {
        title: 'JavaScript基礎',
        authors: ['佐藤花子']
      }

      const similarity = handler.calculateBookSimilarity(book1, book2)
      expect(similarity).toBeGreaterThan(0.3)
      expect(similarity).toBeLessThan(0.8)
    })

    test('完全に異なる書籍の場合、低い類似度が返される', () => {
      const book1 = {
        title: 'プログラミング入門',
        authors: ['田中太郎']
      }
      
      const book2 = {
        title: '料理レシピ集',
        authors: ['山田美子']
      }

      const similarity = handler.calculateBookSimilarity(book1, book2)
      expect(similarity).toBeLessThan(0.2)
    })

    test('タイトルや著者がない場合も処理される', () => {
      const book1 = {
        title: null,
        authors: []
      }
      
      const book2 = {
        title: 'プログラミング入門',
        authors: ['田中太郎']
      }

      const similarity = handler.calculateBookSimilarity(book1, book2)
      expect(similarity).toBeGreaterThanOrEqual(0)
      expect(similarity).toBeLessThanOrEqual(1)
    })

    test('大文字小文字の違いは無視される', () => {
      const book1 = {
        title: 'JavaScript Programming',
        authors: ['John Smith']
      }
      
      const book2 = {
        title: 'javascript programming',
        authors: ['john smith']
      }

      const similarity = handler.calculateBookSimilarity(book1, book2)
      expect(similarity).toBeGreaterThan(0.9)
    })
  })

  describe('mergeBookData', () => {
    test('新しいデータで既存データが更新される', () => {
      const existingBook = {
        id: 'book-1',
        title: '既存書籍',
        rating: 3,
        review: '古いレビュー',
        currentPage: 100
      }
      
      const newBook = {
        rating: 5,
        review: '新しいレビュー',
        currentPage: 150,
        notes: '新しいメモ'
      }

      const merged = handler.mergeBookData(existingBook, newBook)
      
      expect(merged.id).toBe('book-1')
      expect(merged.title).toBe('既存書籍')
      expect(merged.rating).toBe(5)
      expect(merged.review).toBe('新しいレビュー')
      expect(merged.currentPage).toBe(150)
      expect(merged.notes).toBe('新しいメモ')
    })

    test('currentPageは最大値が採用される', () => {
      const existingBook = {
        currentPage: 200
      }
      
      const newBook = {
        currentPage: 150
      }

      const merged = handler.mergeBookData(existingBook, newBook)
      expect(merged.currentPage).toBe(200) // 大きい方
    })

    test('新しいデータがnull/undefined/空文字の場合は既存データが保持される', () => {
      const existingBook = {
        rating: 4,
        review: '既存レビュー',
        notes: '既存メモ'
      }
      
      const newBook = {
        rating: undefined,
        review: null,
        notes: ''
      }

      const merged = handler.mergeBookData(existingBook, newBook)
      
      expect(merged.rating).toBe(4)
      expect(merged.review).toBe('既存レビュー')
      expect(merged.notes).toBe('既存メモ')
    })

    test('ratingが0の場合も有効な値として扱われる', () => {
      const existingBook = {
        rating: 3
      }
      
      const newBook = {
        rating: 0
      }

      const merged = handler.mergeBookData(existingBook, newBook)
      expect(merged.rating).toBe(0)
    })

    test('新しいフィールドが追加される', () => {
      const existingBook = {
        title: '既存書籍'
      }
      
      const newBook = {
        publisher: '新出版社',
        publishedDate: '2024-01-01'
      }

      const merged = handler.mergeBookData(existingBook, newBook)
      
      expect(merged.title).toBe('既存書籍')
      expect(merged.publisher).toBe('新出版社')
      expect(merged.publishedDate).toBe('2024-01-01')
    })
  })

  describe('calculateStringSimilarity (private method)', () => {
    test('完全一致の場合、1.0が返される', () => {
      // プライベートメソッドなので、間接的にテスト
      const book1 = { title: 'test', authors: ['author'] }
      const book2 = { title: 'test', authors: ['author'] }
      
      const similarity = handler.calculateBookSimilarity(book1, book2)
      expect(similarity).toBe(1.0)
    })

    test('正規化後一致の場合、高い類似度が返される', () => {
      const book1 = { title: '  Test  Book  ', authors: ['author'] }
      const book2 = { title: 'Test Book', authors: ['author'] }
      
      const similarity = handler.calculateBookSimilarity(book1, book2)
      expect(similarity).toBeGreaterThan(0.9)
    })

    test('部分一致の場合、中程度の類似度が返される', () => {
      const book1 = { title: 'JavaScript Programming Guide', authors: ['author'] }
      const book2 = { title: 'JavaScript', authors: ['author'] }
      
      const similarity = handler.calculateBookSimilarity(book1, book2)
      expect(similarity).toBeGreaterThan(0.7)
    })
  })

  describe('levenshteinDistance (private method)', () => {
    test('レーベンシュタイン距離の計算が正しく動作する', () => {
      // 間接的にテスト
      const book1 = { title: 'abc', authors: ['author'] }
      const book2 = { title: 'abd', authors: ['author'] }
      
      const similarity = handler.calculateBookSimilarity(book1, book2)
      expect(similarity).toBeGreaterThan(0.5) // 1文字違いなので高めの類似度
      expect(similarity).toBeLessThan(1.0)
    })

    test('空文字列の場合も処理される', () => {
      const book1 = { title: '', authors: [''] }
      const book2 = { title: '', authors: [''] }
      
      const similarity = handler.calculateBookSimilarity(book1, book2)
      expect(similarity).toBeGreaterThanOrEqual(0)
    })
  })
})