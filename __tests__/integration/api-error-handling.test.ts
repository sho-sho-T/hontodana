import { searchBooks } from '@/lib/api/books';
import { ErrorType } from '@/lib/errors/app-error';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Error Handling Integration', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('should handle network connection failure', async () => {
    // Given
    mockFetch.mockRejectedValue(new Error('Network Error'));
    
    // When
    const result = await searchBooks('test query');
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.NETWORK,
        code: 'NETWORK_ERROR',
        message: '通信エラーが発生しました。インターネット接続を確認してください。',
        context: expect.objectContaining({
          query: 'test query',
          options: {},
          timestamp: expect.any(Number)
        })
      }
    });
  });

  test('should handle API rate limit exceeded', async () => {
    // Given
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: () => Promise.resolve({ error: 'Rate limit exceeded' })
    });
    
    // When  
    const result = await searchBooks('test query');
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.RATE_LIMIT,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'リクエスト制限を超えました。しばらく待ってから再試行してください。',
        context: expect.objectContaining({
          query: 'test query',
          options: {},
          timestamp: expect.any(Number)
        })
      }
    });
  });

  test('should handle server internal error', async () => {
    // Given
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ error: 'Internal server error' })
    });
    
    // When
    const result = await searchBooks('test query');
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.EXTERNAL_API,
        code: 'EXTERNAL_API_ERROR',
        message: 'サービスの一時的な問題が発生しています。しばらく待ってから再試行してください。',
        context: expect.objectContaining({
          query: 'test query',
          options: {},
          timestamp: expect.any(Number)
        })
      }
    });
  });

  test('should handle timeout errors', async () => {
    // Given
    mockFetch.mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    );
    
    // When
    const result = await searchBooks('test query');
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.NETWORK,
        code: 'REQUEST_TIMEOUT',
        message: 'リクエストがタイムアウトしました。再度お試しください。',
        context: expect.objectContaining({
          query: 'test query',
          options: {},
          timestamp: expect.any(Number)
        })
      }
    });
  });

  test('should handle invalid JSON response', async () => {
    // Given
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON'))
    });
    
    // When
    const result = await searchBooks('test query');
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.EXTERNAL_API,
        code: 'INVALID_RESPONSE',
        message: 'サーバーからの応答が正しくありません。',
        context: expect.objectContaining({
          query: 'test query',
          options: {},
          timestamp: expect.any(Number)
        })
      }
    });
  });

  test('should handle unauthorized access', async () => {
    // Given
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Invalid API key' })
    });
    
    // When
    const result = await searchBooks('test query');
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.AUTHENTICATION,
        code: 'API_AUTHENTICATION_FAILED',
        message: 'APIの認証に失敗しました。設定を確認してください。',
        context: expect.objectContaining({
          query: 'test query',
          options: {},
          timestamp: expect.any(Number)
        })
      }
    });
  });

  test('should handle quota exceeded error', async () => {
    // Given
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: () => Promise.resolve({ 
        error: { 
          code: 403,
          message: 'Daily quota exceeded'
        }
      })
    });
    
    // When
    const result = await searchBooks('test query');
    
    // Then
    expect(result).toEqual({
      success: false,
      error: {
        type: ErrorType.RATE_LIMIT,
        code: 'QUOTA_EXCEEDED',
        message: '1日の利用上限に達しました。明日再度お試しください。',
        context: expect.objectContaining({
          query: 'test query',
          options: {},
          timestamp: expect.any(Number)
        })
      }
    });
  });

  test('should retry failed requests with exponential backoff', async () => {
    // Given
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.reject(new Error('Network Error')); // Use a retryable error
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [] })
      });
    });
    
    // When
    const result = await searchBooks('test query');
    
    // Then
    expect(result.success).toBe(true);
    expect(callCount).toBe(3);
  }, 10000); // Increase timeout for retry delays

  test('should include request context in error details', async () => {
    // Given
    mockFetch.mockRejectedValue(new Error('Network Error'));
    
    // When
    const result = await searchBooks('test query', { maxResults: 10 });
    
    // Then
    expect(result.error?.context).toEqual({
      query: 'test query',
      options: { maxResults: 10 },
      timestamp: expect.any(Number)
    });
  });
});