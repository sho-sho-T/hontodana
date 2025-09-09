"use client";

/**
 * ウィッシュリストカードコンポーネント
 */

import { useRouter } from "next/navigation";
import type React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WishlistItemWithBook } from "@/lib/models/wishlist";
import { getPriorityDisplay } from "@/lib/utils/wishlist-utils";

export interface WishlistCardProps {
	item: WishlistItemWithBook;
	onPriorityChange?: (id: string, newPriority: string) => void;
	onRemove?: (id: string) => void;
	onMoveToLibrary?: (id: string) => void;
}

export function WishlistCard({
	item,
	onPriorityChange,
	onRemove,
	onMoveToLibrary,
}: WishlistCardProps) {
	const router = useRouter();

	if (!item || !item.book) {
		return null;
	}

	const handleCardClick = () => {
		router.push(`/protected/books/${item.bookId}`);
	};

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onRemove) {
			onRemove(item.id);
		}
	};

	const handleMoveToLibrary = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onMoveToLibrary) {
			onMoveToLibrary(item.id);
		}
	};

	const priorityDisplay = getPriorityDisplay(item.priority);
	const thumbnailSrc = item.book.thumbnailUrl || "/images/book-placeholder.png";

	return (
		<article
			className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border border-gray-200 flex flex-col md:flex-row"
			onClick={handleCardClick}
			aria-label={`${item.book.title} のウィッシュリストアイテム`}
		>
			{/* 書影 */}
			<div className="relative h-48 md:h-32 md:w-24 bg-gray-100 flex-shrink-0">
				<img
					src={thumbnailSrc}
					alt={`${item.book.title} の書影`}
					sizes="(max-width: 768px) 100vw, 96px"
					className="object-cover"
				/>
			</div>

			{/* 書籍情報 */}
			<div className="p-4 flex-1 space-y-3">
				{/* タイトル */}
				<h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
					{item.book.title}
				</h3>

				{/* 著者 */}
				<p className="text-sm text-gray-600 line-clamp-1">
					{item.book.authors.join(", ")}
				</p>

				{/* 出版社 */}
				{item.book.publisher && (
					<p className="text-xs text-gray-500">{item.book.publisher}</p>
				)}

				{/* 優先度 */}
				<div className="flex items-center gap-2">
					<span className="text-lg">{priorityDisplay.icon}</span>
					<span className="text-sm font-medium">{priorityDisplay.label}</span>
				</div>

				{/* 追加理由 */}
				{item.reason && (
					<p className="text-sm text-gray-700 line-clamp-2">{item.reason}</p>
				)}

				{/* 目標日 */}
				{item.targetDate && (
					<p className="text-sm text-blue-600">
						目標: {item.targetDate.toISOString().split("T")[0]}
					</p>
				)}

				{/* 操作ボタン */}
				<div className="flex gap-2 pt-2 flex-wrap">
					<div className="flex-1 min-w-0">
						<Select
							value={item.priority}
							onValueChange={(value) => {
								if (onPriorityChange) {
									onPriorityChange(item.id, value);
								}
							}}
						>
							<SelectTrigger 
								className="flex-1 min-w-0 px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
								onClick={(e) => e.stopPropagation()}
							>
								<SelectValue placeholder="優先度変更" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="low">🔵 低</SelectItem>
								<SelectItem value="medium">🟡 中</SelectItem>
								<SelectItem value="high">🟠 高</SelectItem>
								<SelectItem value="urgent">🔴 緊急</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<button
						onClick={handleMoveToLibrary}
						className="flex-1 min-w-0 px-3 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
						aria-label="本棚に移動"
					>
						本棚に移動
					</button>
					<button
						onClick={handleRemove}
						className="px-3 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
						aria-label="削除"
					>
						削除
					</button>
				</div>
			</div>
		</article>
	);
}

/**
 * 次の優先度を取得する簡易関数
 */
function getNextPriority(currentPriority: string): string {
	switch (currentPriority) {
		case "low":
			return "medium";
		case "medium":
			return "high";
		case "high":
			return "urgent";
		case "urgent":
			return "low";
		default:
			return "medium";
	}
}