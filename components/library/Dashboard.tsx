"use client";

import Image from "next/image";
import { StatsSummaryCard } from "@/components/dashboard/StatsSummaryCard";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { UserBookWithBook } from "@/lib/models/book";

interface DashboardProps {
	myBooks: UserBookWithBook[];
	stats: {
		totalBooks: number;
		booksRead: number;
		booksReading: number;
		booksWantToRead: number;
		averageRating: number;
		totalPages: number;
		wishlistCount: number;
	};
}

export function Dashboard({ myBooks, stats }: DashboardProps) {
	return (
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
							<span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
								{stats.booksRead}冊
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span>読んでいる本</span>
							<span className="px-2 py-1 text-sm bg-green-100 text-green-800 rounded-full">
								{stats.booksReading}冊
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span>読みたい本</span>
							<span className="px-2 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
								{stats.booksWantToRead}冊
							</span>
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
								<Image
									src={book.book.thumbnailUrl || "/images/book-placeholder.png"}
									alt={book.book.title}
									className="w-10 h-14 object-cover rounded"
								/>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">
										{book.book.title}
									</p>
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
	);
}
