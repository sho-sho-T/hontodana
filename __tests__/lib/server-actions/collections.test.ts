import { 
  createCollection, 
  updateCollection, 
  deleteCollection,
  getUserCollections,
  addBookToCollection,
  removeBookFromCollection,
  updateBookOrderInCollection,
  getCollectionWithBooks
} from '@/lib/server-actions/collections';
import { prisma } from '@/lib/prisma';
import type { CreateCollectionData, UpdateCollectionData } from '@/types/collection';

// Prismaのモック
jest.mock('@/lib/prisma', () => ({
  prisma: {
    collection: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    collectionBook: {
      create: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    userBook: {
      findUnique: jest.fn(),
    },
  },
}));

// AuthのモックUser
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

jest.mock('@/lib/supabase/server', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve(mockUser)),
}));

const prismaMock = prisma as jest.Mocked<typeof prisma>;

describe('Collection Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCollection', () => {
    test('should create collection with valid data', async () => {
      const collectionData: CreateCollectionData = {
        name: 'お気に入りの本',
        description: '特に印象深い本のコレクション',
        color: '#FF5733',
        icon: '⭐',
        isPublic: false,
      };

      const mockCollection = {
        id: 'collection-123',
        userId: 'user-123',
        ...collectionData,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.collection.count.mockResolvedValue(0);
      prismaMock.collection.create.mockResolvedValue(mockCollection);

      const result = await createCollection(collectionData);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('お気に入りの本');
      expect(prismaMock.collection.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          name: collectionData.name,
          description: collectionData.description,
          color: collectionData.color,
          icon: collectionData.icon,
          isPublic: collectionData.isPublic,
          sortOrder: 0,
        },
      });
    });

    test('should create collection with minimal data', async () => {
      const collectionData: CreateCollectionData = {
        name: 'テスト',
      };

      const mockCollection = {
        id: 'collection-123',
        userId: 'user-123',
        name: 'テスト',
        description: null,
        color: '#3B82F6',
        icon: '📚',
        isPublic: false,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.collection.count.mockResolvedValue(0);
      prismaMock.collection.create.mockResolvedValue(mockCollection);

      const result = await createCollection(collectionData);

      expect(result.success).toBe(true);
      expect(result.data?.color).toBe('#3B82F6'); // デフォルト値
      expect(result.data?.icon).toBe('📚'); // デフォルト値
      expect(result.data?.isPublic).toBe(false); // デフォルト値
    });

    test('should fail with empty name', async () => {
      const collectionData: CreateCollectionData = {
        name: '',
      };

      const result = await createCollection(collectionData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('名前は必須');
      expect(prismaMock.collection.create).not.toHaveBeenCalled();
    });

    test('should fail with duplicate name', async () => {
      const collectionData: CreateCollectionData = {
        name: '既存のコレクション',
      };

      prismaMock.collection.findFirst.mockResolvedValue({
        id: 'existing-collection',
        userId: 'user-123',
        name: '既存のコレクション',
      } as any);

      const result = await createCollection(collectionData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('同じ名前のコレクションが既に存在します');
      expect(prismaMock.collection.create).not.toHaveBeenCalled();
    });

    test('should fail with name too long', async () => {
      const collectionData: CreateCollectionData = {
        name: 'a'.repeat(101), // 101文字
      };

      const result = await createCollection(collectionData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('100文字以下');
      expect(prismaMock.collection.create).not.toHaveBeenCalled();
    });
  });

  describe('updateCollection', () => {
    test('should update collection successfully', async () => {
      const updateData: UpdateCollectionData = {
        name: '更新されたコレクション',
        description: '新しい説明',
        color: '#00FF00',
      };

      const existingCollection = {
        id: 'collection-123',
        userId: 'user-123',
        name: '元のコレクション',
        description: '元の説明',
        color: '#FF0000',
        icon: '📚',
        isPublic: false,
        sortOrder: 0,
      };

      const updatedCollection = {
        ...existingCollection,
        ...updateData,
        updatedAt: new Date(),
      };

      prismaMock.collection.findUnique.mockResolvedValue(existingCollection as any);
      prismaMock.collection.findFirst.mockResolvedValue(null); // 重複なし
      prismaMock.collection.update.mockResolvedValue(updatedCollection as any);

      const result = await updateCollection('collection-123', updateData);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('更新されたコレクション');
    });

    test('should fail with non-existent collection', async () => {
      const updateData: UpdateCollectionData = {
        name: 'テスト',
      };

      prismaMock.collection.findUnique.mockResolvedValue(null);

      const result = await updateCollection('non-existent-id', updateData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('見つかりません');
      expect(prismaMock.collection.update).not.toHaveBeenCalled();
    });

    test('should fail with duplicate name', async () => {
      const updateData: UpdateCollectionData = {
        name: '他の既存コレクション名',
      };

      const existingCollection = {
        id: 'collection-123',
        userId: 'user-123',
        name: '元のコレクション',
      };

      const duplicateCollection = {
        id: 'other-collection',
        userId: 'user-123',
        name: '他の既存コレクション名',
      };

      prismaMock.collection.findUnique
        .mockResolvedValueOnce(existingCollection as any);
      prismaMock.collection.findFirst
        .mockResolvedValueOnce(duplicateCollection as any);

      const result = await updateCollection('collection-123', updateData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('同じ名前のコレクションが既に存在します');
      expect(prismaMock.collection.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteCollection', () => {
    test('should delete empty collection', async () => {
      const existingCollection = {
        id: 'collection-123',
        userId: 'user-123',
        name: 'テストコレクション',
      };

      prismaMock.collection.findUnique.mockResolvedValue(existingCollection as any);
      prismaMock.collection.delete.mockResolvedValue(existingCollection as any);

      const result = await deleteCollection('collection-123');

      expect(result.success).toBe(true);
      expect(prismaMock.collection.delete).toHaveBeenCalledWith({
        where: { id: 'collection-123' },
      });
    });

    test('should fail with non-existent collection', async () => {
      prismaMock.collection.findUnique.mockResolvedValue(null);

      const result = await deleteCollection('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('見つかりません');
      expect(prismaMock.collection.delete).not.toHaveBeenCalled();
    });

    test('should fail when user is not owner', async () => {
      const otherUserCollection = {
        id: 'collection-123',
        userId: 'other-user-456',
        name: 'テストコレクション',
      };

      prismaMock.collection.findUnique.mockResolvedValue(otherUserCollection as any);

      const result = await deleteCollection('collection-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('権限がありません');
      expect(prismaMock.collection.delete).not.toHaveBeenCalled();
    });
  });

  describe('addBookToCollection', () => {
    test('should add book to collection successfully', async () => {
      const mockCollection = {
        id: 'collection-123',
        userId: 'user-123',
        name: 'テストコレクション',
      };

      const mockUserBook = {
        id: 'userbook-123',
        userId: 'user-123',
        bookId: 'book-123',
      };

      const mockCollectionBook = {
        id: 'collectionbook-123',
        collectionId: 'collection-123',
        userBookId: 'userbook-123',
        sortOrder: 0,
        addedAt: new Date(),
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection as any);
      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);
      prismaMock.collectionBook.count.mockResolvedValue(0);
      prismaMock.collectionBook.create.mockResolvedValue(mockCollectionBook);

      const result = await addBookToCollection('collection-123', 'userbook-123');

      expect(result.success).toBe(true);
      expect(result.data?.collectionId).toBe('collection-123');
      expect(result.data?.userBookId).toBe('userbook-123');
      expect(result.data?.sortOrder).toBe(0);
    });

    test('should set correct sort order for new book', async () => {
      const mockCollection = {
        id: 'collection-123',
        userId: 'user-123',
      };

      const mockUserBook = {
        id: 'userbook-123',
        userId: 'user-123',
      };

      const mockCollectionBook = {
        id: 'collectionbook-123',
        collectionId: 'collection-123',
        userBookId: 'userbook-123',
        sortOrder: 2,
        addedAt: new Date(),
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection as any);
      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);
      prismaMock.collectionBook.count.mockResolvedValue(2); // 既に2冊ある
      prismaMock.collectionBook.create.mockResolvedValue(mockCollectionBook);

      const result = await addBookToCollection('collection-123', 'userbook-123');

      expect(result.success).toBe(true);
      expect(result.data?.sortOrder).toBe(2); // 3番目（0-indexed）
    });

    test('should fail when book already in collection', async () => {
      const mockCollection = {
        id: 'collection-123',
        userId: 'user-123',
      };

      const mockUserBook = {
        id: 'userbook-123',
        userId: 'user-123',
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection as any);
      prismaMock.userBook.findUnique.mockResolvedValue(mockUserBook as any);
      
      // 既に存在することをシミュレート
      const duplicateError = new Error('Unique constraint failed');
      (duplicateError as any).code = 'P2002';
      prismaMock.collectionBook.create.mockRejectedValue(duplicateError);

      const result = await addBookToCollection('collection-123', 'userbook-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('この書籍は既にコレクションに追加されています');
    });

    test('should fail with non-existent collection', async () => {
      prismaMock.collection.findUnique.mockResolvedValue(null);

      const result = await addBookToCollection('non-existent-collection', 'userbook-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('コレクションが見つかりません');
      expect(prismaMock.collectionBook.create).not.toHaveBeenCalled();
    });

    test('should fail with non-existent book', async () => {
      const mockCollection = {
        id: 'collection-123',
        userId: 'user-123',
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection as any);
      prismaMock.userBook.findUnique.mockResolvedValue(null);

      const result = await addBookToCollection('collection-123', 'non-existent-book');

      expect(result.success).toBe(false);
      expect(result.error).toContain('書籍が見つかりません');
      expect(prismaMock.collectionBook.create).not.toHaveBeenCalled();
    });
  });

  describe('updateBookOrderInCollection', () => {
    test('should update book order successfully', async () => {
      const bookOrders = [
        { userBookId: '550e8400-e29b-41d4-a716-446655440000', sortOrder: 2 },
        { userBookId: '550e8400-e29b-41d4-a716-446655440001', sortOrder: 0 },
        { userBookId: '550e8400-e29b-41d4-a716-446655440002', sortOrder: 1 },
      ];

      const mockCollection = {
        id: 'collection-123',
        userId: 'user-123',
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection as any);

      const result = await updateBookOrderInCollection('collection-123', bookOrders);

      expect(result.success).toBe(true);
      expect(prismaMock.collectionBook.updateMany).toHaveBeenCalledTimes(3);
    });

    test('should handle single book order update', async () => {
      const bookOrders = [
        { userBookId: '550e8400-e29b-41d4-a716-446655440000', sortOrder: 5 },
      ];

      const mockCollection = {
        id: 'collection-123',
        userId: 'user-123',
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollection as any);

      const result = await updateBookOrderInCollection('collection-123', bookOrders);

      expect(result.success).toBe(true);
      expect(prismaMock.collectionBook.updateMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserCollections', () => {
    test('should return user collections with book counts', async () => {
      const mockCollections = [
        {
          id: 'collection-1',
          name: 'コレクション1',
          description: '説明1',
          color: '#FF0000',
          icon: '📚',
          isPublic: false,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { collectionBooks: 5 },
        },
        {
          id: 'collection-2',
          name: 'コレクション2',
          description: null,
          color: '#00FF00',
          icon: '⭐',
          isPublic: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { collectionBooks: 0 },
        },
      ];

      prismaMock.collection.findMany.mockResolvedValue(mockCollections as any);

      const result = await getUserCollections();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].booksCount).toBe(5);
      expect(result.data?.[1].booksCount).toBe(0);
    });
  });

  describe('getCollectionWithBooks', () => {
    test('should return collection with books', async () => {
      const mockCollectionWithBooks = {
        id: 'collection-123',
        userId: 'user-123',
        name: 'テストコレクション',
        description: '説明',
        color: '#FF0000',
        icon: '📚',
        isPublic: false,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        collectionBooks: [
          {
            id: 'cb-1',
            sortOrder: 0,
            addedAt: new Date(),
            userBook: {
              id: 'ub-1',
              bookId: 'book-1',
              status: 'reading',
              currentPage: 50,
              book: {
                id: 'book-1',
                title: '本のタイトル1',
                authors: ['著者1'],
                thumbnailUrl: 'http://example.com/thumb1.jpg',
              },
            },
          },
        ],
      };

      prismaMock.collection.findUnique.mockResolvedValue(mockCollectionWithBooks as any);

      const result = await getCollectionWithBooks('collection-123');

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('テストコレクション');
      expect(result.data?.books).toHaveLength(1);
      expect(result.data?.books[0].title).toBe('本のタイトル1');
    });

    test('should fail with non-existent collection', async () => {
      prismaMock.collection.findUnique.mockResolvedValue(null);

      const result = await getCollectionWithBooks('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('見つかりません');
    });
  });
});