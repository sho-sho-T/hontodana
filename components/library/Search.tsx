"use client";

import { SearchForm } from "@/components/search/SearchForm";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { BookStatus } from "@/lib/models/book";
import type { WishlistPriority } from "@/lib/models/wishlist";

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

interface SearchProps {
	searchResults: SearchResult[];
	isSearching: boolean;
	onSearch: (params: { query: string; filters: any }) => Promise<void>;
	onAddToLibrary: (book: SearchResult, status?: BookStatus) => Promise<void>;
	onAddToWishlist?: (book: SearchResult, priority?: WishlistPriority) => Promise<void>;
}

export function Search({
	searchResults,
	isSearching,
	onSearch,
	onAddToLibrary,
	onAddToWishlist,
}: SearchProps) {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>📖 書籍検索</CardTitle>
					<CardDescription>
						Google Books APIを使用して書籍を検索
					</CardDescription>
				</CardHeader>
				<CardContent>
					<SearchForm onSearch={onSearch} />
				</CardContent>
			</Card>

			{isSearching && (
				<div className="flex items-center justify-center h-32">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
					<span className="ml-2">検索中...</span>
				</div>
			)}

			{searchResults.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">
						検索結果 ({searchResults.length}件)
					</h3>
					<div className="grid gap-4">
						{searchResults.map((book) => (
							<Card key={book.id}>
								<CardContent className="p-4">
									<div className="flex gap-4">
										<img
											src={book.thumbnail || "/images/book-placeholder.png"}
											alt={book.title}
											className="w-24 h-36 object-cover rounded"
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
													<span
														key={category}
														className="px-2 py-1 text-xs bg-gray-100 rounded-full"
													>
														{category}
													</span>
												))}
											</div>
										</div>
										<div className="flex flex-col gap-2">
											{/* ウィッシュリストに追加 */}
											{onAddToWishlist && (
												<Button
													size="sm"
													onClick={() => onAddToWishlist(book, "medium")}
													variant="outline"
													className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
												>
													💝 ウィッシュリスト
												</Button>
											)}
											
											{/* ライブラリに追加 */}
											<Button
												size="sm"
												onClick={() =>
													onAddToLibrary(book, "want_to_read" as BookStatus)
												}
											>
												読みたい
											</Button>
											<Button
												size="sm"
												onClick={() =>
													onAddToLibrary(book, "reading" as BookStatus)
												}
												variant="secondary"
											>
												読書中
											</Button>
											<Button
												size="sm"
												onClick={() => onAddToLibrary(book, "completed" as BookStatus)}
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
	);
}
