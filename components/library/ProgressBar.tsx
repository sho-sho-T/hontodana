/**
 * 読書進捗バーコンポーネント
 */

import React from 'react'
import type { ProgressBarProps } from '@/lib/models/book'
import { calculateProgress } from '@/lib/utils/book-ui-helpers'

export function ProgressBar({ current, total, label = '読書進捗' }: ProgressBarProps) {
  const progress = calculateProgress(current, total)

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>
      <div 
        className="w-full bg-gray-200 rounded-full h-2"
        role="progressbar"
        aria-label={label}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${progress}% 完了`}
      >
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
          data-testid="progress-indicator"
        />
      </div>
    </div>
  )
}