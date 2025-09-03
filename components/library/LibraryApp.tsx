"use client";

import { useState, useEffect } from "react";
import { OfflineNotice } from "@/components/offline/OfflineNotice";
import { Dashboard } from "@/components/library/Dashboard";
import { Search } from "@/components/library/Search";
import { Library } from "@/components/library/Library";
import { Wishlist } from "@/components/library/Wishlist";
import { GoogleBooksClient } from "@/lib/google-books/client";
import {
	addBookToLibrary,
	getUserBooks,
	updateBookStatus,
	removeBookFromLibrary,
} from "@/lib/server-actions/books";
import {
	getUserWishlist,
	addToWishlist,
	updateWishlistPriority,
	removeFromWishlist,
	moveToLibrary,
} from "@/lib/server-actions/wishlist";
import type { User } from "@supabase/supabase-js";
import type {
	UserBookWithBook,
	BookStatus,
	GoogleBooksApiResponse,
} from "@/lib/models/book";
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
	const googleBooksClient = new GoogleBooksClient(
		process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
	);

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
		const booksRead = books.filter(
			(book) => book.status === ("completed" as BookStatus)
		).length;
		const booksReading = books.filter(
			(book) => book.status === ("reading" as BookStatus)
		).length;
		const booksWantToRead = books.filter(
			(book) => book.status === ("want_to_read" as BookStatus)
		).length;

		const ratingsSum = books
			.filter((book) => book.rating)
			.reduce((sum, book) => sum + (book.rating || 0), 0);
		const ratedBooksCount = books.filter((book) => book.rating).length;
		const averageRating =
			ratedBooksCount > 0 ? ratingsSum / ratedBooksCount : 0;

		const totalPages = books.reduce(
			(sum, book) => sum + (book.book.pageCount || 0),
			0
		);

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
				title: item.title || "No Title",
				authors: item.authors || [],
				publisher: item.publisher,
				description: item.description,
				thumbnail: item.imageLinks?.thumbnail,
				pageCount: item.pageCount,
				categories: item.categories,
			}));

			setSearchResults(searchResults);
		} catch (error) {
			console.error("Search failed:", error);
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	};

	const handleAddToLibrary = async (
		book: SearchResult,
		status: BookStatus = "want_to_read"
	) => {
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
					imageLinks: book.thumbnail
						? { thumbnail: book.thumbnail }
						: undefined,
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
			if (
				result &&
				typeof result === "object" &&
				"success" in result &&
				result.success
			) {
				await loadUserData(); // Refresh data
			}
		} catch (error) {
			console.error("Failed to remove book:", error);
			alert("書籍の削除に失敗しました。");
		}
	};

	const handleWishlistPriorityChange = async (
		id: string,
		newPriority: string
	) => {
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
							activeTab === "dashboard"
								? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
								: "hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
						}`}
					>
						📊 ダッシュボード
					</button>
					<button
						onClick={() => setActiveTab("search")}
						className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
							activeTab === "search"
								? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
								: "hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
						}`}
					>
						🔍 書籍検索
					</button>
					<button
						onClick={() => setActiveTab("library")}
						className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
							activeTab === "library"
								? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
								: "hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
						}`}
					>
						📚 マイライブラリ
					</button>
					<button
						onClick={() => setActiveTab("wishlist")}
						className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
							activeTab === "wishlist"
								? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
								: "hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
						}`}
					>
						💝 ウィッシュリスト
					</button>
				</div>

				{/* Dashboard Tab */}
				{activeTab === "dashboard" && (
					<Dashboard myBooks={myBooks} stats={stats} />
				)}

				{/* Search Tab */}
				{activeTab === "search" && (
					<Search
						searchResults={searchResults}
						isSearching={isSearching}
						onSearch={handleSearch}
						onAddToLibrary={handleAddToLibrary}
					/>
				)}

				{/* Library Tab */}
				{activeTab === "library" && (
					<Library
						myBooks={myBooks}
						onStatusChange={handleStatusChange}
						onRemove={handleRemoveBook}
						onSearchClick={() => setActiveTab("search")}
					/>
				)}

				{/* Wishlist Tab */}
				{activeTab === "wishlist" && (
					<Wishlist
						wishlist={wishlist}
						onPriorityChange={handleWishlistPriorityChange}
						onMoveToLibrary={handleMoveToLibrary}
						onRemove={handleRemoveFromWishlist}
						onSearchClick={() => setActiveTab("search")}
					/>
				)}
			</div>
		</div>
	);
}
