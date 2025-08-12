import { normalizeGoogleBooksResponse } from '../normalize'

describe('normalizeGoogleBooksResponse', () => {
  test('正常なレスポンスの変換', () => {
    const googleResponse = {
      totalItems: 100,
      items: [{
        id: 'book1',
        volumeInfo: {
          title: 'Test Book',
          authors: ['Author 1', 'Author 2'],
          publisher: 'Test Publisher',
          publishedDate: '2023-01-01',
          description: 'Test description',
          pageCount: 200,
          categories: ['Technology'],
          averageRating: 4.5,
          ratingsCount: 10,
          imageLinks: {
            thumbnail: 'http://example.com/thumb.jpg'
          },
          language: 'ja',
          industryIdentifiers: [
            { type: 'ISBN_10', identifier: '1234567890' },
            { type: 'ISBN_13', identifier: '9781234567890' }
          ]
        }
      }]
    }
    
    const normalized = normalizeGoogleBooksResponse(googleResponse, 10, 0)
    
    expect(normalized.totalItems).toBe(100)
    expect(normalized.hasMore).toBe(true)
    expect(normalized.items).toHaveLength(1)
    expect(normalized.items[0]).toEqual({
      id: 'book1',
      title: 'Test Book',
      authors: ['Author 1', 'Author 2'],
      publisher: 'Test Publisher',
      publishedDate: '2023-01-01',
      description: 'Test description',
      pageCount: 200,
      categories: ['Technology'],
      averageRating: 4.5,
      ratingsCount: 10,
      imageLinks: {
        thumbnail: 'http://example.com/thumb.jpg'
      },
      language: 'ja',
      isbn: {
        isbn10: '1234567890',
        isbn13: '9781234567890'
      }
    })
  })
  
  test('不完全なデータの処理', () => {
    const googleResponse = {
      totalItems: 1,
      items: [{
        id: 'book1',
        volumeInfo: {
          title: 'Minimal Book'
        }
      }]
    }
    
    const normalized = normalizeGoogleBooksResponse(googleResponse, 10, 0)
    
    expect(normalized.items[0].title).toBe('Minimal Book')
    expect(normalized.items[0].authors).toBeUndefined()
    expect(normalized.items[0].isbn).toBeUndefined()
  })
})