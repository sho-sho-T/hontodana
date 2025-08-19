'use client'

import { WishlistCard } from './WishlistCard'
import type { WishlistItemWithBook } from '@/lib/models/wishlist'

interface WishlistCardListProps {
  items: WishlistItemWithBook[]
}

export function WishlistCardList({ items }: WishlistCardListProps) {
  const handlePriorityChange = (id: string, newPriority: string) => {
    console.log('Priority changed:', id, newPriority)
    // TODO: Implement actual priority change logic with Server Actions
  }
  
  const handleRemove = (id: string) => {
    console.log('Removed from wishlist:', id)
    // TODO: Implement actual remove logic with Server Actions
  }
  
  const handleMoveToLibrary = (id: string) => {
    console.log('Moved to library:', id)
    // TODO: Implement actual move to library logic with Server Actions
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