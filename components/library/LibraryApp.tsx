"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchForm } from "@/components/search/SearchForm";
import { BookCardList } from "@/components/library/BookCardList";
import { WishlistCardList } from "@/components/wishlist/WishlistCardList";
import { StatsSummaryCard } from "@/components/dashboard/StatsSummaryCard";
import { StarRating } from "@/components/rating/StarRating";
import { OfflineNotice } from "@/components/offline/OfflineNotice";
import { GoogleBooksClient } from "@/lib/google-books/client";
import { addBookToLibrary, getUserBooks, updateBookStatus, removeBookFromLibrary } from "@/lib/server-actions/books";
import { getUserWishlist, addToWishlist, updateWishlistPriority, removeFromWishlist, moveToLibrary } from "@/lib/server-actions/wishlist";
import type { User } from "@supabase/supabase-js";
import type { UserBookWithBook, BookStatus, GoogleBooksApiResponse } from "@/lib/models/book";
import type { WishlistItemWithBook } from "@/lib/models/wishlist";

interface LibraryAppProps {
  user: User;
}

interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  publisher?: string;
  description?: string;
  thumbnail?: string;
  pageCount?: number;
  categories?: string[];
}

export function LibraryApp({ user }: LibraryAppProps) {
  // State management
  const [activeTab, setActiveTab] = useState("dashboard");
  const [myBooks, setMyBooks] = useState<UserBookWithBook[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItemWithBook[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalBooks: 0,
    booksRead: 0,
    booksReading: 0,
    booksWantToRead: 0,
    averageRating: 0,
    totalPages: 0,
    wishlistCount: 0,
  });

  // Google Books API client
  const googleBooksClient = new GoogleBooksClient(process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // Load user books
      const booksResponse = await getUserBooks();
      if (booksResponse && Array.isArray(booksResponse)) {
        setMyBooks(booksResponse);
        calculateStats(booksResponse);
      }

      // Load wishlist
      const wishlistResponse = await getUserWishlist();
      if (wishlistResponse.success && wishlistResponse.data) {
        setWishlist(wishlistResponse.data);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (books: UserBookWithBook[]) => {
    const totalBooks = books.length;
    const booksRead = books.filter((book) => book.status === ("completed" as BookStatus)).length;
    const booksReading = books.filter((book) => book.status === ("reading" as BookStatus)).length;
    const booksWantToRead = books.filter((book) => book.status === ("want_to_read" as BookStatus)).length;
    
    const ratingsSum = books
      .filter((book) => book.rating)
      .reduce((sum, book) => sum + (book.rating || 0), 0);
    const ratedBooksCount = books.filter((book) => book.rating).length;
    const averageRating = ratedBooksCount > 0 ? ratingsSum / ratedBooksCount : 0;

    const totalPages = books.reduce((sum, book) => sum + (book.book.pageCount || 0), 0);

    setStats({
      totalBooks,
      booksRead,
      booksReading,
      booksWantToRead,
      averageRating: Number(averageRating.toFixed(1)),
      totalPages,
      wishlistCount: wishlist.length,
    });
  };

  const handleSearch = async (params: { query: string; filters: any }) => {
    const { query } = params;
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await googleBooksClient.searchBooks({
        q: query,
        maxResults: 20,
        startIndex: 0,
      });

      const searchResults: SearchResult[] = response.items.map((item: any) => ({
        id: item.id,
        title: item.volumeInfo?.title || 'No Title',
        authors: item.volumeInfo?.authors || [],
        publisher: item.volumeInfo?.publisher,
        description: item.volumeInfo?.description,
        thumbnail: item.volumeInfo?.imageLinks?.thumbnail,
        pageCount: item.volumeInfo?.pageCount,
        categories: item.volumeInfo?.categories,
      }));

      setSearchResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToLibrary = async (book: SearchResult, status: BookStatus = "want_to_read") => {
    try {
      // Convert SearchResult to GoogleBooksApiResponse format
      const googleBookData: GoogleBooksApiResponse = {
        id: book.id,
        volumeInfo: {
          title: book.title,
          authors: book.authors,
          publisher: book.publisher,
          description: book.description,
          pageCount: book.pageCount,
          categories: book.categories,
          imageLinks: book.thumbnail ? { thumbnail: book.thumbnail } : undefined,
        },
      };

      const result = await addBookToLibrary(googleBookData, status, "physical");
      if (result && typeof result === "object" && "id" in result) {
        await loadUserData(); // Refresh data
        alert(`「${book.title}」をライブラリに追加しました！`);
      }
    } catch (error) {
      console.error("Failed to add book to library:", error);
      alert("書籍の追加に失敗しました。");
    }
  };

  const handleStatusChange = async (bookId: string, newStatus: BookStatus) => {
    try {
      const result = await updateBookStatus(bookId, newStatus);
      if (result && typeof result === "object" && "id" in result) {
        await loadUserData(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to update book status:", error);
      alert("ステータスの更新に失敗しました。");
    }
  };

  const handleRemoveBook = async (bookId: string) => {
    if (!confirm("この書籍をライブラリから削除しますか？")) return;

    try {
      const result = await removeBookFromLibrary(bookId);
      if (result && typeof result === 'object' && 'success' in result && result.success) {
        await loadUserData(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to remove book:", error);
      alert("書籍の削除に失敗しました。");
    }
  };

  const handleWishlistPriorityChange = async (id: string, newPriority: string) => {
    try {
      const result = await updateWishlistPriority({
        wishlistItemId: id,
        priority: newPriority as "low" | "medium" | "high",
      });
      if (result.success) {
        await loadUserData();
      }
    } catch (error) {
      console.error("Failed to update priority:", error);
    }
  };

  const handleMoveToLibrary = async (id: string) => {
    try {
      const result = await moveToLibrary({
        wishlistItemId: id,
        bookType: "physical",
        status: "want_to_read",
      });
      if (result.success) {
        await loadUserData();
      }
    } catch (error) {
      console.error("Failed to move to library:", error);
    }
  };

  const handleRemoveFromWishlist = async (id: string) => {
    if (!confirm("この書籍をウィッシュリストから削除しますか？")) return;

    try {
      const result = await removeFromWishlist({ wishlistItemId: id });
      if (result.success) {
        await loadUserData();
      }
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <OfflineNotice />

      <div className="space-y-6">
        {/* Simple Tab Navigation */}
        <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "dashboard" ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
            }`}
          >
            📊 ダッシュボード
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "search" ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
            }`}
          >
            🔍 書籍検索
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "library" ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
            }`}
          >
            📚 マイライブラリ
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "wishlist" ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
            }`}
          >
            💝 ウィッシュリスト
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsSummaryCard
                title="総書籍数"
                value={stats.totalBooks}
                unit="books"
                icon="📚"
              />
              <StatsSummaryCard
                title="読了書籍"
                value={stats.booksRead}
                unit="books"
                icon="✅"
              />
              <StatsSummaryCard
                title="平均評価"
                value={stats.averageRating}
                unit="speed"
                icon="⭐"
              />
              <StatsSummaryCard
                title="総ページ数"
                value={stats.totalPages}
                unit="pages"
                icon="📖"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>読書ステータス</CardTitle>
                  <CardDescription>現在の読書状況</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>読み終わった本</span>
                    <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">{stats.booksRead}冊</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>読んでいる本</span>
                    <span className="px-2 py-1 text-sm bg-green-100 text-green-800 rounded-full">{stats.booksReading}冊</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>読みたい本</span>
                    <span className="px-2 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">{stats.booksWantToRead}冊</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>最近追加した書籍</CardTitle>
                  <CardDescription>最新の3冊</CardDescription>
                </CardHeader>
                <CardContent>
                  {myBooks.slice(0, 3).map((book) => (
                    <div key={book.id} className="flex items-center space-x-3 py-2">
                      <img
                        src={book.book.thumbnailUrl || "/images/book-placeholder.png"}
                        alt={book.book.title}
                        className="w-10 h-14 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{book.book.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {book.book.authors.join(", ")}
                        </p>
                      </div>
                      <div className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                        {book.status === "completed" && "読了"}
                        {book.status === "reading" && "読書中"}
                        {book.status === "want_to_read" && "読みたい"}
                      </div>
                    </div>
                  ))}
                  {myBooks.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      まだ書籍が登録されていません
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === "search" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📖 書籍検索</CardTitle>
                <CardDescription>Google Books APIを使用して書籍を検索</CardDescription>
              </CardHeader>
              <CardContent>
                <SearchForm onSearch={handleSearch} />
              </CardContent>
            </Card>

            {isSearching && (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">検索中...</span>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">検索結果 ({searchResults.length}件)</h3>
                <div className="grid gap-4">
                  {searchResults.map((book) => (
                    <Card key={book.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <img
                            src={book.thumbnail || "/images/book-placeholder.png"}
                            alt={book.title}
                            className="w-16 h-24 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{book.title}</h4>
                            <p className="text-gray-600 mb-2">
                              {book.authors.join(", ")} | {book.publisher}
                            </p>
                            {book.description && (
                              <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                                {book.description}
                              </p>
                            )}
                            <div className="flex gap-2 flex-wrap">
                              {book.categories?.slice(0, 3).map((category) => (
                                <span key={category} className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAddToLibrary(book, "want_to_read" as BookStatus)}
                            >
                              読みたい
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAddToLibrary(book, "reading" as BookStatus)}
                              variant="secondary"
                            >
                              読書中
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAddToLibrary(book, "completed" as BookStatus)}
                              variant="outline"
                            >
                              読了
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Library Tab */}
        {activeTab === "library" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📚 マイライブラリ</CardTitle>
                <CardDescription>あなたの書籍コレクション ({myBooks.length}冊)</CardDescription>
              </CardHeader>
              <CardContent>
                {myBooks.length > 0 ? (
                  <BookCardList
                    books={myBooks}
                    onStatusChange={handleStatusChange}
                    onRemove={handleRemoveBook}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">まだ書籍が登録されていません</p>
                    <Button onClick={() => setActiveTab("search")}>
                      書籍を検索する
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === "wishlist" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>💝 ウィッシュリスト</CardTitle>
                <CardDescription>読みたい本のリスト ({wishlist.length}件)</CardDescription>
              </CardHeader>
              <CardContent>
                {wishlist.length > 0 ? (
                  <WishlistCardList
                    items={wishlist}
                    onPriorityChange={handleWishlistPriorityChange}
                    onMoveToLibrary={handleMoveToLibrary}
                    onRemove={handleRemoveFromWishlist}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">ウィッシュリストは空です</p>
                    <Button onClick={() => setActiveTab("search")}>
                      書籍を検索する
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}