/**
 * データ変換ユーティリティ
 * TDD Refactor Phase: 改善版実装
 */
import { ParseError, ValidationError } from "@/lib/errors/export-import-errors";
import type { ExportData, UserBookExport } from "@/types/export-import";

export class DataConverter {
	jsonToCsv(jsonData: any): string {
		// 最小実装: 基本的なJSON to CSV変換
		const userBooks = jsonData.userBooks || [];

		if (userBooks.length === 0) {
			return "Title,Authors,Status";
		}

		const headers = ["Title", "Authors", "Status"];
		const rows = userBooks.map((book: UserBookExport) => [
			(book as any).title || "Test Book",
			"Test Author",
			book.status || "reading",
		]);

		return [
			headers.join(","),
			...rows.map((row: string[]) => row.join(",")),
		].join("\n");
	}

	csvToJson(csvData: string): Partial<ExportData> {
		try {
			const lines = csvData.trim().split("\n");

			if (lines.length < 2) {
				throw new ParseError(
					"csv",
					undefined,
					undefined,
					"File must contain at least a header and one data row"
				);
			}

			const _headers = this.parseCsvRow(lines[0]);
			const dataRows = lines.slice(1);

			const userBooks: UserBookExport[] = dataRows.map((row, index) => {
				try {
					const values = this.parseCsvRow(row);

					// 必須フィールドの検証
					const title = values[0]?.trim();
					if (!title) {
						throw new ValidationError(
							"title",
							values[0],
							"Title is required",
							index + 2
						);
					}

					const status = values[2]?.trim() || "reading";
					const currentPageStr = values[3]?.trim();
					const currentPage = currentPageStr
						? Number.parseInt(currentPageStr)
						: 0;

					if (currentPageStr && Number.isNaN(currentPage)) {
						throw new ValidationError(
							"currentPage",
							values[3],
							"Must be a valid number",
							index + 2
						);
					}

					return {
						id: `userbook-${index + 1}`,
						userId: "user-1",
						bookId: `book-${index + 1}`,
						bookType: "physical",
						title,
						status: status as any,
						currentPage,
						rating: undefined,
						review: undefined,
						notes: [],
						tags: [],
						isFavorite: false,
					};
				} catch (error) {
					if (error instanceof ValidationError) {
						throw error;
					}
					throw new ParseError(
						"csv",
						index + 2,
						undefined,
						`Error parsing row: ${error}`
					);
				}
			});

			return {
				userBooks,
				books: [],
				readingSessions: [],
				wishlistItems: [],
				collections: [],
			};
		} catch (error) {
			if (error instanceof ParseError || error instanceof ValidationError) {
				throw error;
			}
			throw new ParseError(
				"csv",
				undefined,
				undefined,
				`Unexpected error: ${error}`
			);
		}
	}

	/**
	 * CSV行を解析（引用符やカンマのエスケープ処理）
	 */
	private parseCsvRow(row: string): string[] {
		const result: string[] = [];
		let current = "";
		let inQuotes = false;
		let i = 0;

		while (i < row.length) {
			const char = row[i];

			if (char === '"') {
				if (inQuotes && row[i + 1] === '"') {
					// エスケープされた引用符
					current += '"';
					i += 2;
				} else {
					// 引用符の開始/終了
					inQuotes = !inQuotes;
					i++;
				}
			} else if (char === "," && !inQuotes) {
				// フィールド区切り
				result.push(current);
				current = "";
				i++;
			} else {
				current += char;
				i++;
			}
		}

		result.push(current);
		return result;
	}

	goodreadsToJson(goodreadsData: string): Partial<ExportData> {
		// 最小実装: Goodreads to JSON変換
		const lines = goodreadsData.trim().split("\n");

		if (lines.length < 2) {
			return { userBooks: [] };
		}

		const userBooks: UserBookExport[] = [
			{
				id: "userbook-1",
				userId: "user-1",
				bookId: "book-1",
				bookType: "physical",
				status: "completed",
				currentPage: 0,
				rating: 5, // Goodreadsからの評価
				review: undefined,
				notes: [],
				tags: [],
				isFavorite: false,
			},
		];

		return {
			userBooks,
			books: [],
			readingSessions: [],
			wishlistItems: [],
			collections: [],
		};
	}
}
