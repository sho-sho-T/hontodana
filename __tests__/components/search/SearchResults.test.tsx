import { render, screen } from '@testing-library/react';
import { SearchResults } from '@/components/search/SearchResults';
import type { UserBookWithBook } from '@/lib/models/book';

const mockBook: UserBookWithBook = {
  id: '1',
  userId: 'user-1',
  bookId: 'book-1',
  bookType: 'physical',
  status: 'reading',
  currentPage: 50,
  startDate: null,
  finishDate: null,
  rating: null,
  review: null,
  notes: [],
  tags: [],
  isFavorite: false,
  acquiredDate: null,
  location: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  book: {
    id: 'book-1',
    googleBooksId: 'google-1',
    title: 'JavaScript入門',
    authors: ['山田太郎'],
    publisher: 'Tech出版',
    publishedDate: '2024-01-01',
    isbn10: null,
    isbn13: null,
    pageCount: 200,
    language: 'ja',
    description: 'JavaScript の基礎を学ぶ',
    thumbnailUrl: '/images/thumb1.jpg',
    previewLink: null,
    infoLink: null,
    categories: ['技術書'],
    averageRating: null,
    ratingsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
};

describe('SearchResults', () => {
  test('検索結果の正常表示', () => {
    render(
      <SearchResults 
        books={[mockBook]}
        isLoading={false}
        query="JavaScript"
      />
    );

    expect(screen.getByTestId('search-results')).toBeInTheDocument();
    // TODO: 具体的な書籍表示のテスト（実装後に追加）
  });

  test('ローディング状態の表示', () => {
    render(<SearchResults books={[]} isLoading={true} />);
    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
    expect(screen.getByText('検索中...')).toBeInTheDocument();
  });

  test('検索結果0件の表示', () => {
    render(
      <SearchResults 
        books={[]} 
        isLoading={false} 
        query="存在しない書籍"
      />
    );
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
    expect(screen.getByText(/検索結果が見つかりませんでした/)).toBeInTheDocument();
  });

  test('クエリなしでの0件表示', () => {
    render(
      <SearchResults 
        books={[]} 
        isLoading={false} 
      />
    );
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
    expect(screen.queryByText(/検索結果が見つかりませんでした/)).not.toBeInTheDocument();
  });

  test('複数書籍の表示', () => {
    const books = [
      mockBook,
      {
        ...mockBook,
        id: '2',
        book: {
          ...mockBook.book,
          id: 'book-2',
          title: 'React 実践ガイド',
          authors: ['田中花子']
        }
      }
    ];

    render(
      <SearchResults 
        books={books}
        isLoading={false}
        total={2}
      />
    );

    expect(screen.getByTestId('search-results')).toBeInTheDocument();
    // TODO: 複数書籍表示のテスト（実装後に追加）
  });
});