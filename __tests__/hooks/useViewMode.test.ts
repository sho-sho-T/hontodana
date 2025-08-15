/**
 * useViewMode カスタムフックのテスト
 */

import { renderHook, act } from '@testing-library/react'
import { useViewMode } from '@/hooks/useViewMode'

// localStorage のモック
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useViewMode - 基本機能', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  test('初期値がgridモードである', () => {
    const { result } = renderHook(() => useViewMode())
    
    expect(result.current.viewMode).toBe('grid')
  })

  test('表示モードを変更できる', () => {
    const { result } = renderHook(() => useViewMode())
    
    act(() => {
      result.current.setViewMode('list')
    })
    
    expect(result.current.viewMode).toBe('list')
  })

  test('再度モードを変更できる', () => {
    const { result } = renderHook(() => useViewMode())
    
    act(() => {
      result.current.setViewMode('list')
    })
    
    expect(result.current.viewMode).toBe('list')
    
    act(() => {
      result.current.setViewMode('grid')
    })
    
    expect(result.current.viewMode).toBe('grid')
  })
})

describe('useViewMode - 永続化', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  test('初期化時にlocalStorageから読み込まれる', () => {
    localStorageMock.getItem.mockReturnValue('list')
    
    const { result } = renderHook(() => useViewMode())
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith('library-view-mode')
    expect(result.current.viewMode).toBe('list')
  })

  test('モード変更時にlocalStorageに保存される', () => {
    const { result } = renderHook(() => useViewMode())
    
    act(() => {
      result.current.setViewMode('list')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('library-view-mode', 'list')
  })

  test('無効な値はデフォルト値にフォールバックする', () => {
    localStorageMock.getItem.mockReturnValue('invalid-mode')
    
    const { result } = renderHook(() => useViewMode())
    
    expect(result.current.viewMode).toBe('grid')
  })

  test('nullの場合はデフォルト値を使用する', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useViewMode())
    
    expect(result.current.viewMode).toBe('grid')
  })

  test('空文字の場合はデフォルト値を使用する', () => {
    localStorageMock.getItem.mockReturnValue('')
    
    const { result } = renderHook(() => useViewMode())
    
    expect(result.current.viewMode).toBe('grid')
  })
})

describe('useViewMode - カスタム初期値', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  test('カスタム初期値が設定できる', () => {
    const { result } = renderHook(() => useViewMode('list'))
    
    expect(result.current.viewMode).toBe('list')
  })

  test('localStorage値がカスタム初期値より優先される', () => {
    localStorageMock.getItem.mockReturnValue('grid')
    
    const { result } = renderHook(() => useViewMode('list'))
    
    expect(result.current.viewMode).toBe('grid')
  })
})

describe('useViewMode - エラーハンドリング', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  test('localStorage読み込みエラー時はデフォルト値を使用', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })
    
    const { result } = renderHook(() => useViewMode())
    
    expect(result.current.viewMode).toBe('grid')
  })

  test('localStorage書き込みエラー時も状態は更新される', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })
    
    const { result } = renderHook(() => useViewMode())
    
    act(() => {
      result.current.setViewMode('list')
    })
    
    // エラーが発生してもReactの状態は更新される
    expect(result.current.viewMode).toBe('list')
  })
})