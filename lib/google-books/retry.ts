import { RateLimitError, NetworkError } from './errors'
import { GOOGLE_BOOKS_CONFIG } from './config'

/**
 * エラーが再試行可能かどうかを判定する
 */
function isRetryableError(error: Error): boolean {
  return error.message.includes('429') || 
         error.name === 'RateLimitError' ||
         error.message.includes('ECONNRESET') ||
         error.message.includes('ENOTFOUND')
}

/**
 * 指数バックオフによる再試行を行う
 * @param fn 実行する関数
 * @param maxRetries 最大再試行回数
 * @param baseDelay 基本待機時間(ms)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = GOOGLE_BOOKS_CONFIG.MAX_RETRIES,
  baseDelay: number = GOOGLE_BOOKS_CONFIG.RETRY_BASE_DELAY
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // 再試行可能なエラーでない場合は即座に失敗
      if (!isRetryableError(lastError)) {
        throw lastError
      }
      
      // 最後の試行の場合は待機せずに失敗
      if (attempt === maxRetries - 1) {
        break
      }
      
      // 指数バックオフで待機（ジッター付き）
      const delay = baseDelay * 2 ** attempt
      const jitter = Math.random() * 0.1 * delay // 10%のジッター
      const actualDelay = delay + jitter
      
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${actualDelay}ms`)
      await new Promise(resolve => setTimeout(resolve, actualDelay))
    }
  }
  
  // 最後の試行でも失敗した場合
  if (lastError && lastError.message.includes('429')) {
    throw new RateLimitError('Google Books APIのレート制限に達しました。しばらく待ってから再試行してください。')
  }
  
  throw new NetworkError(`Google Books APIへの接続に失敗しました: ${lastError?.message || 'Unknown error'}`)
}