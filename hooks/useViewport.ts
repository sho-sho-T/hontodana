'use client'

import { useState, useEffect, useCallback } from 'react'

// ブレークポイント定数の定義
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const

export interface ViewportState {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  breakpoint: keyof typeof BREAKPOINTS | 'XS'
}

const getViewportState = (width: number, height: number): ViewportState => {
  let breakpoint: ViewportState['breakpoint'] = 'XS'
  
  if (width >= BREAKPOINTS['2XL']) breakpoint = '2XL'
  else if (width >= BREAKPOINTS.XL) breakpoint = 'XL'
  else if (width >= BREAKPOINTS.LG) breakpoint = 'LG'
  else if (width >= BREAKPOINTS.MD) breakpoint = 'MD'
  else if (width >= BREAKPOINTS.SM) breakpoint = 'SM'

  return {
    width,
    height,
    isMobile: width < BREAKPOINTS.SM,
    isTablet: width >= BREAKPOINTS.MD && width < BREAKPOINTS.LG,
    isDesktop: width >= BREAKPOINTS.LG,
    breakpoint,
  }
}

export function useViewport(): ViewportState {
  const [viewport, setViewport] = useState<ViewportState>(() => {
    // SSR対応のデフォルト値
    if (typeof window === 'undefined') {
      return getViewportState(BREAKPOINTS.LG, 768)
    }
    return getViewportState(window.innerWidth, window.innerHeight)
  })

  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return
    setViewport(getViewportState(window.innerWidth, window.innerHeight))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 初回設定
    handleResize()

    // デバウンス処理（パフォーマンス改善）
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', debouncedResize, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', debouncedResize)
    }
  }, [handleResize])

  return viewport
}