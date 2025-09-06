/**
 * 検索結果表示コンポーネント
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import type React from "react";
import type { UserBookWithBook } from "@/lib/models/book";
import { Button } from "../ui/button";
import { HighlightedText } from "./HighlightedText";

interface SearchResultsProps {
	books: UserBookWithBook[];
	isLoading: boolean;
	query?: string;
	total?: number;
	page?: number;
	hasNext?: boolean;
	onLoadMore?: () => void;
}

export function SearchResults({
	books,
	isLoading,
	query = "",
	total = 0,
	page = 1,
	hasNext = false,
	onLoadMore,
}: SearchResultsProps) {
	if (isLoading) {
		return (
			<div
				data-testid="search-loading"
				className="flex justify-center items-center py-8"
			>
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
				<span className="ml-2 text-gray-600">検索中...</span>
			</div>
		);
	}

	if (books.length === 0) {
		return (
			<div data-testid="no-results" className="text-center py-12">
				<div className="text-gray-500 text-lg">
					{query.trim() ? (
						<>
							「<span className="font-medium">{query}</span>
							」の検索結果が見つかりませんでした。
							<div className="mt-2 text-sm">
								別のキーワードで検索してみてください。
							</div>
						</>
					) : (
						"検索条件に一致する書籍がありません。"
					)}
				</div>
			</div>
		);
	}

	// ダミーのハンドラー（実際の実装では親コンポーネントから受け取る）
	const handleStatusChange = (bookId: string, status: any) => {
		console.log("Status change:", bookId, status);
	};

	const handleRemove = (bookId: string) => {
		console.log("Remove book:", bookId);
	};

	return (
		<div data-testid="search-results" className="space-y-6">
			{/* 検索結果サマリー */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-center justify-between text-sm text-blue-800">
					<div>
						{total}件中 {(page - 1) * Math.max(1, books.length)} -{" "}
						{Math.min(page * books.length, total)}件を表示
					</div>
					{query.trim() && (
						<div>
							検索キーワード: 「<span className="font-medium">{query}</span>」
						</div>
					)}
				</div>
			</div>

			{/* 書籍グリッド */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
				{books.map((book) => (
					<SearchBookCard
						key={book.id}
						book={book}
						query={query}
						onStatusChange={handleStatusChange}
						onRemove={handleRemove}
					/>
				))}
			</div>

			{/* もっと読み込むボタン */}
			{hasNext && onLoadMore && (
				<div className="flex justify-center pt-6">
					<button
						type="button"
						onClick={onLoadMore}
						className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
					>
						さらに読み込む
					</button>
				</div>
			)}
		</div>
	);
}

/**
 * 検索結果用の書籍カード（ハイライト機能付き）
 */
interface SearchBookCardProps {
	book: UserBookWithBook;
	query: string;
	onStatusChange: (bookId: string, status: any) => void;
	onRemove: (bookId: string) => void;
}

function SearchBookCard({
	book,
	query,
	onStatusChange,
	onRemove,
}: SearchBookCardProps) {
	const router = useRouter();

	const handleCardClick = () => {
		router.push(`/library/books/${book.id}`);
	};

	const handleStatusChange = (e: React.MouseEvent) => {
		e.stopPropagation();
		onStatusChange(book.id, "completed"); // ダミー実装
	};

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation();
		onRemove(book.id);
	};

	const thumbnailSrc = book.book.thumbnailUrl || "/images/book-placeholder.png";
	const progressPercentage = book.book.pageCount
		? (book.currentPage / book.book.pageCount) * 100
		: 0;

	return (
		<Button
			type="button"
			variant="outline"
			className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200"
			onClick={handleCardClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleCardClick();
				}
			}}
			tabIndex={0}
			aria-label={`${book.book.title} の詳細`}
		>
			{/* 書影 */}
			<div className="relative h-48 bg-gray-100">
				<Image
					src={thumbnailSrc}
					alt={`${book.book.title} の書影`}
					width={100}
					height={100}
					className="object-cover"
					priority={false}
				/>
			</div>

			{/* 書籍情報 */}
			<div className="p-4 space-y-3">
				{/* タイトル（ハイライト付き） */}
				<h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
					<HighlightedText text={book.book.title} highlight={query} />
				</h3>

				{/* 著者（ハイライト付き） */}
				<p className="text-sm text-gray-600 line-clamp-1">
					<HighlightedText
						text={book.book.authors.join(", ")}
						highlight={query}
					/>
				</p>

				{/* 出版社 */}
				{book.book.publisher && (
					<p className="text-xs text-gray-500">{book.book.publisher}</p>
				)}

				{/* ステータスバッジ */}
				<div className="flex items-center justify-between">
					<span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
						{book.status === "reading"
							? "読書中"
							: book.status === "completed"
								? "読了"
								: book.status === "want_to_read"
									? "読みたい"
									: book.status}
					</span>
				</div>

				{/* 進捗バー（読書中の場合のみ） */}
				{book.status === "reading" && book.book.pageCount && (
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-500 h-2 rounded-full transition-all"
							style={{ width: `${Math.min(100, progressPercentage)}%` }}
						/>
						<div className="text-xs text-gray-500 mt-1">
							{book.currentPage}/{book.book.pageCount} ページ (
							{Math.round(progressPercentage)}%)
						</div>
					</div>
				)}

				{/* 操作ボタン */}
				<div className="flex gap-2 pt-2">
					<button
						type="button"
						onClick={handleStatusChange}
						className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
						aria-label="ステータス変更"
					>
						ステータス変更
					</button>
					<button
						type="button"
						onClick={handleRemove}
						className="px-3 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
						aria-label="削除"
					>
						削除
					</button>
				</div>
			</div>
		</Button>
	);
}
