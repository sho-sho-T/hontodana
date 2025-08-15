/**
 * 読書進捗管理 Server Actions
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { calculateProgressPercentage, validateProgressInput } from '@/lib/utils/reading-progress'
import { AuthenticationError, ValidationError as BookValidationError, DatabaseError, errorToResponse } from '@/lib/errors/book-errors'
import type { UpdateProgressInput, UpdateProgressResult } from '@/lib/models/reading-progress'

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
 * 読書進捗を更新
 */
export async function updateReadingProgress(
  input: UpdateProgressInput
): Promise<UpdateProgressResult> {
  try {
    // 認証チェック
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      throw new AuthenticationError()
    }

    // 入力バリデーション
    const validation = await validateProgressInput(input)
    if (!validation.isValid) {
      throw new BookValidationError(validation.errors[0])
    }

    // トランザクション内で処理
    const result = await prisma.$transaction(async (tx) => {
      // 既存のUserBookを取得
      const existingUserBook = await tx.userBook.findUnique({
        where: {
          id: input.userBookId,
          userId // 認可チェック
        },
        include: {
          book: true
        }
      })

      if (!existingUserBook) {
        throw new BookValidationError('指定された書籍が見つかりません')
      }

      // 進捗の妥当性チェック
      const currentProgress = existingUserBook.currentPage || 0
      
      if (input.currentPage < currentProgress) {
        throw new BookValidationError('進捗を逆行させることはできません')
      }

      if (existingUserBook.book.pageCount && input.currentPage > existingUserBook.book.pageCount) {
        throw new BookValidationError('総ページ数を超えています')
      }

      // 進捗率計算
      const progressPercentage = calculateProgressPercentage(
        input.currentPage,
        existingUserBook.book.pageCount
      )

      // 読了判定
      const isCompleted = existingUserBook.book.pageCount 
        ? input.currentPage >= existingUserBook.book.pageCount
        : false

      // 新しいステータスを決定
      let newStatus = existingUserBook.status
      if (isCompleted) {
        newStatus = 'completed'
      } else if (input.currentPage > 0 && existingUserBook.status === 'want_to_read') {
        newStatus = 'reading'
      }

      // UserBookを更新
      const updatedUserBook = await tx.userBook.update({
        where: { id: input.userBookId },
        data: {
          currentPage: input.currentPage,
          status: newStatus,
          startDate: newStatus === 'reading' && !existingUserBook.startDate 
            ? new Date() 
            : existingUserBook.startDate,
          finishDate: isCompleted ? new Date() : existingUserBook.finishDate
        },
        include: {
          book: true
        }
      })

      // ReadingSessionを作成
      const startPage = Math.max(currentProgress + 1, 1)
      const pagesRead = Math.max(input.currentPage - currentProgress, 0)
      
      const newSession = await tx.readingSession.create({
        data: {
          userBookId: input.userBookId,
          startPage,
          endPage: input.currentPage,
          pagesRead,
          sessionDate: new Date(),
          notes: input.sessionNotes || null,
          // durationMinutes は今回の実装では null にする
        }
      })

      return {
        updatedUserBook,
        newSession,
        isCompleted,
        progressPercentage
      }
    })

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