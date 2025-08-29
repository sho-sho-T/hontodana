import { renderHook, act } from '@testing-library/react'
import { useViewport } from '@/hooks/useViewport'

describe('useViewport Hook', () => {
  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    })
  })

  test('should return current viewport dimensions', () => {
    const { result } = renderHook(() => useViewport())
    
    expect(result.current.width).toBe(1024)
    expect(result.current.height).toBe(768)
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(true)
    expect(result.current.breakpoint).toBe('LG')
  })

  test('should detect mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    })
    
    const { result } = renderHook(() => useViewport())
    
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.breakpoint).toBe('XS')
  })

  test('should update on window resize', async () => {
    const { result } = renderHook(() => useViewport())
    
    // Initial desktop size
    expect(result.current.isDesktop).toBe(true)
    
    // Resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 568,
      })
      window.dispatchEvent(new Event('resize'))
    })
    
    // Wait for debounced update
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
    })
    
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isDesktop).toBe(false)
  })
})