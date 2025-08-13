import type { SearchParams, SearchResponse, GoogleBooksResponse } from './types'
import { normalizeGoogleBooksResponse } from './normalize'
import { retryWithBackoff } from './retry'
import { GoogleBooksError, RateLimitError, NetworkError } from './errors'
import { GOOGLE_BOOKS_CONFIG } from './config'

/**
 * Google Books APIクライアント
 */
export class GoogleBooksClient {
  private readonly baseUrl: string
  private readonly apiKey?: string
  private readonly timeout: number
  
  constructor(apiKey?: string, timeout?: number) {
    this.baseUrl = GOOGLE_BOOKS_CONFIG.BASE_URL
    this.apiKey = apiKey
    this.timeout = timeout || GOOGLE_BOOKS_CONFIG.REQUEST_TIMEOUT
  }
  
  /**
   * 検索パラメータをURL Search Paramsに変換する
   */
  private buildSearchParams(params: SearchParams): URLSearchParams {
    const searchParams = new URLSearchParams({
      q: params.q,
      maxResults: params?.maxResults?.toString() || '10',
      startIndex: params?.startIndex?.toString() || '0',
    })
    
    if (params.langRestrict) {
      searchParams.set('langRestrict', params.langRestrict)
    }
    
    if (this.apiKey) {
      searchParams.set('key', this.apiKey)
    }
    
    return searchParams
  }
  
  /**
   * HTTPレスポンスをチェックしエラーを適切にハンドリングする
   */
  private async handleResponse(response: Response): Promise<GoogleBooksResponse> {
    if (!response.ok) {
      switch (response.status) {
        case 429:
          throw new RateLimitError('Google Books APIのレート制限に達しました')
        case 400:
          throw new GoogleBooksError('無効なリクエストパラメータです', 400)
        case 403:
          throw new GoogleBooksError('APIキーが無効または権限がありません', 403)
        case 404:
          throw new GoogleBooksError('指定されたリソースが見つかりません', 404)
        case 500:
        case 502:
        case 503:
        case 504:
          throw new GoogleBooksError('Google Books APIでサーバーエラーが発生しました', response.status)
        default:
          throw new GoogleBooksError(`Google Books API error: ${response.status}`, response.status)
      }
    }
    
    try {
      return await response.json()
    } catch (error) {
      throw new GoogleBooksError('APIレスポンスの解析に失敗しました', 500, error as Error)
    }
  }
  
  /**
   * 書籍を検索する
   */
  async searchBooks(params: SearchParams): Promise<SearchResponse> {
    const searchParams = this.buildSearchParams(params)
    const url = `${this.baseUrl}?${searchParams.toString()}`
    
    const fetchBooks = async (): Promise<GoogleBooksResponse> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Hontodana/1.0',
          },
          signal: controller.signal,
        })
        
        return await this.handleResponse(response)
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new NetworkError('リクエストがタイムアウトしました')
          }
          if (error.message.includes('fetch')) {
            throw new NetworkError('ネットワークエラーが発生しました')
          }
        }
        throw error
      } finally {
        clearTimeout(timeoutId)
      }
    }
    
    const googleResponse = await retryWithBackoff(fetchBooks)
    
    return normalizeGoogleBooksResponse(
      googleResponse,
      params?.maxResults || 10,
      params?.startIndex || 0
    )
  }
}