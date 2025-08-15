/**
 * 書籍リストコンポーネント（リスト表示用）
 */

import React from 'react'
import Image from 'next/image'
import { ChevronUp, ChevronDown, X } from 'lucide-react'
import { BookStatus } from '@/lib/models/book'
import type { BookListProps } from '@/lib/models/book'
import { getStatusLabel, formatDate } from '@/lib/utils/book-ui-helpers'

export function BookList({ 
  books, 
  onStatusChange, 
  onRemove, 
  sortBy, 
  sortOrder, 
  onSort,
  activeFilters = [],
  onClearFilters 
}: BookListProps) {
  const handleSort = (field: typeof sortBy) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
    onSort(field, newOrder)
  }

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
  }



  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600 mb-2">書籍がありません</p>
        <p className="text-gray-500">新しい書籍を追加してください</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* フィルタ表示 */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">フィルタ:</span>
          {activeFilters.map((filter, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
            >
              {filter.label}
            </span>
          ))}
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
              aria-label="フィルタをクリア"
            >
              フィルタをクリア
            </button>
          )}
        </div>
      )}

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">書影</th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-1 hover:text-blue-600"
                  aria-label="タイトルでソート"
                >
                  タイトル
                  {getSortIcon('title')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('author')}
                  className="flex items-center gap-1 hover:text-blue-600"
                  aria-label="著者でソート"
                >
                  著者
                  {getSortIcon('author')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">ページ数</th>
              <th className="px-4 py-3 text-left">ステータス</th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1 hover:text-blue-600"
                  aria-label="追加日でソート"
                >
                  追加日
                  {getSortIcon('createdAt')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('updatedAt')}
                  className="flex items-center gap-1 hover:text-blue-600"
                  aria-label="更新日でソート"
                >
                  更新日
                  {getSortIcon('updatedAt')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {books.map((book) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="w-12 h-16 relative bg-gray-100 rounded">
                    <Image
                      src={book.book.thumbnailUrl || '/images/book-placeholder.png'}
                      alt={`${book.book.title} の書影`}
                      fill
                      className="object-cover rounded"
                      sizes="48px"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 line-clamp-2">
                    {book.book.title}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">
                    {book.book.authors.join(', ')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">
                    {book.book.pageCount ? `${book.book.pageCount}ページ` : '-'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {getStatusLabel(book.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">
                    {formatDate(book.createdAt)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">
                    {formatDate(book.updatedAt)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onStatusChange(book.id, BookStatus.READ)}
                      className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      aria-label={`${book.book.title} のステータスを変更`}
                    >
                      完了
                    </button>
                    <button
                      onClick={() => onRemove(book.id)}
                      className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      aria-label={`${book.book.title} を削除`}
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}