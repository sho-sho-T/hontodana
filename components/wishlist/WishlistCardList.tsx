'use client'

import { WishlistCard } from './WishlistCard'
import type { WishlistItemWithBook } from '@/lib/models/wishlist'

interface WishlistCardListProps {
  items: WishlistItemWithBook[]
  onPriorityChange?: (id: string, newPriority: string) => Promise<void> | void
  onRemove?: (id: string) => Promise<void> | void
  onMoveToLibrary?: (id: string) => Promise<void> | void
}

export function WishlistCardList({ 
  items, 
  onPriorityChange,
  onRemove,
  onMoveToLibrary 
}: WishlistCardListProps) {
  const handlePriorityChange = async (id: string, newPriority: string) => {
    if (onPriorityChange) {
      await onPriorityChange(id, newPriority)
    } else {
      console.log('Priority changed:', id, newPriority)
    }
  }
  
  const handleRemove = async (id: string) => {
    if (onRemove) {
      await onRemove(id)
    } else {
      console.log('Removed from wishlist:', id)
    }
  }
  
  const handleMoveToLibrary = async (id: string) => {
    if (onMoveToLibrary) {
      await onMoveToLibrary(id)
    } else {
      console.log('Moved to library:', id)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => (
        <WishlistCard
          key={item.id}
          item={item}
          onPriorityChange={handlePriorityChange}
          onMoveToLibrary={handleMoveToLibrary}
          onRemove={handleRemove}
        />
      ))}
    </div>
  )
}