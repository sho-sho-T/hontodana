"use client";

import type { BookStatus, UserBookWithBook } from "@/lib/models/book";
import { BookCard } from "./BookCard";

interface BookCardListProps {
	books: UserBookWithBook[];
	viewMode?: "grid" | "list";
	onStatusChange?: (bookId: string, status: BookStatus) => Promise<void> | void;
	onRemove?: (bookId: string) => Promise<void> | void;
	onProgressUpdate?: (
		userBookId: string,
		currentPage: number,
		sessionNotes?: string
	) => Promise<void>;
}

export function BookCardList({
	books,
	viewMode = "grid",
	onStatusChange,
	onRemove,
	onProgressUpdate,
}: BookCardListProps) {
	const handleStatusChange = async (bookId: string, status: BookStatus) => {
		if (onStatusChange) {
			await onStatusChange(bookId, status);
		} else {
			console.log("Status changed:", bookId, status);
		}
	};

	const handleRemove = async (bookId: string) => {
		if (onRemove) {
			await onRemove(bookId);
		} else {
			console.log("Book removed:", bookId);
		}
	};

	const handleProgressUpdate = async (
		userBookId: string,
		currentPage: number,
		sessionNotes?: string
	) => {
		if (onProgressUpdate) {
			await onProgressUpdate(userBookId, currentPage, sessionNotes);
		}
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{books.map((book) => (
				<BookCard
					key={book.id}
					book={book}
					viewMode={viewMode}
					onStatusChange={handleStatusChange}
					onRemove={handleRemove}
					onProgressUpdate={handleProgressUpdate}
				/>
			))}
		</div>
	);
}
