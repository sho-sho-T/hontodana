import { retryWithBackoff } from '../retry'

describe('retryWithBackoff', () => {  
  test('成功時は再試行しない', async () => {
    const mockFn = jest.fn().mockResolvedValue('success')
    const result = await retryWithBackoff(mockFn, 3)
    
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
  
  test('429エラー以外は即座に失敗', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('500'))
    
    await expect(retryWithBackoff(mockFn, 3)).rejects.toThrow('500')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
  
  test('429エラー時は再試行（簡単版）', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('429'))
      .mockResolvedValue('success')
    
    // baseDelayを0にして即座に再試行
    const result = await retryWithBackoff(mockFn, 3, 0)
    
    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
  })
})