"use client";

import {
	ArrowLeft,
	BookOpen,
	Calendar,
	ExternalLink,
	Tag,
	User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StarRatingDisplay } from "@/components/rating/StarRating";
import type { UserBookWithBook } from "@/lib/models/book";
import type { WishlistItemWithBook } from "@/lib/models/wishlist";
import { getBookDetails, updateBookStatus } from "@/lib/server-actions/books";
import { cn } from "@/lib/utils";
import { getStatusColor, getStatusLabel } from "@/lib/utils/book-ui-helpers";
import { getPriorityDisplay } from "@/lib/utils/wishlist-utils";

export default function BookDetailPage() {
	const router = useRouter();
	const params = useParams();
	const bookId = params.id as string;

	const [bookData, setBookData] = useState<{
		book: any;
		userBook?: UserBookWithBook;
		wishlistItem?: WishlistItemWithBook;
		type: "userBook" | "wishlistItem" | "book";
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchBook = async () => {
			if (!bookId) return;

			setLoading(true);
			try {
				const result = await getBookDetails(bookId);
				if (result && typeof result === "object" && "book" in result) {
					setBookData(result as any);
				} else {
					setError("書籍が見つかりません");
				}
			} catch (_err) {
				setError("書籍の取得に失敗しました");
			} finally {
				setLoading(false);
			}
		};

		fetchBook();
	}, [bookId]);

	const _handleStatusChange = async (newStatus: any) => {
		if (!bookData?.userBook) return;

		try {
			const result = await updateBookStatus(bookData.userBook.id, newStatus);
			if (result && typeof result === "object" && "id" in result) {
				setBookData({
					...bookData,
					userBook: result as UserBookWithBook,
				});
			}
		} catch (err) {
			console.error("ステータス更新失敗:", err);
		}
	};

	const handleBack = () => {
		router.back();
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 p-4">
				<div className="max-w-4xl mx-auto">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-300 rounded mb-6 w-32" />
						<div className="bg-white rounded-lg p-6 shadow-md">
							<div className="flex flex-col md:flex-row gap-6">
								<div className="h-64 w-48 bg-gray-300 rounded" />
								<div className="flex-1 space-y-4">
									<div className="h-8 bg-gray-300 rounded w-3/4" />
									<div className="h-6 bg-gray-300 rounded w-1/2" />
									<div className="h-20 bg-gray-300 rounded" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 p-4">
				<div className="max-w-4xl mx-auto">
					<button
						onClick={handleBack}
						className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
					>
						<ArrowLeft size={20} />
						戻る
					</button>
					<div className="bg-white rounded-lg p-8 shadow-md text-center">
						<p className="text-red-600 text-lg">{error}</p>
						<button
							onClick={() => router.push("/protected/library")}
							className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						>
							ライブラリに戻る
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (!bookData) {
		return null;
	}

	const { book, userBook, wishlistItem, type } = bookData;
	const thumbnailSrc = book.thumbnailUrl || "/images/book-placeholder.png";

	// UserBookの場合は進捗計算
	const progressPercentage =
		userBook && book.pageCount
			? (userBook.currentPage / book.pageCount) * 100
			: 0;

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			<div className="max-w-4xl mx-auto">
				{/* Back button */}
				<button
					onClick={handleBack}
					className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
				>
					<ArrowLeft size={20} />
					戻る
				</button>

				{/* Main content */}
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					<div className="p-6">
						<div className="flex flex-col md:flex-row gap-6">
							{/* Book cover */}
							<div className="flex-shrink-0">
								<img
									src={thumbnailSrc}
									alt={`${book.title}の書影`}
									className="w-48 h-64 object-cover rounded-lg shadow-md"
								/>
							</div>

							{/* Book info */}
							<div className="flex-1 space-y-4">
								{/* Title */}
								<h1 className="text-3xl font-bold text-gray-900">
									{book.title}
								</h1>

								{/* Authors */}
								<div className="flex items-center gap-2 text-lg text-gray-700">
									<User size={20} />
									<span>{book.authors.join(", ")}</span>
								</div>

								{/* Publisher */}
								{book.publisher && (
									<p className="text-gray-600">{book.publisher}</p>
								)}

								{/* Status and Priority */}
								<div className="flex items-center gap-4">
									{userBook && (
										<>
											<span
												className={cn(
													"px-3 py-1 rounded-full text-sm font-medium",
													getStatusColor(userBook.status)
												)}
											>
												{getStatusLabel(userBook.status)}
											</span>
											{userBook.rating && (
												<StarRatingDisplay
													rating={userBook.rating as 1 | 2 | 3 | 4 | 5}
													size="sm"
												/>
											)}
										</>
									)}

									{wishlistItem && (
										<>
											<span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
												ウィッシュリスト
											</span>
											<div className="flex items-center gap-2">
												<span className="text-lg">
													{getPriorityDisplay(wishlistItem.priority).icon}
												</span>
												<span className="text-sm font-medium">
													{getPriorityDisplay(wishlistItem.priority).label}
												</span>
											</div>
										</>
									)}

									{type === "book" && (
										<span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
											未登録
										</span>
									)}
								</div>

								{/* Progress */}
								{userBook && book.pageCount && (
									<div className="space-y-2">
										<div className="flex items-center gap-2 text-sm text-gray-600">
											<BookOpen size={16} />
											<span>
												{userBook.currentPage} / {book.pageCount} ページ (
												{progressPercentage.toFixed(0)}%)
											</span>
										</div>
										<div className="w-full bg-gray-200 rounded-full h-2">
											<div
												className="bg-blue-500 h-2 rounded-full"
												style={{ width: `${progressPercentage}%` }}
											/>
										</div>
									</div>
								)}

								{/* Dates */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
									{userBook?.startDate && (
										<div className="flex items-center gap-2">
											<Calendar size={16} />
											<span>
												開始日:{" "}
												{new Date(userBook.startDate).toLocaleDateString(
													"ja-JP"
												)}
											</span>
										</div>
									)}
									{userBook?.finishDate && (
										<div className="flex items-center gap-2">
											<Calendar size={16} />
											<span>
												完了日:{" "}
												{new Date(userBook.finishDate).toLocaleDateString(
													"ja-JP"
												)}
											</span>
										</div>
									)}
									{wishlistItem?.targetDate && (
										<div className="flex items-center gap-2">
											<Calendar size={16} />
											<span>
												目標日:{" "}
												{new Date(wishlistItem.targetDate).toLocaleDateString(
													"ja-JP"
												)}
											</span>
										</div>
									)}
								</div>

								{/* Categories */}
								{book.categories.length > 0 && (
									<div className="flex items-start gap-2">
										<Tag size={16} className="mt-1 text-gray-500" />
										<div className="flex flex-wrap gap-1">
											{book.categories.map(
												(category: string, index: number) => (
													<span
														key={index}
														className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
													>
														{category}
													</span>
												)
											)}
										</div>
									</div>
								)}

								{/* External links */}
								{(book.previewLink || book.infoLink) && (
									<div className="flex gap-4">
										{book.previewLink && (
											<a
												href={book.previewLink}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
											>
												<ExternalLink size={16} />
												プレビュー
											</a>
										)}
										{book.infoLink && (
											<a
												href={book.infoLink}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
											>
												<ExternalLink size={16} />
												詳細情報
											</a>
										)}
									</div>
								)}
							</div>
						</div>

						{/* Description */}
						{book.description && (
							<div className="mt-8 pt-6 border-t border-gray-200">
								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									あらすじ
								</h2>
								<p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
									{book.description}
								</p>
							</div>
						)}

						{/* Wishlist reason */}
						{wishlistItem?.reason && (
							<div className="mt-8 pt-6 border-t border-gray-200">
								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									追加理由
								</h2>
								<div className="bg-yellow-50 p-4 rounded-lg">
									<p className="text-gray-800 leading-relaxed">
										{wishlistItem.reason}
									</p>
								</div>
							</div>
						)}

						{/* Notes */}
						{userBook?.notes && userBook.notes.length > 0 && (
							<div className="mt-8 pt-6 border-t border-gray-200">
								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									メモ
								</h2>
								<div className="space-y-2">
									{userBook.notes.map((note: string, index: number) => (
										<div
											key={index}
											className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400"
										>
											<p className="text-gray-800">{note}</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Review */}
						{userBook?.review && (
							<div className="mt-8 pt-6 border-t border-gray-200">
								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									レビュー
								</h2>
								<div className="bg-blue-50 p-4 rounded-lg">
									<p className="text-gray-800 leading-relaxed">
										{userBook.review}
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
