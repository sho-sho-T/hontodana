/**
 * 検索サービス
 * キャッシュ機能付きの書籍検索サービス
 */

import { unstable_cache } from "next/cache";
import type { UserBookWithBook } from "@/lib/models/book";
import type { SearchFilters, SearchResult } from "@/lib/utils/search-utils";

export interface SearchBooksParams {
	query?: string;
	filters?: SearchFilters;
	userId: string;
	page?: number;
	limit?: number;
}

/**
 * 書籍を検索する（キャッシュなし版）
 */
async function searchBooksUncached(
	params: SearchBooksParams
): Promise<SearchResult<UserBookWithBook>> {
	const { query = "", filters = {}, userId, page = 1, limit = 20 } = params;

	const { prisma } = await import("@/lib/prisma");

	try {
		// WHERE条件を構築
		const whereCondition: any = {
			userId: userId,
		};

		// 読書状態フィルタ
		if (filters.status) {
			whereCondition.status = filters.status;
		}

		// 評価フィルタ
		if (filters.rating && filters.rating.length > 0) {
			whereCondition.rating = {
				in: filters.rating,
			};
		}

		// 登録日フィルタ
		if (filters.registeredAfter || filters.registeredBefore) {
			whereCondition.createdAt = {};
			if (filters.registeredAfter) {
				whereCondition.createdAt.gte = new Date(filters.registeredAfter);
			}
			if (filters.registeredBefore) {
				whereCondition.createdAt.lte = new Date(filters.registeredBefore);
			}
		}

		// 書籍関連の検索・フィルタ条件
		const bookWhere: any = {};

		// カテゴリフィルタ
		if (filters.categories && filters.categories.length > 0) {
			bookWhere.categories = {
				hasSome: filters.categories,
			};
		}

		// 進捗率フィルタ（複雑な条件のため、後でフィルタリング）
		let hasProgressFilter = false;
		if (
			filters.progressMin !== undefined ||
			filters.progressMax !== undefined
		) {
			hasProgressFilter = true;
		}

		// テキスト検索（PostgreSQLの全文検索またはLIKE検索）
		if (query.trim()) {
			const searchKeywords = query.trim().split(/\s+/);

			bookWhere.OR = [
				// タイトル検索
				{
					title: {
						contains: query.trim(),
						mode: "insensitive",
					},
				},
				// 著者検索（配列の要素との部分マッチ）
				...searchKeywords.map((keyword) => ({
					authors: {
						hasSome: [keyword],
					},
				})),
				// 説明文検索
				{
					description: {
						contains: query.trim(),
						mode: "insensitive",
					},
				},
			];
		}

		if (Object.keys(bookWhere).length > 0) {
			whereCondition.book = bookWhere;
		}

		// カウント取得
		const total = await prisma.userBook.count({
			where: whereCondition,
		});

		// データ取得
		let books = await prisma.userBook.findMany({
			where: whereCondition,
			include: {
				book: true,
			},
			orderBy: {
				updatedAt: "desc",
			},
			skip: (page - 1) * limit,
			take: limit,
		});

		// 進捗率フィルタを適用（メモリ上でフィルタリング）
		if (hasProgressFilter) {
			books = books.filter((userBook) => {
				if (!userBook.book.pageCount) return false;

				const progressPercentage =
					(userBook.currentPage / userBook.book.pageCount) * 100;

				if (
					filters.progressMin !== undefined &&
					progressPercentage < filters.progressMin
				) {
					return false;
				}

				if (
					filters.progressMax !== undefined &&
					progressPercentage > filters.progressMax
				) {
					return false;
				}

				return true;
			});
		}

		const hasNext = page * limit < total;

		// データを正規化（UserBookWithBook形式に変換）
		const normalizedBooks: UserBookWithBook[] = books.map((userBook) => ({
			id: userBook.id,
			userId: userBook.userId,
			bookId: userBook.bookId,
			bookType: userBook.bookType,
			status: userBook.status,
			currentPage: userBook.currentPage,
			startDate: userBook.startDate,
			finishDate: userBook.finishDate,
			rating: userBook.rating,
			review: userBook.review,
			notes: userBook.notes,
			tags: userBook.tags,
			isFavorite: userBook.isFavorite,
			acquiredDate: userBook.acquiredDate,
			location: userBook.location,
			createdAt: userBook.createdAt,
			updatedAt: userBook.updatedAt,
			book: {
				id: userBook.book.id,
				googleBooksId: userBook.book.googleBooksId,
				title: userBook.book.title,
				authors: userBook.book.authors,
				publisher: userBook.book.publisher,
				publishedDate: userBook.book.publishedDate,
				isbn10: userBook.book.isbn10,
				isbn13: userBook.book.isbn13,
				pageCount: userBook.book.pageCount,
				language: userBook.book.language,
				description: userBook.book.description,
				thumbnailUrl: userBook.book.thumbnailUrl,
				previewLink: userBook.book.previewLink,
				infoLink: userBook.book.infoLink,
				categories: userBook.book.categories,
				averageRating: userBook.book.averageRating,
				ratingsCount: userBook.book.ratingsCount,
				createdAt: userBook.book.createdAt,
				updatedAt: userBook.book.updatedAt,
			},
		}));

		return {
			data: normalizedBooks,
			total,
			page,
			limit,
			hasNext,
		};
	} catch (error) {
		console.error("Search error:", error);
		throw new Error(`検索エラーが発生しました: ${error}`);
	}
}

/**
 * PostgreSQL全文検索を使った高度な検索（オプション）
 * より高いパフォーマンスが必要な場合に使用
 */
export async function searchBooksAdvanced(
	params: SearchBooksParams
): Promise<SearchResult<UserBookWithBook>> {
	const { query = "", filters = {}, userId, page = 1, limit = 20 } = params;

	const { prisma } = await import("@/lib/prisma");

	try {
		// 全文検索クエリを構築
		let searchConditions = "";
		const queryParams: any[] = [userId];

		if (query.trim()) {
			const searchTerms = query
				.trim()
				.split(/\s+/)
				.map((term) => `${term}:*`)
				.join(" & ");
			searchConditions = `AND (
        to_tsvector('japanese', b.title || ' ' || array_to_string(b.authors, ' ') || ' ' || COALESCE(b.description, ''))
        @@ to_tsquery('japanese', $${queryParams.length + 1})
      )`;
			queryParams.push(searchTerms);
		}

		// フィルタ条件を追加
		if (filters.status) {
			searchConditions += ` AND ub.status = $${queryParams.length + 1}`;
			queryParams.push(filters.status);
		}

		if (filters.categories && filters.categories.length > 0) {
			searchConditions += ` AND b.categories && $${queryParams.length + 1}`;
			queryParams.push(filters.categories);
		}

		// カウント取得
		const countQuery = `
      SELECT COUNT(*)::integer as total
      FROM user_books ub
      JOIN books b ON ub.book_id = b.id
      WHERE ub.user_id = $1 ${searchConditions}
    `;

		// データ取得
		const offset = (page - 1) * limit;
		const dataQuery = `
      SELECT 
        ub.*, b.*,
        b.id as book_id, b.created_at as book_created_at, b.updated_at as book_updated_at
      FROM user_books ub
      JOIN books b ON ub.book_id = b.id
      WHERE ub.user_id = $1 ${searchConditions}
      ORDER BY ub.updated_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

		queryParams.push(limit, offset);

		const [countResult, dataResult] = await Promise.all([
			prisma.$queryRawUnsafe(countQuery, ...queryParams.slice(0, -2)),
			prisma.$queryRawUnsafe(dataQuery, ...queryParams),
		]);

		const total = (countResult as any[])[0]?.total || 0;
		const hasNext = page * limit < total;

		// データを正規化
		const books: UserBookWithBook[] = (dataResult as any[]).map((row) => ({
			id: row.id,
			userId: row.user_id,
			bookId: row.book_id,
			bookType: row.book_type,
			status: row.status,
			currentPage: row.current_page,
			startDate: row.start_date,
			finishDate: row.finish_date,
			rating: row.rating,
			review: row.review,
			notes: row.notes,
			tags: row.tags,
			isFavorite: row.is_favorite,
			acquiredDate: row.acquired_date,
			location: row.location,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
			book: {
				id: row.book_id,
				googleBooksId: row.google_books_id,
				title: row.title,
				authors: row.authors,
				publisher: row.publisher,
				publishedDate: row.published_date,
				isbn10: row.isbn_10,
				isbn13: row.isbn_13,
				pageCount: row.page_count,
				language: row.language,
				description: row.description,
				thumbnailUrl: row.thumbnail_url,
				previewLink: row.preview_link,
				infoLink: row.info_link,
				categories: row.categories,
				averageRating: row.average_rating,
				ratingsCount: row.ratings_count,
				createdAt: row.book_created_at,
				updatedAt: row.book_updated_at,
			},
		}));

		return {
			data: books,
			total,
			page,
			limit,
			hasNext,
		};
	} catch (error) {
		console.error("Advanced search error:", error);
		throw new Error(`検索エラーが発生しました: ${error}`);
	}
}

/**
 * キャッシュ機能付きの書籍検索
 */
export const searchBooks = unstable_cache(
	searchBooksUncached,
	["search-books"],
	{
		revalidate: 300, // 5分間キャッシュ
		tags: ["user-books"],
	}
);

/**
 * 検索キーワードの候補を取得
 */
export async function getSearchSuggestions(
	query: string,
	userId: string
): Promise<string[]> {
	if (!query.trim()) return [];

	const { prisma } = await import("@/lib/prisma");

	try {
		// ユーザーの書籍から検索候補を取得
		const userBooks = await prisma.userBook.findMany({
			where: {
				userId: userId,
				book: {
					OR: [
						{
							title: {
								contains: query,
								mode: "insensitive",
							},
						},
						{
							authors: {
								hasSome: [query],
							},
						},
					],
				},
			},
			include: {
				book: {
					select: {
						title: true,
						authors: true,
					},
				},
			},
			take: 10,
		});

		const suggestions = new Set<string>();

		// タイトルから候補を抽出
		userBooks.forEach((userBook) => {
			const title = userBook.book.title;
			if (title.toLowerCase().includes(query.toLowerCase())) {
				suggestions.add(title);
			}

			// 著者名から候補を抽出
			userBook.book.authors.forEach((author) => {
				if (author.toLowerCase().includes(query.toLowerCase())) {
					suggestions.add(author);
				}
			});
		});

		return Array.from(suggestions).sort().slice(0, 10);
	} catch (error) {
		console.error("Search suggestions error:", error);
		return [];
	}
}
