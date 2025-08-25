import type { Collection, CollectionBook, UserBook, Book } from '@/lib/generated/prisma';

// Collection作成用の型
export interface CreateCollectionData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
}

// Collection更新用の型
export interface UpdateCollectionData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
}

// Collection一覧表示用の型
export interface CollectionWithCount extends Collection {
  booksCount: number;
}

// Collection詳細表示用の型
export interface CollectionWithBooks extends Collection {
  books: Array<{
    id: string;
    sortOrder: number;
    addedAt: Date;
    title: string;
    authors: string[];
    thumbnailUrl: string | null;
    status: string;
    currentPage: number;
    bookId: string;
    userBookId: string;
  }>;
}

// 書籍の並び順更新用の型
export interface BookOrder {
  userBookId: string;
  sortOrder: number;
}

// Server Action用の結果型
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ドラッグ&ドロップ用の型
export interface DragItem {
  id: string;
  type: 'book' | 'collection';
  data: any;
}

// コレクション選択用の型
export interface CollectionOption {
  id: string;
  name: string;
  color: string;
  icon: string;
  booksCount: number;
}

// フォームバリデーション用の型
export interface CollectionFormData {
  name: string;
  description?: string;
  color: string;
  icon: string;
  isPublic: boolean;
}

// コレクションフィルタ用の型
export interface CollectionFilter {
  sortBy: 'name' | 'createdAt' | 'booksCount';
  sortOrder: 'asc' | 'desc';
  showEmpty: boolean;
  showPublicOnly: boolean;
}

// カラーパレット用の定数
export const COLLECTION_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
  '#F97316', // orange
  '#14B8A6', // teal
  '#84CC16', // lime
] as const;

// アイコン選択用の定数
export const COLLECTION_ICONS = [
  '📚', '📖', '📝', '📄', '📊', '📈',
  '⭐', '❤️', '🔥', '💡', '🎯', '🏆',
  '🎨', '🎵', '🎬', '🎮', '🏠', '💼',
  '🌟', '⚡', '🚀', '🔖', '💎', '🎁',
] as const;

export type CollectionColor = typeof COLLECTION_COLORS[number];
export type CollectionIcon = typeof COLLECTION_ICONS[number];