/**
 * ウィッシュリスト管理 Server Actions
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { validateWishlistInput, isValidPriority } from '@/lib/utils/wishlist-utils'
import { AuthenticationError, ValidationError as BookValidationError, DuplicateError, errorToResponse } from '@/lib/errors/book-errors'
import type {
  AddToWishlistInput,
  UpdatePriorityInput,
  RemoveFromWishlistInput,
  MoveToLibraryInput,
  GetWishlistInput,
  WishlistActionResult,
  WishlistItemWithBook
} from '@/lib/models/wishlist'

/**
 * 認証されたユーザーIDを取得
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

/**
 * ウィッシュリストに書籍を追加
 */
export async function addToWishlist(
  input: AddToWishlistInput
): Promise<WishlistActionResult<WishlistItemWithBook>> {
  try {
    // 認証チェック
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      throw new AuthenticationError()
    }

    // 入力バリデーション
    const validation = validateWishlistInput(input)
    if (!validation.isValid) {
      throw new BookValidationError(validation.errors[0])
    }

    // 書籍存在確認
    const book = await prisma.book.findUnique({
      where: { id: input.bookId }
    })
    
    if (!book) {
      throw new BookValidationError('指定された書籍が見つかりません')
    }

    // 重複チェック: 既に本棚にある場合
    const existingUserBook = await prisma.userBook.findFirst({
      where: {
        userId,
        bookId: input.bookId
      }
    })
    
    if (existingUserBook) {
      throw new BookValidationError('この書籍は既に本棚に登録されています')
    }

    // 重複チェック: 既にウィッシュリストにある場合
    const existingWishlistItem = await prisma.wishlistItem.findFirst({
      where: {
        userId,
        bookId: input.bookId
      }
    })
    
    if (existingWishlistItem) {
      throw new BookValidationError('この書籍は既にウィッシュリストに登録されています')
    }

    // ウィッシュリストアイテム作成
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId,
        bookId: input.bookId,
        priority: input.priority || 'medium',
        reason: input.reason || null,
        targetDate: input.targetDate || null,
        priceAlert: input.priceAlert ? input.priceAlert.toString() : null
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            publisher: true,
            thumbnailUrl: true,
            pageCount: true,
            description: true,
            categories: true
          }
        }
      }
    })

    revalidatePath('/wishlist')

    return {
      success: true,
      data: wishlistItem
    }

  } catch (error) {
    const errorResponse = errorToResponse(error)
    return {
      success: false,
      error: errorResponse.error
    }
  }
}

/**
 * ウィッシュリストアイテムの優先度を更新
 */
export async function updateWishlistPriority(
  input: UpdatePriorityInput
): Promise<WishlistActionResult<WishlistItemWithBook>> {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      throw new AuthenticationError()
    }

    if (!isValidPriority(input.priority)) {
      throw new BookValidationError('無効な優先度です')
    }

    // 権限チェック付きで取得
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        id: input.wishlistItemId,
        userId
      }
    })

    if (!existingItem) {
      throw new BookValidationError('指定されたアイテムが見つかりません')
    }

    const updatedItem = await prisma.wishlistItem.update({
      where: {
        id: input.wishlistItemId
      },
      data: {
        priority: input.priority
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            publisher: true,
            thumbnailUrl: true,
            pageCount: true,
            description: true,
            categories: true
          }
        }
      }
    })

    revalidatePath('/wishlist')

    return {
      success: true,
      data: updatedItem
    }

  } catch (error) {
    const errorResponse = errorToResponse(error)
    return {
      success: false,
      error: errorResponse.error
    }
  }
}

/**
 * ウィッシュリストから書籍を削除
 */
export async function removeFromWishlist(
  input: RemoveFromWishlistInput
): Promise<WishlistActionResult<{ success: boolean }>> {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      throw new AuthenticationError()
    }

    // 権限チェック付きで削除
    const deleteResult = await prisma.wishlistItem.deleteMany({
      where: {
        id: input.wishlistItemId,
        userId // ユーザー認可チェック
      }
    })

    if (deleteResult.count === 0) {
      throw new BookValidationError('アクセス権限がありません')
    }

    revalidatePath('/wishlist')

    return {
      success: true,
      data: { success: true }
    }

  } catch (error) {
    const errorResponse = errorToResponse(error)
    return {
      success: false,
      error: errorResponse.error
    }
  }
}

/**
 * ウィッシュリストから本棚に移動
 */
export async function moveToLibrary(
  input: MoveToLibraryInput
): Promise<WishlistActionResult<{ userBook: any }>> {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      throw new AuthenticationError()
    }

    // トランザクション内で処理
    const result = await prisma.$transaction(async (tx) => {
      // ウィッシュリストアイテム取得（権限チェック付き）
      const wishlistItem = await tx.wishlistItem.findFirst({
        where: {
          id: input.wishlistItemId,
          userId
        },
        include: {
          book: true
        }
      })

      if (!wishlistItem) {
        throw new BookValidationError('指定されたアイテムが見つかりません')
      }

      // UserBook 作成
      const userBook = await tx.userBook.create({
        data: {
          userId,
          bookId: wishlistItem.bookId,
          bookType: input.bookType || 'physical' as const,
          status: input.status || 'want_to_read' as const
        },
        include: {
          book: true
        }
      })

      // ウィッシュリストアイテム削除
      await tx.wishlistItem.delete({
        where: { id: input.wishlistItemId }
      })

      return { userBook }
    })

    revalidatePath('/wishlist')
    revalidatePath('/library')

    return {
      success: true,
      data: result
    }

  } catch (error) {
    const errorResponse = errorToResponse(error)
    return {
      success: false,
      error: errorResponse.error
    }
  }
}

/**
 * ユーザーのウィッシュリストを取得
 */
export async function getUserWishlist(
  input: GetWishlistInput = {}
): Promise<WishlistActionResult<WishlistItemWithBook[]>> {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      throw new AuthenticationError()
    }

    const {
      priority,
      sortBy = 'priority',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = input

    // クエリ条件構築
    const where: any = { userId }
    if (priority) {
      where.priority = priority
    }

    // ソート条件構築
    let orderBy: any[]
    switch (sortBy) {
      case 'priority':
        // 優先度の場合は、カスタムソートロジックを後で適用するため、
        // ここではcreatedAtでソートしておく
        orderBy = [{ createdAt: 'desc' }]
        break
      case 'createdAt':
        orderBy = [{ createdAt: sortOrder }]
        break
      case 'targetDate':
        orderBy = [
          { targetDate: { sort: sortOrder, nulls: 'last' } },
          { createdAt: 'desc' }
        ]
        break
      case 'title':
        orderBy = [
          { book: { title: sortOrder } },
          { createdAt: 'desc' }
        ]
        break
      default:
        orderBy = [{ createdAt: 'desc' }]
    }

    let wishlistItems = await prisma.wishlistItem.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            publisher: true,
            thumbnailUrl: true,
            pageCount: true,
            description: true,
            categories: true
          }
        }
      }
    })

    // 優先度ソートの場合は、メモリ上でソート
    if (sortBy === 'priority') {
      const { sortByPriority } = await import('@/lib/utils/wishlist-utils')
      wishlistItems = sortByPriority(wishlistItems)
      if (sortOrder === 'asc') {
        wishlistItems.reverse()
      }
    }

    return {
      success: true,
      data: wishlistItems
    }

  } catch (error) {
    const errorResponse = errorToResponse(error)
    return {
      success: false,
      error: errorResponse.error
    }
  }
}