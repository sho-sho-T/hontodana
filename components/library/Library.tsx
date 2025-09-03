"use client";

import { BookCardList } from "@/components/library/BookCardList";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { BookStatus, UserBookWithBook } from "@/lib/models/book";

interface LibraryProps {
	myBooks: UserBookWithBook[];
	onStatusChange: (bookId: string, newStatus: BookStatus) => Promise<void>;
	onRemove: (bookId: string) => Promise<void>;
	onSearchClick: () => void;
}

export function Library({
	myBooks,
	onStatusChange,
	onRemove,
	onSearchClick,
}: LibraryProps) {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>📚 マイライブラリ</CardTitle>
					<CardDescription>
						あなたの書籍コレクション ({myBooks.length}冊)
					</CardDescription>
				</CardHeader>
				<CardContent>
					{myBooks.length > 0 ? (
						<BookCardList
							books={myBooks}
							onStatusChange={onStatusChange}
							onRemove={onRemove}
						/>
					) : (
						<div className="text-center py-12">
							<p className="text-gray-500 mb-4">まだ書籍が登録されていません</p>
							<Button onClick={onSearchClick}>書籍を検索する</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
