import { ErrorType } from "@/lib/errors/app-error";

export interface BookData {
	title: string;
	authors: string[];
	isbn: string;
	publishedDate: string;
	description: string;
	thumbnail: string;
}

export interface AddBookResult {
	success: boolean;
	data?: any;
	error?: {
		type: ErrorType;
		code: string;
		message: string;
		context?: Record<string, unknown>;
	};
}

import { prisma } from "@/lib/prisma";

export async function addBookToLibrary(
	bookData: BookData
): Promise<AddBookResult> {
	const startTime = Date.now();
	const context = {
		operation: "addBookToLibrary",
		data: bookData,
		timestamp: startTime,
	};

	try {
		// Create new book (will handle uniqueness through database constraints)
		const newBook = await prisma.book.create({
			data: bookData,
		});

		return {
			success: true,
			data: newBook,
		};
	} catch (error: any) {
		return handleDatabaseError(error, context);
	}
}

function handleDatabaseError(
	error: any,
	context: Record<string, unknown>
): AddBookResult {
	// Handle Prisma-specific errors
	if (error.code) {
		switch (error.code) {
			case "P2002": // Unique constraint violation
				return {
					success: false,
					error: {
						type: ErrorType.CONFLICT,
						code: "BOOK_ALREADY_EXISTS",
						message: "この書籍は既に登録されています。",
						context,
					},
				};

			case "P2003": // Foreign key constraint violation
				return {
					success: false,
					error: {
						type: ErrorType.DATABASE,
						code: "FOREIGN_KEY_VIOLATION",
						message: "関連するデータが見つかりません。",
						context,
					},
				};

			case "P2000": // Database validation error
				return {
					success: false,
					error: {
						type: ErrorType.VALIDATION,
						code: "DATABASE_VALIDATION_ERROR",
						message: "データベースの検証エラーが発生しました。",
						context,
					},
				};

			case "P2034": // Concurrent modification
				return {
					success: false,
					error: {
						type: ErrorType.CONFLICT,
						code: "CONCURRENT_MODIFICATION",
						message:
							"他のユーザーが同時に変更を行いました。再度お試しください。",
						context,
					},
				};
		}
	}

	// Handle generic errors
	if (error.message) {
		if (error.message.includes("Connection failed")) {
			return {
				success: false,
				error: {
					type: ErrorType.DATABASE,
					code: "CONNECTION_FAILED",
					message: "データベースに接続できませんでした。",
					context,
				},
			};
		}

		if (error.message.includes("Query timeout")) {
			return {
				success: false,
				error: {
					type: ErrorType.DATABASE,
					code: "QUERY_TIMEOUT",
					message: "データベースの処理がタイムアウトしました。",
					context,
				},
			};
		}

		if (error.message.includes("Transaction rolled back")) {
			return {
				success: false,
				error: {
					type: ErrorType.DATABASE,
					code: "TRANSACTION_FAILED",
					message: "データの処理中にエラーが発生しました。",
					context,
				},
			};
		}
	}

	// Default error
	return {
		success: false,
		error: {
			type: ErrorType.DATABASE,
			code: "DATABASE_ERROR",
			message: "データベースエラーが発生しました。",
			context,
		},
	};
}
