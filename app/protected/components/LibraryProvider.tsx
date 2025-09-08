"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { GoogleBooksClient } from "@/lib/google-books/client";
import {
	addBookToLibrary,
	getUserBooks,
	updateBookStatus,
	removeBookFromLibrary,
} from "@/lib/server-actions/books";
import {
	getUserWishlist,
	updateWishlistPriority,
	removeFromWishlist,
	moveToLibrary,
} from "@/lib/server-actions/wishlist";
import type {
	UserBookWithBook,
	BookStatus,
	GoogleBooksApiResponse,
} from "@/lib/models/book";
import type { WishlistItemWithBook } from "@/lib/models/wishlist";

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

interface LibraryStats {
	totalBooks: number;
	booksRead: number;
	booksReading: number;
	booksWantToRead: number;
	averageRating: number;
	totalPages: number;
	wishlistCount: number;
}

interface LibraryContextType {
	// State
	myBooks: UserBookWithBook[];
	wishlist: WishlistItemWithBook[];
	searchResults: SearchResult[];
	isLoading: boolean;
	isSearching: boolean;
	stats: LibraryStats;

	// Actions
	handleSearch: (params: { query: string; filters: any }) => Promise<void>;
	handleAddToLibrary: (
		book: SearchResult,
		status?: BookStatus
	) => Promise<void>;
	handleStatusChange: (bookId: string, newStatus: BookStatus) => Promise<void>;
	handleRemoveBook: (bookId: string) => Promise<void>;
	handleWishlistPriorityChange: (
		id: string,
		newPriority: string
	) => Promise<void>;
	handleMoveToLibrary: (id: string) => Promise<void>;
	handleRemoveFromWishlist: (id: string) => Promise<void>;
	loadUserData: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function useLibrary() {
	const context = useContext(LibraryContext);
	if (context === undefined) {
		throw new Error("useLibrary must be used within a LibraryProvider");
	}
	return context;
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
	// State management
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
				calculateStats(booksResponse, wishlist);
			}

			// Load wishlist
			const wishlistResponse = await getUserWishlist();
			if (wishlistResponse.success && wishlistResponse.data) {
				setWishlist(wishlistResponse.data);
				calculateStats(myBooks, wishlistResponse.data);
			}
		} catch (error) {
			console.error("Failed to load user data:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const calculateStats = (
		books: UserBookWithBook[],
		wishlistItems?: WishlistItemWithBook[]
	) => {
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

		const wishlistCount = wishlistItems ? wishlistItems.length : wishlist.length;

		setStats({
			totalBooks,
			booksRead,
			booksReading,
			booksWantToRead,
			averageRating: Number(averageRating.toFixed(1)),
			totalPages,
			wishlistCount,
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

	const value: LibraryContextType = {
		// State
		myBooks,
		wishlist,
		searchResults,
		isLoading,
		isSearching,
		stats,

		// Actions
		handleSearch,
		handleAddToLibrary,
		handleStatusChange,
		handleRemoveBook,
		handleWishlistPriorityChange,
		handleMoveToLibrary,
		handleRemoveFromWishlist,
		loadUserData,
	};

	return (
		<LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
	);
}