/**
 * 書籍関連のServer Actions
 */

"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { ERROR_MESSAGES, PAGINATION } from "@/lib/config/book-constants";
import {
	AuthenticationError,
	ValidationError as BookValidationError,
	DuplicateError,
	errorToResponse,
} from "@/lib/errors/book-errors";
import type {
	GoogleBooksApiResponse,
	ServerActionResult,
	UserBookWithBook,
} from "@/lib/models/book";
import { BookStatus, BookType } from "@/lib/models/book";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { normalizeBookData } from "@/lib/utils/book-normalizer";
import {
	isValidBookStatus,
	isValidBookType,
	validateNormalizedBookData,
	validateUserId,
} from "@/lib/validation/book-validation";

/**
 * 認証されたユーザーIDを取得
 */
async function getAuthenticatedUserId(): Promise<string | null> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		return user?.id || null;
	} catch {
		return null;
	}
}

/**
 * 書籍をライブラリに追加
 */
export async function addBookToLibrary(
	googleBookData: GoogleBooksApiResponse,
	status: BookStatus = BookStatus.WANT_TO_READ,
	bookType: BookType = BookType.PHYSICAL
): Promise<ServerActionResult<UserBookWithBook>> {
	try {
		// 認証チェック
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			throw new AuthenticationError();
		}

		validateUserId(userId);

		if (!isValidBookStatus(status)) {
			throw new BookValidationError(ERROR_MESSAGES.INVALID_BOOK_STATUS);
		}

		if (!isValidBookType(bookType)) {
			throw new BookValidationError(ERROR_MESSAGES.INVALID_BOOK_TYPE);
		}

		// Google Books データの正規化
		const normalizedData = normalizeBookData(googleBookData);
		validateNormalizedBookData(normalizedData);

		// トランザクション内で書籍の作成/取得とユーザー書籍の作成を行う
		const result = await prisma.$transaction(async (tx) => {
			// 既存の書籍をチェック/作成
			let book = await tx.book.findUnique({
				where: { googleBooksId: normalizedData.googleBooksId },
			});

			if (!book) {
				book = await tx.book.create({
					data: {
						googleBooksId: normalizedData.googleBooksId,
						title: normalizedData.title,
						authors: normalizedData.authors,
						publisher: normalizedData.publisher,
						publishedDate: normalizedData.publishedDate,
						isbn10: normalizedData.isbn10,
						isbn13: normalizedData.isbn13,
						pageCount: normalizedData.pageCount,
						language: normalizedData.language,
						description: normalizedData.description,
						thumbnailUrl: normalizedData.thumbnailUrl,
						previewLink: normalizedData.previewLink,
						infoLink: normalizedData.infoLink,
						categories: normalizedData.categories,
						averageRating: normalizedData.averageRating,
						ratingsCount: normalizedData.ratingsCount,
					},
				});
			}

			// 重複チェック（同一ユーザー、同一書籍、同一タイプ）
			const existingUserBook = await tx.userBook.findUnique({
				where: {
					userId_bookId_bookType: {
						userId,
						bookId: book.id,
						bookType,
					},
				},
			});

			if (existingUserBook) {
				throw new DuplicateError(ERROR_MESSAGES.BOOK_ALREADY_EXISTS);
			}

			// UserBookの作成
			const userBook = await tx.userBook.create({
				data: {
					userId,
					bookId: book.id,
					bookType,
					status,
				},
				include: {
					book: true,
				},
			});

			return userBook;
		});

		revalidatePath("/protected");
		return result;
	} catch (error) {
		return errorToResponse(error);
	}
}

/**
 * 書籍のステータスを更新
 */
export async function updateBookStatus(
	userBookId: string,
	status: BookStatus
): Promise<ServerActionResult<UserBookWithBook>> {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			throw new AuthenticationError();
		}

		validateUserId(userId);

		if (!isValidBookStatus(status)) {
			throw new BookValidationError(ERROR_MESSAGES.INVALID_BOOK_STATUS);
		}

		const userBook = await prisma.userBook.update({
			where: {
				id: userBookId,
				userId, // ユーザー認可チェック
			},
			data: {
				status,
				// ステータスに応じて日付を自動設定
				startDate:
					status === BookStatus.READING &&
					!(await prisma.userBook
						.findUnique({
							where: { id: userBookId },
							select: { startDate: true },
						})
						.then((book) => book?.startDate))
						? new Date()
						: undefined,
				finishDate: status === BookStatus.READ ? new Date() : undefined,
			},
			include: {
				book: true,
			},
		});

		revalidatePath("/protected");
		return userBook;
	} catch (error) {
		return errorToResponse(error);
	}
}

/**
 * 書籍をライブラリから削除
 */
export async function removeBookFromLibrary(
	userBookId: string
): Promise<ServerActionResult<{ success: boolean }>> {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			throw new AuthenticationError();
		}

		validateUserId(userId);

		await prisma.userBook.delete({
			where: {
				id: userBookId,
				userId, // ユーザー認可チェック
			},
		});

		revalidatePath("/protected");
		return { success: true };
	} catch (error) {
		return errorToResponse(error);
	}
}

/**
 * ユーザーの書籍リストを取得（キャッシュなし版）
 */
async function getUserBooksUncached(
	userId: string,
	status?: BookStatus,
	limit: number = PAGINATION.DEFAULT_LIMIT,
	offset = 0
): Promise<UserBookWithBook[]> {
	validateUserId(userId);

	if (status && !isValidBookStatus(status)) {
		throw new BookValidationError(ERROR_MESSAGES.INVALID_BOOK_STATUS);
	}

	if (limit < PAGINATION.MIN_LIMIT || limit > PAGINATION.MAX_LIMIT) {
		throw new BookValidationError(ERROR_MESSAGES.INVALID_LIMIT);
	}

	if (offset < PAGINATION.MIN_OFFSET) {
		throw new BookValidationError(ERROR_MESSAGES.INVALID_OFFSET);
	}

	const userBooks = await prisma.userBook.findMany({
		where: {
			userId,
			...(status && { status }),
		},
		include: {
			book: true,
		},
		orderBy: {
			updatedAt: "desc",
		},
		take: limit,
		skip: offset,
	});

	return userBooks;
}

/**
 * ユーザーの書籍リストを取得（キャッシュ版）
 */
export async function getUserBooks(
	status?: BookStatus,
	limit: number = PAGINATION.DEFAULT_LIMIT,
	offset = 0
): Promise<ServerActionResult<UserBookWithBook[]>> {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			throw new AuthenticationError();
		}

		// キャッシュ関数を作成
		const getCachedUserBooks = unstable_cache(
			(userId: string, status?: BookStatus, limit?: number, offset?: number) =>
				getUserBooksUncached(userId, status, limit, offset),
			["user-books"],
			{
				revalidate: 60, // 1分間キャッシュ
				tags: [`user-books-${userId}`],
			}
		);

		const userBooks = await getCachedUserBooks(userId, status, limit, offset);
		return userBooks;
	} catch (error) {
		return errorToResponse(error);
	}
}
