// Google Books API 設定
export const GOOGLE_BOOKS_CONFIG = {
  BASE_URL: 'https://www.googleapis.com/books/v1/volumes',
  DEFAULT_MAX_RESULTS: 10,
  MAX_ALLOWED_RESULTS: 40,
  DEFAULT_START_INDEX: 0,
  DEFAULT_LANG_RESTRICT: 'ja',
  REQUEST_TIMEOUT: 10000, // 10秒
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY: 1000, // 1秒
} as const

// API制限
export const RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 100,
  REQUESTS_PER_DAY: 1000,
} as const