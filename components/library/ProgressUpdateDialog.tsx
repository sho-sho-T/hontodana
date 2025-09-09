"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UserBookWithBook } from "@/lib/models/book";

interface ProgressUpdateDialogProps {
	isOpen: boolean;
	onClose: () => void;
	book: UserBookWithBook;
	onProgressUpdate: (
		userBookId: string,
		currentPage: number,
		sessionNotes?: string
	) => Promise<void>;
}

export function ProgressUpdateDialog({
	isOpen,
	onClose,
	book,
	onProgressUpdate,
}: ProgressUpdateDialogProps) {
	const [currentPage, setCurrentPage] = useState(book.currentPage);
	const [currentPageString, setCurrentPageString] = useState(
		String(book.currentPage)
	);
	const [sessionNotes, setSessionNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const maxPages = book.book.pageCount || 999;
	const currentProgress = book.currentPage;

	// ダイアログが開かれるたびに値をリセット
	useEffect(() => {
		if (isOpen) {
			setCurrentPage(book.currentPage);
			setCurrentPageString(String(book.currentPage));
			setSessionNotes("");
			setError(null);
		}
	}, [isOpen, book.currentPage]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// バリデーション
		if (currentPage < currentProgress) {
			setError("進捗を戻すことはできません");
			return;
		}

		if (currentPage > maxPages) {
			setError(`最大ページ数は ${maxPages} です`);
			return;
		}

		if (currentPage === currentProgress) {
			setError("現在と同じページ数です");
			return;
		}

		setIsSubmitting(true);
		try {
			await onProgressUpdate(
				book.id,
				currentPage,
				sessionNotes.trim() || undefined
			);
			onClose();
			// リセット
			setSessionNotes("");
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "更新に失敗しました");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setCurrentPage(book.currentPage);
		setCurrentPageString(String(book.currentPage));
		setSessionNotes("");
		setError(null);
		onClose();
	};

	const progressPercentage =
		maxPages > 0 ? Math.round((currentPage / maxPages) * 100) : 0;

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>読書進捗を更新</DialogTitle>
					<DialogDescription>{book.book.title}</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
					<div className="space-y-2">
						<Label htmlFor="currentPage">現在のページ</Label>
						<div className="flex items-center gap-2">
							<Input
								id="currentPage"
								type="number"
								min={currentProgress}
								max={maxPages}
								value={currentPageString}
								onChange={(e) => {
									setCurrentPageString(e.target.value);
								}}
								onBlur={(e) => {
									const value = e.target.value;
									if (value === "" || value === null || value === undefined) {
										setCurrentPage(currentProgress);
										setCurrentPageString(String(currentProgress));
									} else {
										const numValue = Number(value);
										if (!Number.isNaN(numValue)) {
											setCurrentPage(numValue);
										} else {
											setCurrentPage(currentProgress);
											setCurrentPageString(String(currentProgress));
										}
									}
								}}
								onClick={(e) => e.stopPropagation()}
								onKeyDown={(e) => e.stopPropagation()}
								className="flex-1"
								disabled={isSubmitting}
							/>
							<span className="text-sm text-gray-500">/ {maxPages}</span>
						</div>
						<div className="text-sm text-gray-600">
							現在: {currentProgress}ページ → {currentPage}ページ (
							{progressPercentage}%)
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="sessionNotes">読書メモ（任意）</Label>
						<Textarea
							id="sessionNotes"
							placeholder="今回読んだ内容についてのメモを記入..."
							value={sessionNotes}
							onChange={(e) => setSessionNotes(e.target.value)}
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => e.stopPropagation()}
							rows={3}
							disabled={isSubmitting}
						/>
					</div>

					{error && (
						<div className="text-sm text-red-600 bg-red-50 p-2 rounded">
							{error}
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={isSubmitting}
						>
							キャンセル
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || currentPage === currentProgress}
						>
							{isSubmitting ? "更新中..." : "進捗を更新"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
