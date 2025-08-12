import type { GoogleBooksResponse, Book, SearchResponse } from './types'

export function normalizeGoogleBooksResponse(
  response: GoogleBooksResponse,
  maxResults: number,
  startIndex: number
): SearchResponse {
  const items: Book[] = (response.items || []).map(item => {
    const volumeInfo = item.volumeInfo
    
    // ISBN情報の抽出
    const isbn: { isbn10?: string; isbn13?: string } | undefined = 
      volumeInfo.industryIdentifiers?.reduce((acc, identifier) => {
        if (identifier.type === 'ISBN_10') {
          acc.isbn10 = identifier.identifier
        } else if (identifier.type === 'ISBN_13') {
          acc.isbn13 = identifier.identifier
        }
        return acc
      }, {} as { isbn10?: string; isbn13?: string })
    
    const book: Book = {
      id: item.id,
      title: volumeInfo.title,
      language: volumeInfo.language || 'unknown',
      imageLinks: {
        thumbnail: volumeInfo.imageLinks?.thumbnail,
        small: volumeInfo.imageLinks?.small,
        medium: volumeInfo.imageLinks?.medium,
        large: volumeInfo.imageLinks?.large
      }
    }
    
    // Optional fields
    if (volumeInfo.authors) book.authors = volumeInfo.authors
    if (volumeInfo.publisher) book.publisher = volumeInfo.publisher
    if (volumeInfo.publishedDate) book.publishedDate = volumeInfo.publishedDate
    if (volumeInfo.description) book.description = volumeInfo.description
    if (volumeInfo.pageCount) book.pageCount = volumeInfo.pageCount
    if (volumeInfo.categories) book.categories = volumeInfo.categories
    if (volumeInfo.averageRating) book.averageRating = volumeInfo.averageRating
    if (volumeInfo.ratingsCount) book.ratingsCount = volumeInfo.ratingsCount
    if (isbn && (isbn.isbn10 || isbn.isbn13)) book.isbn = isbn
    
    return book
  })
  
  const hasMore = startIndex + maxResults < response.totalItems
  
  return {
    items,
    totalItems: response.totalItems,
    hasMore
  }
}