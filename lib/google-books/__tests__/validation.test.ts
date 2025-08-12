import { validateSearchParams } from '../validation'

describe('searchParams validation', () => {
  test('有効なパラメータで成功', () => {
    const params = { q: 'JavaScript' }
    expect(validateSearchParams(params)).toBeTruthy()
  })
  
  test('空のクエリでエラー', () => {
    const params = { q: '' }
    expect(() => validateSearchParams(params)).toThrow('検索クエリが必要です')
  })
  
  test('最大件数超過でエラー', () => {
    const params = { q: 'test', maxResults: '50' }
    expect(() => validateSearchParams(params)).toThrow('最大40件まで指定できます')
  })
  
  test('負の値でエラー', () => {
    const params = { q: 'test', maxResults: '-1' }
    expect(() => validateSearchParams(params)).toThrow('正の値を指定してください')
  })
  
  test('デフォルト値が適用される', () => {
    const params = { q: 'test' }
    const validated = validateSearchParams(params)
    expect(validated.maxResults).toBe(10)
    expect(validated.startIndex).toBe(0)
    expect(validated.langRestrict).toBe('ja')
  })
})