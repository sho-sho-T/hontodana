'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/supabase/server';
import { COLLECTION_ERROR_MESSAGES } from '@/lib/constants/error-messages';
import type { 
  CreateCollectionData, 
  UpdateCollectionData, 
  BookOrder, 
  ActionResult,
  CollectionWithCount,
  CollectionWithBooks
} from '@/types/collection';
import { z } from 'zod';

// バリデーションスキーマ
const createCollectionSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以下で入力してください'),
  description: z.string().max(500, '説明は500文字以下で入力してください').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '有効なカラーコードを入力してください').optional(),
  icon: z.string().optional(),
  isPublic: z.boolean().optional(),
});

const updateCollectionSchema = createCollectionSchema.partial();

const bookOrderSchema = z.object({
  userBookId: z.string().uuid(),
  sortOrder: z.number().min(0),
});

/**
 * ユーザー認証と権限をチェックする共通関数
 */
async function checkUserAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: COLLECTION_ERROR_MESSAGES.AUTH_REQUIRED,
    };
  }
  return { success: true, user };
}

/**
 * 新しいコレクションを作成します
 */
export async function createCollection(data: CreateCollectionData): Promise<ActionResult<any>> {
  try {
    const authResult = await checkUserAuth();
    if (!authResult.success) {
      return authResult;
    }
    const { user } = authResult;

    // バリデーション
    const validatedData = createCollectionSchema.parse(data);

    // 重複チェック
    const existingCollection = await prisma.collection.findFirst({
      where: {
        userId: user.id,
        name: validatedData.name,
      },
    });

    if (existingCollection) {
      return {
        success: false,
        error: '同じ名前のコレクションが既に存在します',
      };
    }

    // コレクションの最大数チェック
    const collectionCount = await prisma.collection.count({
      where: { userId: user.id },
    });

    if (collectionCount >= 50) {
      return {
        success: false,
        error: 'コレクションは最大50個まで作成できます',
      };
    }

    // コレクション作成
    const collection = await prisma.collection.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color || '#3B82F6',
        icon: validatedData.icon || '📚',
        isPublic: validatedData.isPublic || false,
        sortOrder: collectionCount, // 末尾に追加
      },
    });

    return {
      success: true,
      data: collection,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || 'バリデーションエラーです',
      };
    }

    console.error('Failed to create collection:', error);
    return {
      success: false,
      error: 'コレクションの作成に失敗しました',
    };
  }
}

/**
 * コレクションを更新します
 */
export async function updateCollection(
  collectionId: string,
  data: UpdateCollectionData
): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // バリデーション
    const validatedData = updateCollectionSchema.parse(data);

    // コレクションの存在と所有者チェック
    const existingCollection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!existingCollection || existingCollection.userId !== user.id) {
      return {
        success: false,
        error: 'コレクションが見つかりません',
      };
    }

    // 名前の重複チェック（更新する場合のみ）
    if (validatedData.name && validatedData.name !== existingCollection.name) {
      const duplicateCollection = await prisma.collection.findFirst({
        where: {
          userId: user.id,
          name: validatedData.name,
        },
      });

      if (duplicateCollection) {
        return {
          success: false,
          error: '同じ名前のコレクションが既に存在します',
        };
      }
    }

    // コレクション更新
    const updatedCollection = await prisma.collection.update({
      where: { id: collectionId },
      data: validatedData,
    });

    return {
      success: true,
      data: updatedCollection,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || 'バリデーションエラーです',
      };
    }

    console.error('Failed to update collection:', error);
    return {
      success: false,
      error: 'コレクションの更新に失敗しました',
    };
  }
}

/**
 * コレクションを削除します
 */
export async function deleteCollection(collectionId: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // コレクションの存在と所有者チェック
    const existingCollection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!existingCollection) {
      return {
        success: false,
        error: 'コレクションが見つかりません',
      };
    }

    if (existingCollection.userId !== user.id) {
      return {
        success: false,
        error: 'このコレクションを削除する権限がありません',
      };
    }

    // コレクション削除（CollectionBookは外部キー制約によりカスケード削除される）
    await prisma.collection.delete({
      where: { id: collectionId },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to delete collection:', error);
    return {
      success: false,
      error: 'コレクションの削除に失敗しました',
    };
  }
}

/**
 * ユーザーのコレクション一覧を取得します
 */
export async function getUserCollections(): Promise<ActionResult<CollectionWithCount[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const collections = await prisma.collection.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { collectionBooks: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const collectionsWithCount: CollectionWithCount[] = collections.map(collection => ({
      ...collection,
      booksCount: collection._count.collectionBooks,
    }));

    return {
      success: true,
      data: collectionsWithCount,
    };
  } catch (error) {
    console.error('Failed to get user collections:', error);
    return {
      success: false,
      error: 'コレクションの取得に失敗しました',
    };
  }
}

/**
 * 書籍をコレクションに追加します
 */
export async function addBookToCollection(
  collectionId: string,
  userBookId: string
): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // コレクションの存在と所有者チェック
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection || collection.userId !== user.id) {
      return {
        success: false,
        error: 'コレクションが見つかりません',
      };
    }

    // 書籍の存在と所有者チェック
    const userBook = await prisma.userBook.findUnique({
      where: { id: userBookId },
    });

    if (!userBook || userBook.userId !== user.id) {
      return {
        success: false,
        error: '書籍が見つかりません',
      };
    }

    // コレクション内の書籍数を取得してsortOrderを決定
    const booksCount = await prisma.collectionBook.count({
      where: { collectionId },
    });

    // 書籍をコレクションに追加
    const collectionBook = await prisma.collectionBook.create({
      data: {
        collectionId,
        userBookId,
        sortOrder: booksCount, // 末尾に追加
      },
    });

    return {
      success: true,
      data: collectionBook,
    };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'この書籍は既にコレクションに追加されています',
      };
    }

    console.error('Failed to add book to collection:', error);
    return {
      success: false,
      error: '書籍のコレクションへの追加に失敗しました',
    };
  }
}

/**
 * コレクションから書籍を削除します
 */
export async function removeBookFromCollection(
  collectionId: string,
  userBookId: string
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // コレクションの所有者チェック
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection || collection.userId !== user.id) {
      return {
        success: false,
        error: 'コレクションが見つかりません',
      };
    }

    // CollectionBookを削除
    const deleteResult = await prisma.collectionBook.deleteMany({
      where: {
        collectionId,
        userBookId,
      },
    });

    if (deleteResult.count === 0) {
      return {
        success: false,
        error: '指定された書籍がコレクションに見つかりません',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to remove book from collection:', error);
    return {
      success: false,
      error: 'コレクションからの書籍削除に失敗しました',
    };
  }
}

/**
 * コレクション内の書籍の順序を更新します
 */
export async function updateBookOrderInCollection(
  collectionId: string,
  bookOrders: BookOrder[]
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    // バリデーション
    const validatedOrders = z.array(bookOrderSchema).parse(bookOrders);

    // コレクションの所有者チェック
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection || collection.userId !== user.id) {
      return {
        success: false,
        error: 'コレクションが見つかりません',
      };
    }

    // 順序を一つずつ更新
    for (const bookOrder of validatedOrders) {
      await prisma.collectionBook.updateMany({
        where: {
          collectionId,
          userBookId: bookOrder.userBookId,
        },
        data: {
          sortOrder: bookOrder.sortOrder,
        },
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: '無効なデータが入力されました',
      };
    }

    console.error('Failed to update book order:', error);
    return {
      success: false,
      error: '書籍の順序更新に失敗しました',
    };
  }
}

/**
 * コレクションと含まれる書籍の詳細を取得します
 */
export async function getCollectionWithBooks(
  collectionId: string
): Promise<ActionResult<CollectionWithBooks>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        collectionBooks: {
          orderBy: { sortOrder: 'asc' },
          include: {
            userBook: {
              include: {
                book: {
                  select: {
                    id: true,
                    title: true,
                    authors: true,
                    thumbnailUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!collection || collection.userId !== user.id) {
      return {
        success: false,
        error: 'コレクションが見つかりません',
      };
    }

    // データ形式を整形
    const collectionWithBooks: CollectionWithBooks = {
      ...collection,
      books: collection.collectionBooks.map(cb => ({
        id: cb.id,
        sortOrder: cb.sortOrder,
        addedAt: cb.addedAt,
        title: cb.userBook.book.title,
        authors: cb.userBook.book.authors,
        thumbnailUrl: cb.userBook.book.thumbnailUrl,
        status: cb.userBook.status,
        currentPage: cb.userBook.currentPage,
        bookId: cb.userBook.book.id,
        userBookId: cb.userBook.id,
      })),
    };

    return {
      success: true,
      data: collectionWithBooks,
    };
  } catch (error) {
    console.error('Failed to get collection with books:', error);
    return {
      success: false,
      error: 'コレクション詳細の取得に失敗しました',
    };
  }
}