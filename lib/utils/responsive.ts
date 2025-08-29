'use client'

import { BREAKPOINTS } from '@/hooks/useViewport'

export function getResponsiveValue<T>(
  values: {
    xs?: T
    sm?: T
    md?: T
    lg?: T
    xl?: T
    '2xl'?: T
  },
  currentWidth: number
): T | undefined {
  if (currentWidth >= BREAKPOINTS['2XL'] && values['2xl']) return values['2xl']
  if (currentWidth >= BREAKPOINTS.XL && values.xl) return values.xl
  if (currentWidth >= BREAKPOINTS.LG && values.lg) return values.lg
  if (currentWidth >= BREAKPOINTS.MD && values.md) return values.md
  if (currentWidth >= BREAKPOINTS.SM && values.sm) return values.sm
  return values.xs
}

export function createResponsiveClasses(
  property: string,
  values: {
    xs?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
    '2xl'?: string
  }
): string {
  const classes: string[] = []
  
  if (values.xs) classes.push(`${property}-${values.xs}`)
  if (values.sm) classes.push(`sm:${property}-${values.sm}`)
  if (values.md) classes.push(`md:${property}-${values.md}`)
  if (values.lg) classes.push(`lg:${property}-${values.lg}`)
  if (values.xl) classes.push(`xl:${property}-${values.xl}`)
  if (values['2xl']) classes.push(`2xl:${property}-${values['2xl']}`)
  
  return classes.join(' ')
}