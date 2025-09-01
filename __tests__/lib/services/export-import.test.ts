/**
 * データエクスポート・インポート機能のテスト
 * TDD Red Phase: 失敗するテストを実装
 */
import { ExportService } from "@/lib/services/export-service";
import { ImportService } from "@/lib/services/import-service";
import { DataConverter } from "@/lib/utils/data-converter";
import { DuplicateHandler } from "@/lib/utils/duplicate-handler";
import type {
	ExportData,
	ExportOptions,
	ImportResult,
} from "@/types/export-import";

// テスト用のモックデータ
const mockUserData = {
	userProfile: {
		id: "user-1",
		name: "Test User",
		theme: "light",
		displayMode: "grid",
		booksPerPage: 20,
	},
	books: [
		{
			id: "book-1",
			title: "Test Book 1",
			authors: ["Author 1"],
			isbn13: "9781234567890",
			pageCount: 200,
			thumbnailUrl: "https://example.com/book1.jpg",
		},
	],
	userBooks: [
		{
			id: "userbook-1",
			userId: "user-1",
			bookId: "book-1",
			status: "reading",
			currentPage: 100,
			rating: 4,
			review: "Great book!",
			tags: ["fiction", "mystery"],
		},
	],
	readingSessions: [
		{
			id: "session-1",
			userBookId: "userbook-1",
			startPage: 80,
			endPage: 100,
			pagesRead: 20,
			sessionDate: "2024-01-15",
			durationMinutes: 60,
		},
	],
	wishlistItems: [
		{
			id: "wishlist-1",
			userId: "user-1",
			bookId: "book-2",
			priority: "high",
			reason: "Recommended by friend",
		},
	],
	collections: [
		{
			id: "collection-1",
			userId: "user-1",
			name: "Favorites",
			description: "My favorite books",
			color: "#3B82F6",
			icon: "⭐",
		},
	],
};

describe("ExportService", () => {
	let exportService: ExportService;

	beforeEach(() => {
		exportService = new ExportService();
	});

	describe("JSON Export", () => {
		test("完全なユーザーデータをJSON形式でエクスポート", async () => {
			const options: ExportOptions = {
				format: "json",
				dataTypes: [
					"userBooks",
					"wishlist",
					"collections",
					"sessions",
					"profile",
				],
			};

			const result = await exportService.exportUserData("user-1", options);

			// メタデータの確認
			expect(result.metadata).toBeDefined();
			expect(result.metadata.format).toBe("hontodana-v1");
			expect(result.metadata.userId).toBe("user-1");
			expect(result.metadata.exportDate).toBeDefined();

			// データの確認
			expect(result.userBooks).toHaveLength(1);
			expect(result.collections).toHaveLength(1);
			expect(result.readingSessions).toHaveLength(1);
			expect(result.wishlistItems).toHaveLength(1);
		});

		test("選択的データエクスポート - 本棚データのみ", async () => {
			const options: ExportOptions = {
				format: "json",
				dataTypes: ["userBooks"],
			};

			const result = await exportService.exportUserData("user-1", options);

			expect(result.userBooks).toHaveLength(1);
			expect(result.collections).toHaveLength(0);
			expect(result.readingSessions).toHaveLength(0);
			expect(result.wishlistItems).toHaveLength(0);
		});

		test("日付範囲指定でのエクスポート", async () => {
			const options: ExportOptions = {
				format: "json",
				dataTypes: ["sessions"],
				dateRange: {
					from: new Date("2024-01-01"),
					to: new Date("2024-12-31"),
				},
			};

			const result = await exportService.exportUserData("user-1", options);

			// 指定期間内のセッションのみ含まれることを確認
			result.readingSessions.forEach((session) => {
				const sessionDate = new Date(session.sessionDate);
				expect(sessionDate >= options.dateRange!.from!).toBe(true);
				expect(sessionDate <= options.dateRange!.to!).toBe(true);
			});
		});

		test("空のデータでもエラーなくエクスポート", async () => {
			const options: ExportOptions = {
				format: "json",
				dataTypes: ["userBooks"],
			};

			const result = await exportService.exportUserData("empty-user", options);

			expect(result.metadata).toBeDefined();
			expect(result.userBooks).toEqual([]);
		});
	});

	describe("CSV Export", () => {
		test("本棚データをCSV形式でエクスポート", async () => {
			const options: ExportOptions = {
				format: "csv",
				dataTypes: ["userBooks"],
			};

			const result = await exportService.exportUserData("user-1", options);

			expect(result).toMatch(/Title,Authors,Status,CurrentPage,Rating/);
			expect(result).toMatch(/Test Book 1/);
		});

		test("特殊文字を含むデータのCSVエクスポート", async () => {
			const options: ExportOptions = {
				format: "csv",
				dataTypes: ["userBooks"],
			};

			const result = await exportService.exportUserData(
				"user-with-special-chars",
				options
			);

			// 引用符やカンマのエスケープを確認
			expect(result).toMatch(/".*"/); // 引用符でエスケープされている
		});
	});

	describe("Error Handling", () => {
		test("存在しないユーザーIDでエラー", async () => {
			const options: ExportOptions = {
				format: "json",
				dataTypes: ["userBooks"],
			};

			await expect(
				exportService.exportUserData("nonexistent-user", options)
			).rejects.toThrow("User not found");
		});

		test("不正な形式指定でエラー", async () => {
			const options = {
				format: "invalid",
				dataTypes: ["userBooks"],
			} as ExportOptions;

			await expect(
				exportService.exportUserData("user-1", options)
			).rejects.toThrow("Invalid format");
		});

		test("データベース接続エラー時の処理", async () => {
			// データベース接続エラーをシミュレート - 特別なユーザーIDを使用
			const options: ExportOptions = {
				format: "json",
				dataTypes: ["userBooks"],
			};

			await expect(
				exportService.exportUserData("db-error-user", options)
			).rejects.toThrow("Database connection failed");
		});
	});
});

describe("ImportService", () => {
	let importService: ImportService;

	beforeEach(() => {
		importService = new ImportService();
	});

	describe("JSON Import", () => {
		test("有効なJSONデータのインポート", async () => {
			const importData: ExportData = {
				metadata: {
					version: "1.0.0",
					exportDate: "2024-01-15T10:00:00.000Z",
					userId: "user-1",
					format: "hontodana-v1",
				},
				userProfile: mockUserData.userProfile,
				books: mockUserData.books,
				userBooks: mockUserData.userBooks,
				readingSessions: mockUserData.readingSessions,
				wishlistItems: mockUserData.wishlistItems,
				collections: mockUserData.collections,
			};

			const result: ImportResult = await importService.importUserData(
				"user-1",
				importData
			);

			expect(result.success).toBe(true);
			expect(result.summary.booksAdded).toBe(1);
			expect(result.summary.sessionsAdded).toBe(1);
			expect(result.summary.collectionsAdded).toBe(1);
			expect(result.summary.errors).toHaveLength(0);
		});

		test("部分的なデータのインポート", async () => {
			const partialData: Partial<ExportData> = {
				metadata: {
					version: "1.0.0",
					exportDate: "2024-01-15T10:00:00.000Z",
					userId: "user-1",
					format: "hontodana-v1",
				},
				userBooks: mockUserData.userBooks,
			};

			const result = await importService.importUserData(
				"user-1",
				partialData as ExportData
			);

			expect(result.success).toBe(true);
			expect(result.summary.booksAdded).toBe(1);
		});

		test("重複データのマージ処理", async () => {
			const duplicateData: ExportData = {
				metadata: {
					version: "1.0.0",
					exportDate: "2024-01-15T10:00:00.000Z",
					userId: "user-1",
					format: "hontodana-v1",
				},
				books: [
					{
						...mockUserData.books[0],
						title: "Updated Title", // 更新されたタイトル
					},
				],
				userBooks: [
					{
						...mockUserData.userBooks[0],
						rating: 5, // 更新された評価
						review: "Even better on second read!",
					},
				],
			} as ExportData;

			const result = await importService.importUserData(
				"user-1",
				duplicateData
			);

			expect(result.success).toBe(true);
			expect(result.summary.booksUpdated).toBe(1);
			// 重複したデータが適切にマージされることを確認
		});
	});

	describe("CSV Import", () => {
		test("有効なCSVデータのインポート", async () => {
			const csvData = `Title,Authors,Status,CurrentPage,Rating,Review
"Test Book 1","Author 1","reading",100,4,"Great book!"`;

			const result = await importService.importCsvData("user-1", csvData);

			expect(result.success).toBe(true);
			expect(result.summary.booksAdded).toBe(1);
		});

		test("CSVファイル内の特殊文字処理", async () => {
			const csvWithSpecialChars = `Title,Authors,Status,CurrentPage,Rating
"Book with ""quotes"" and, commas","Author Name",reading,50,3`;

			const result = await importService.importCsvData(
				"user-1",
				csvWithSpecialChars
			);

			expect(result.success).toBe(true);
			expect(result.summary.booksAdded).toBe(1);
		});
	});

	describe("Goodreads Import", () => {
		test("Goodreads形式からの変換", async () => {
			const goodreadsData = `Title,Author,My Rating,Date Read,Book Id
"The Great Gatsby","F. Scott Fitzgerald",5,"2024/01/15",12345`;

			const result = await importService.importGoodreadsData(
				"user-1",
				goodreadsData
			);

			expect(result.success).toBe(true);
			expect(result.summary.booksAdded).toBe(1);
			// Goodreadsフィールドが正しくマッピングされることを確認
		});
	});

	describe("Error Handling", () => {
		test("不正なJSONフォーマットでエラー", async () => {
			const invalidJson = '{"invalid": json}';

			await expect(
				importService.importUserData("user-1", invalidJson as any)
			).rejects.toThrow("Invalid JSON format");
		});

		test("不正なCSVフォーマットでエラー", async () => {
			const invalidCsv = "invalid,csv,format";

			await expect(
				importService.importCsvData("user-1", invalidCsv)
			).rejects.toThrow("Invalid CSV format");
		});

		test("データ制約エラーでのロールバック", async () => {
			const dataWithConstraintViolation: ExportData = {
				metadata: {
					version: "1.0.0",
					exportDate: "2024-01-15T10:00:00.000Z",
					userId: "user-1",
					format: "hontodana-v1",
				},
				userBooks: [
					{
						...mockUserData.userBooks[0],
						currentPage: -1, // 不正な値
					},
				],
			} as ExportData;

			await expect(
				importService.importUserData("user-1", dataWithConstraintViolation)
			).rejects.toThrow();

			// ロールバックが正常に動作することを確認
			// 部分的なデータも残っていないことを確認
		});
	});
});

describe("DataConverter", () => {
	let converter: DataConverter;

	beforeEach(() => {
		converter = new DataConverter();
	});

	test("JSON to CSV変換", () => {
		const jsonData = mockUserData;

		const csvResult = converter.jsonToCsv(jsonData);

		expect(csvResult).toMatch(/Title,Authors,Status/);
		expect(csvResult.split("\n")).toHaveLength(2); // ヘッダー + 1データ行
	});

	test("CSV to JSON変換", () => {
		const csvData = `Title,Authors,Status,CurrentPage
"Test Book","Test Author","reading",100`;

		const jsonResult = converter.csvToJson(csvData);

		expect(jsonResult.userBooks).toHaveLength(1);
		expect(jsonResult.userBooks[0].title).toBe("Test Book");
	});

	test("Goodreads to JSON変換", () => {
		const goodreadsData = `Title,Author,My Rating,Date Read
"Test Book","Test Author",5,"2024/01/15"`;

		const jsonResult = converter.goodreadsToJson(goodreadsData);

		expect(jsonResult.userBooks).toHaveLength(1);
		expect(jsonResult.userBooks[0].rating).toBe(5);
	});
});

describe("DuplicateHandler", () => {
	let duplicateHandler: DuplicateHandler;

	beforeEach(() => {
		duplicateHandler = new DuplicateHandler();
	});

	test("ISBN13による重複検出", () => {
		const existingBooks = [{ isbn13: "9781234567890", title: "Existing Book" }];
		const newBook = {
			isbn13: "9781234567890",
			title: "Same Book Different Title",
		};

		const isDuplicate = duplicateHandler.checkBookDuplicate(
			newBook,
			existingBooks
		);

		expect(isDuplicate).toBe(true);
	});

	test("タイトルと著者による類似度判定", () => {
		const book1 = {
			title: "JavaScript: The Good Parts",
			authors: ["Douglas Crockford"],
		};
		const book2 = {
			title: "Javascript: The Good Parts", // 大文字小文字違い
			authors: ["Douglas Crockford"],
		};

		const similarity = duplicateHandler.calculateBookSimilarity(book1, book2);

		expect(similarity).toBeGreaterThan(0.9);
	});

	test("重複データのマージ戦略", () => {
		const existingBook = {
			id: "book-1",
			title: "Test Book",
			rating: 3,
			review: "Old review",
			currentPage: 50,
		};
		const newBook = {
			title: "Test Book",
			rating: 5,
			review: "New review",
			currentPage: 100,
		};

		const mergedBook = duplicateHandler.mergeBookData(existingBook, newBook);

		// より新しい/より完全なデータが優先されることを確認
		expect(mergedBook.rating).toBe(5);
		expect(mergedBook.review).toBe("New review");
		expect(mergedBook.currentPage).toBe(100);
	});
});
