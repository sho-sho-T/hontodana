// 検索パラメータ
export interface SearchParams {
  q: string
  maxResults?: number
  startIndex?: number
  langRestrict?: string
}

// 正規化された書籍データ
export interface Book {
  id: string
  title: string
  authors?: string[]
  publisher?: string
  publishedDate?: string
  description?: string
  pageCount?: number
  categories?: string[]
  averageRating?: number
  ratingsCount?: number
  imageLinks: {
    thumbnail?: string
    small?: string
    medium?: string
    large?: string
  }
  language: string
  isbn?: {
    isbn10?: string
    isbn13?: string
  }
}

// 検索レスポンス
export interface SearchResponse {
  items: Book[]
  totalItems: number
  hasMore: boolean
}

// Google Books API レスポンス型
export interface GoogleBooksResponse {
  kind: string
  totalItems: number
  items?: GoogleBookItem[]
}

export interface GoogleBookItem {
  kind: string
  id: string
  etag: string
  selfLink: string
  volumeInfo: {
    title: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    description?: string
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
    readingModes?: {
      text: boolean
      image: boolean
    }
    pageCount?: number
    printType?: string
    categories?: string[]
    averageRating?: number
    ratingsCount?: number
    maturityRating?: string
    allowAnonLogging?: boolean
    contentVersion?: string
    panelizationSummary?: {
      containsEpubBubbles: boolean
      containsImageBubbles: boolean
    }
    imageLinks?: {
      smallThumbnail?: string
      thumbnail?: string
      small?: string
      medium?: string
      large?: string
      extraLarge?: string
    }
    language?: string
    previewLink?: string
    infoLink?: string
    canonicalVolumeLink?: string
  }
}