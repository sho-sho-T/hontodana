import type { SearchParams } from './types'
import { ValidationError } from './errors'
import { GOOGLE_BOOKS_CONFIG } from './config'

/**
 * 検索クエリをバリデーション・正規化する
 */
function validateQuery(q?: string): string {
  if (!q || q.trim() === '') {
    throw new ValidationError('検索クエリが必要です')
  }
  return q.trim()
}

/**
 * maxResults パラメータをバリデーション・正規化する
 */
function validateMaxResults(maxResultsStr?: string): number {
  if (!maxResultsStr) {
    return GOOGLE_BOOKS_CONFIG.DEFAULT_MAX_RESULTS
  }
  
  const parsed = Number.parseInt(maxResultsStr, 10)
  
  if (Number.isNaN(parsed) || parsed < 1) {
    throw new ValidationError('正の値を指定してください')
  }
  
  if (parsed > GOOGLE_BOOKS_CONFIG.MAX_ALLOWED_RESULTS) {
    throw new ValidationError(`最大${GOOGLE_BOOKS_CONFIG.MAX_ALLOWED_RESULTS}件まで指定できます`)
  }
  
  return parsed
}

/**
 * startIndex パラメータをバリデーション・正規化する
 */
function validateStartIndex(startIndexStr?: string): number {
  if (!startIndexStr) {
    return GOOGLE_BOOKS_CONFIG.DEFAULT_START_INDEX
  }
  
  const parsed = Number.parseInt(startIndexStr, 10)
  
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new ValidationError('正の値を指定してください')
  }
  
  return parsed
}

/**
 * 検索パラメータをバリデーション・正規化する
 */
export function validateSearchParams(params: Record<string, string | undefined>): SearchParams {
  const { q, maxResults: maxResultsStr, startIndex: startIndexStr, langRestrict } = params
  
  return {
    q: validateQuery(q),
    maxResults: validateMaxResults(maxResultsStr),
    startIndex: validateStartIndex(startIndexStr),
    langRestrict: langRestrict || GOOGLE_BOOKS_CONFIG.DEFAULT_LANG_RESTRICT
  }
}