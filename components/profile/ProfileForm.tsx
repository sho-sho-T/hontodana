'use client'

import type React from 'react'
import { useEffect, useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProfileFormProps } from '@/types/profile'
import { PROFILE_ERROR_MESSAGES } from '@/lib/constants/profile-errors'

export default function ProfileForm({
  profile,
  onSave,
  loading = false,
  className,
}: ProfileFormProps) {
  const [name, setName] = useState(profile.name || '')
  const [readingGoal, setReadingGoal] = useState(profile.readingGoal?.toString() || '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const isLoading = loading || isPending

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = PROFILE_ERROR_MESSAGES.NAME_REQUIRED
    } else if (name.length > 50) {
      newErrors.name = PROFILE_ERROR_MESSAGES.NAME_TOO_LONG
    }

    if (readingGoal) {
      const goal = Number.parseInt(readingGoal, 10)
      if (Number.isNaN(goal) || goal < 1 || goal > 365) {
        newErrors.readingGoal = PROFILE_ERROR_MESSAGES.READING_GOAL_INVALID
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const data = {
      name: name.trim(),
      avatarUrl: profile.avatarUrl,
      readingGoal: readingGoal ? Number.parseInt(readingGoal, 10) : null,
    }

    startTransition(async () => {
      await onSave(data)
    })
  }

  // リアルタイムバリデーション（入力値変更時）
  useEffect(() => {
    if (name || readingGoal) {
      validateForm()
    }
  }, [name, readingGoal])

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">表示名</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="表示名を入力"
            disabled={isLoading}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="readingGoal">読書目標</Label>
          <Input
            id="readingGoal"
            type="number"
            value={readingGoal}
            onChange={(e) => setReadingGoal(e.target.value)}
            placeholder="年間の読書目標（冊数）"
            min="1"
            max="365"
            disabled={isLoading}
            className={errors.readingGoal ? 'border-red-500' : ''}
          />
          {errors.readingGoal && (
            <p className="mt-1 text-sm text-red-600">{errors.readingGoal}</p>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? '更新中...' : '保存'}
      </Button>
    </form>
  )
}