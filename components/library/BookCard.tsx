"use client";

/**
 * 書籍カードコンポーネント（グリッド表示用）
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import type React from "react";
import { StarRatingDisplay } from "@/components/rating/StarRating";
import type { BookCardProps } from "@/lib/models/book";
import { BookStatus } from "@/lib/models/book";
import { cn } from "@/lib/utils";
import { getStatusColor, getStatusLabel } from "@/lib/utils/book-ui-helpers";
import { ProgressBar } from "./ProgressBar";

// スタイリング定数
const CARD_STYLES = {
	container:
		"w-full sm:w-auto bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200",
	imageContainer: "relative h-48 bg-gray-100",
	content: "p-4 space-y-3",
	title: "font-semibold text-lg text-gray-900 line-clamp-2",
	author: "text-sm text-gray-600 line-clamp-1",
	publisher: "text-xs text-gray-500",
	statusRow: "flex items-center justify-between",
	buttonContainer: "flex gap-2 pt-2",
	button: "min-h-11 min-w-11 px-3 py-2 text-sm rounded-md transition-colors",
	primaryButton: "flex-1 bg-blue-500 text-white hover:bg-blue-600",
	dangerButton: "bg-red-500 text-white hover:bg-red-600",
} as const;

export function BookCard({ book, onStatusChange, onRemove }: BookCardProps) {
	const router = useRouter();

	const handleCardClick = () => {
		router.push(`/library/books/${book.id}`);
	};

	const handleStatusChange = (e: React.MouseEvent) => {
		e.stopPropagation();
		// 簡単なステータス切り替えロジック（読書中→読了）
		const nextStatus =
			book.status === BookStatus.READING ? BookStatus.READ : BookStatus.READ;
		onStatusChange(book.id, nextStatus);
	};

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation();
		onRemove(book.id);
	};

	const thumbnailSrc = book.book.thumbnailUrl || "/images/book-placeholder.png";
	const _progressPercentage = book.book.pageCount
		? (book.currentPage / book.book.pageCount) * 100
		: 0;

	return (
		// biome-ignore lint/a11y/useSemanticElements: Card contains nested interactive elements, so div with role="button" is appropriate
		<div
			className={CARD_STYLES.container}
			onClick={handleCardClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleCardClick();
				}
			}}
			tabIndex={0}
			role="button"
			aria-label={`${book.book.title} の詳細`}
		>
			{/* 書影 */}
			<div className={cn(CARD_STYLES.imageContainer, "mobile-image-size")}>
				<Image
					src={thumbnailSrc}
					alt={`${book.book.title} の書影`}
					fill
					className="object-cover"
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					priority={false}
				/>
			</div>

			{/* 書籍情報 */}
			<div className={CARD_STYLES.content}>
				{/* タイトル */}
				<h3 className={CARD_STYLES.title}>{book.book.title}</h3>

				{/* 著者 */}
				<p className={CARD_STYLES.author}>{book.book.authors.join(", ")}</p>

				{/* 出版社 */}
				{book.book.publisher && (
					<p className={CARD_STYLES.publisher}>{book.book.publisher}</p>
				)}

				{/* ステータスバッジと評価 */}
				<div className={CARD_STYLES.statusRow}>
					<span
						className={cn(
							"px-2 py-1 rounded-full text-xs font-medium",
							getStatusColor(book.status)
						)}
					>
						{getStatusLabel(book.status)}
					</span>
					{book.rating && (
						<StarRatingDisplay
							rating={book.rating as any}
							size="sm"
							className="ml-2"
						/>
					)}
				</div>

				{/* 進捗バー（読書中の場合のみ） */}
				{book.status === BookStatus.READING && book.book.pageCount && (
					<ProgressBar
						current={book.currentPage}
						total={book.book.pageCount}
						label="読書進捗"
					/>
				)}

				{/* 操作ボタン */}
				<div className={CARD_STYLES.buttonContainer}>
					<button
						type="button"
						onClick={handleStatusChange}
						className={cn(CARD_STYLES.button, CARD_STYLES.primaryButton)}
						aria-label="ステータス変更"
					>
						ステータス変更
					</button>
					<button
						type="button"
						onClick={handleRemove}
						className={cn(CARD_STYLES.button, CARD_STYLES.dangerButton)}
						aria-label="削除"
					>
						削除
					</button>
				</div>
			</div>
		</div>
	);
}
