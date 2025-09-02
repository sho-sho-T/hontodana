/**
 * DataConverter のテスト
 */

import { DataConverter } from "@/lib/utils/data-converter";

describe("DataConverter", () => {
	let converter: DataConverter;

	beforeEach(() => {
		converter = new DataConverter();
	});

	describe("jsonToCsv", () => {
		test("正常なJSONデータがCSVに変換される", () => {
			const jsonData = {
				userBooks: [
					{
						title: "プログラミング入門",
						authors: ["田中太郎"],
						status: "reading",
					},
					{
						title: "JavaScript基礎",
						authors: ["佐藤花子"],
						status: "completed",
					},
				],
			};

			const result = converter.jsonToCsv(jsonData);

			expect(result).toContain("Title,Authors,Status");
			expect(result).toContain("プログラミング入門");
			expect(result).toContain("JavaScript基礎");
		});

		test("空のuserBooksの場合、ヘッダーのみが返される", () => {
			const jsonData = {
				userBooks: [],
			};

			const result = converter.jsonToCsv(jsonData);

			expect(result).toBe("Title,Authors,Status");
		});

		test("userBooksが存在しない場合、ヘッダーのみが返される", () => {
			const jsonData = {};

			const result = converter.jsonToCsv(jsonData);

			expect(result).toBe("Title,Authors,Status");
		});

		test("タイトルがない場合、デフォルト値が使用される", () => {
			const jsonData = {
				userBooks: [
					{
						authors: ["著者名"],
						status: "reading",
					},
				],
			};

			const result = converter.jsonToCsv(jsonData);

			expect(result).toContain("Test Book");
		});

		test("ステータスがない場合、デフォルト値が使用される", () => {
			const jsonData = {
				userBooks: [
					{
						title: "テスト書籍",
						authors: ["著者名"],
					},
				],
			};

			const result = converter.jsonToCsv(jsonData);

			expect(result).toContain("reading");
		});
	});

	describe("csvToJson", () => {
		test("正常なCSVデータがJSONに変換される", () => {
			const csvData = `Title,Authors,Status,CurrentPage
プログラミング入門,田中太郎,reading,50
JavaScript基礎,佐藤花子,completed,300`;

			const result = converter.csvToJson(csvData);

			expect(result.userBooks).toHaveLength(2);
			expect(result.userBooks[0]).toMatchObject({
				title: "プログラミング入門",
				status: "reading",
				currentPage: 50,
			});
			expect(result.userBooks[1]).toMatchObject({
				title: "JavaScript基礎",
				status: "completed",
				currentPage: 300,
			});
		});

		test("ヘッダーのみのCSVはエラーになる", () => {
			const csvData = "Title,Authors,Status";

			expect(() => converter.csvToJson(csvData)).toThrow(
				"File must contain at least a header and one data row"
			);
		});

		test("空のCSVはエラーになる", () => {
			const csvData = "";

			expect(() => converter.csvToJson(csvData)).toThrow(
				"File must contain at least a header and one data row"
			);
		});

		test("タイトルが空の行はエラーになる", () => {
			const csvData = `Title,Authors,Status
,田中太郎,reading`;

			expect(() => converter.csvToJson(csvData)).toThrow("Title is required");
		});

		test("無効なページ数はエラーになる", () => {
			const csvData = `Title,Authors,Status,CurrentPage
テスト書籍,著者名,reading,invalid`;

			expect(() => converter.csvToJson(csvData)).toThrow(
				"Must be a valid number"
			);
		});

		test("CurrentPageが空の場合、0が設定される", () => {
			const csvData = `Title,Authors,Status,CurrentPage
テスト書籍,著者名,reading,`;

			const result = converter.csvToJson(csvData);

			expect(result.userBooks[0].currentPage).toBe(0);
		});

		test("StatusとCurrentPageがない場合、デフォルト値が使用される", () => {
			const csvData = `Title,Authors
テスト書籍,著者名`;

			const result = converter.csvToJson(csvData);

			expect(result.userBooks[0]).toMatchObject({
				title: "テスト書籍",
				status: "reading",
				currentPage: 0,
			});
		});
	});

	describe("parseCsvRow (private method)", () => {
		test("引用符なしの行が正しく解析される", () => {
			const csvData = "Title,Authors,Status";
			const result = converter.csvToJson(
				`${csvData}\nテスト書籍,著者名,reading`
			);

			expect(result.userBooks[0].title).toBe("テスト書籍");
		});

		test("引用符ありの行が正しく解析される", () => {
			const csvData =
				'Title,Authors,Status\n"引用符,付きタイトル","著者名",reading';
			const result = converter.csvToJson(csvData);

			expect(result.userBooks[0].title).toBe("引用符,付きタイトル");
		});

		test("エスケープされた引用符が正しく処理される", () => {
			const csvData =
				'Title,Authors,Status\n"引用符""付き""タイトル","著者名",reading';
			const result = converter.csvToJson(csvData);

			expect(result.userBooks[0].title).toBe('引用符"付き"タイトル');
		});

		test("空のフィールドが正しく処理される", () => {
			const csvData = 'Title,Authors,Status\n"テスト書籍",,reading';
			const result = converter.csvToJson(csvData);

			expect(result.userBooks[0].title).toBe("テスト書籍");
		});
	});

	describe("goodreadsToJson", () => {
		test("Goodreadsデータが正しく変換される", () => {
			const goodreadsData = `Book Id,Title,Author,My Rating,Read Count
123456,Sample Book,Sample Author,5,1
789012,Another Book,Another Author,4,1`;

			const result = converter.goodreadsToJson(goodreadsData);

			expect(result.userBooks).toHaveLength(1);
			expect(result.userBooks[0]).toMatchObject({
				status: "completed",
				rating: 5,
				bookType: "physical",
			});
		});

		test("空のGoodreadsデータの場合、空の配列が返される", () => {
			const goodreadsData = "Book Id,Title,Author";

			const result = converter.goodreadsToJson(goodreadsData);

			expect(result.userBooks).toEqual([]);
		});

		test("ヘッダーのみのGoodreadsデータの場合、空の配列が返される", () => {
			const goodreadsData = "";

			const result = converter.goodreadsToJson(goodreadsData);

			expect(result.userBooks).toEqual([]);
		});

		test("その他のデータ配列が初期化される", () => {
			const goodreadsData = `Book Id,Title,Author
123,Test Book,Test Author`;

			const result = converter.goodreadsToJson(goodreadsData);

			expect(result.books).toEqual([]);
			expect(result.readingSessions).toEqual([]);
			expect(result.wishlistItems).toEqual([]);
			expect(result.collections).toEqual([]);
		});
	});
});
