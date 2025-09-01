import { NextRequest, NextResponse } from "next/server";
import { POST as exportPOST } from "@/app/api/export/route";
import { GET as importGET, POST as importPOST } from "@/app/api/import/route";
import type { ExportOptions, ImportJobStatus } from "@/types/export-import";

// テスト用モックユーザー
const mockUser = {
	id: "user-1",
	email: "test@example.com",
	token: "mock-jwt-token",
};

// Mock認証
jest.mock("@/lib/auth/server", () => ({
	getAuthenticatedUser: jest.fn().mockResolvedValue(mockUser),
}));

// MockSupabaseクライアント
jest.mock("@/lib/supabase/server", () => ({
	createClient: jest.fn(() => ({
		auth: {
			getSession: jest.fn(() => ({
				data: { session: { user: mockUser } },
			})),
		},
	})),
}));

describe("POST /api/export", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("有効なエクスポートリクエストで成功レスポンス", async () => {
		const requestData: ExportOptions = {
			format: "json",
			dataTypes: ["userBooks", "wishlist"],
			options: {
				includeImages: false,
				compressOutput: false,
			},
		};

		const request = new NextRequest("http://localhost:3000/api/export", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${mockUser.token}`,
			},
			body: JSON.stringify(requestData),
		});

		const response = await exportPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");
		expect(responseData.metadata).toBeDefined();
		expect(responseData.metadata.userId).toBe(mockUser.id);
		expect(responseData.userBooks).toBeDefined();
		expect(responseData.wishlistItems).toBeDefined();
	});

	test("CSV形式でのエクスポート", async () => {
		const requestData: ExportOptions = {
			format: "csv",
			dataTypes: ["userBooks"],
		};

		const request = new NextRequest("http://localhost:3000/api/export", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${mockUser.token}`,
			},
			body: JSON.stringify(requestData),
		});

		const response = await exportPOST(request);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/csv");
		expect(response.headers.get("content-disposition")).toMatch(/attachment/);
	});

	test("日付範囲指定でのエクスポート", async () => {
		const requestData: ExportOptions = {
			format: "json",
			dataTypes: ["sessions"],
			dateRange: {
				from: new Date("2024-01-01"),
				to: new Date("2024-12-31"),
			},
		};

		const request = new NextRequest("http://localhost:3000/api/export", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${mockUser.token}`,
			},
			body: JSON.stringify(requestData),
		});

		const response = await exportPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(200);
		expect(responseData.readingSessions).toBeDefined();

		// 日付範囲内のデータのみ含まれることを確認
		responseData.readingSessions.forEach((session: any) => {
			const sessionDate = new Date(session.sessionDate);
			expect(sessionDate >= requestData.dateRange!.from!).toBe(true);
			expect(sessionDate <= requestData.dateRange!.to!).toBe(true);
		});
	});

	test("未認証ユーザーで401エラー", async () => {
		// 認証モックを未認証状態に変更
		jest
			.mocked(require("@/lib/auth/server").getAuthenticatedUser)
			.mockResolvedValueOnce(null);

		const requestData: ExportOptions = {
			format: "json",
			dataTypes: ["userBooks"],
		};

		const request = new NextRequest("http://localhost:3000/api/export", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestData),
		});

		const response = await exportPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(401);
		expect(responseData.error).toContain("Unauthorized");
	});

	test("不正な形式で400エラー", async () => {
		const requestData = {
			format: "invalid",
			dataTypes: ["userBooks"],
		};

		const request = new NextRequest("http://localhost:3000/api/export", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${mockUser.token}`,
			},
			body: JSON.stringify(requestData),
		});

		const response = await exportPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(400);
		expect(responseData.error).toContain("Invalid format");
	});

	test("空のdataTypesで400エラー", async () => {
		const requestData = {
			format: "json",
			dataTypes: [],
		};

		const request = new NextRequest("http://localhost:3000/api/export", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${mockUser.token}`,
			},
			body: JSON.stringify(requestData),
		});

		const response = await exportPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(400);
		expect(responseData.error).toContain(
			"At least one data type must be specified"
		);
	});

	test("レート制限による429エラー", async () => {
		// レート制限をシミュレート
		jest
			.mocked(
				require("@/lib/services/export-service").ExportService.prototype
					.exportUserData
			)
			.mockRejectedValueOnce(new Error("Rate limit exceeded"));

		const requestData: ExportOptions = {
			format: "json",
			dataTypes: ["userBooks"],
		};

		const request = new NextRequest("http://localhost:3000/api/export", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${mockUser.token}`,
			},
			body: JSON.stringify(requestData),
		});

		const response = await exportPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(429);
		expect(responseData.error).toContain("Rate limit exceeded");
	});
});

describe("POST /api/import", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("有効なJSONファイルのインポート", async () => {
		const jsonData = {
			metadata: {
				version: "1.0.0",
				exportDate: "2024-01-15T10:00:00.000Z",
				userId: "user-1",
				format: "hontodana-v1",
			},
			userBooks: [
				{
					id: "userbook-1",
					bookId: "book-1",
					title: "Test Book",
					status: "reading",
					currentPage: 100,
				},
			],
		};

		const formData = new FormData();
		formData.append(
			"file",
			new Blob([JSON.stringify(jsonData)], { type: "application/json" }),
			"export.json"
		);

		const request = new NextRequest("http://localhost:3000/api/import", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${mockUser.token}`,
			},
			body: formData,
		});

		const response = await importPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(202); // Accepted for async processing
		expect(responseData.jobId).toBeDefined();
		expect(responseData.estimatedTime).toBeGreaterThan(0);
		expect(responseData.previewData).toBeDefined();
		expect(responseData.previewData.userBooks).toHaveLength(1);
	});

	test("CSVファイルのインポート", async () => {
		const csvData = `Title,Authors,Status,CurrentPage,Rating
"Test Book","Test Author","reading",100,4`;

		const formData = new FormData();
		formData.append(
			"file",
			new Blob([csvData], { type: "text/csv" }),
			"books.csv"
		);

		const request = new NextRequest("http://localhost:3000/api/import", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${mockUser.token}`,
			},
			body: formData,
		});

		const response = await importPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(202);
		expect(responseData.jobId).toBeDefined();
		expect(responseData.previewData.userBooks).toHaveLength(1);
	});

	test("Goodreads形式ファイルのインポート", async () => {
		const goodreadsData = `Title,Author,My Rating,Date Read,Book Id
"The Great Gatsby","F. Scott Fitzgerald",5,"2024/01/15",12345`;

		const formData = new FormData();
		formData.append(
			"file",
			new Blob([goodreadsData], { type: "text/csv" }),
			"goodreads_library_export.csv"
		);

		const request = new NextRequest("http://localhost:3000/api/import", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${mockUser.token}`,
			},
			body: formData,
		});

		const response = await importPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(202);
		expect(responseData.jobId).toBeDefined();
		expect(responseData.previewData.userBooks[0].rating).toBe(5);
	});

	test("ファイルなしで400エラー", async () => {
		const request = new NextRequest("http://localhost:3000/api/import", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${mockUser.token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({}),
		});

		const response = await importPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(400);
		expect(responseData.error).toContain("No file uploaded");
	});

	test("ファイルサイズ制限超過で413エラー", async () => {
		// 100MBの大きなファイルをシミュレート
		const largeData = "x".repeat(100 * 1024 * 1024);
		const formData = new FormData();
		formData.append("file", new Blob([largeData]), "large.json");

		const request = new NextRequest("http://localhost:3000/api/import", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${mockUser.token}`,
			},
			body: formData,
		});

		const response = await importPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(413);
		expect(responseData.error).toContain("File too large");
	});

	test("不正なファイル形式で400エラー", async () => {
		const invalidData = "This is not JSON or CSV";
		const formData = new FormData();
		formData.append("file", new Blob([invalidData]), "invalid.txt");

		const request = new NextRequest("http://localhost:3000/api/import", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${mockUser.token}`,
			},
			body: formData,
		});

		const response = await importPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(400);
		expect(responseData.error).toContain("Invalid file format");
	});

	test("破損したJSONファイルで400エラー", async () => {
		const corruptedJson = '{"invalid": json}';
		const formData = new FormData();
		formData.append("file", new Blob([corruptedJson]), "corrupted.json");

		const request = new NextRequest("http://localhost:3000/api/import", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${mockUser.token}`,
			},
			body: formData,
		});

		const response = await importPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(400);
		expect(responseData.error).toContain("Invalid JSON format");
	});

	test("未認証ユーザーで401エラー", async () => {
		jest
			.mocked(require("@/lib/auth/server").getAuthenticatedUser)
			.mockResolvedValueOnce(null);

		const formData = new FormData();
		formData.append("file", new Blob([JSON.stringify({})]), "test.json");

		const request = new NextRequest("http://localhost:3000/api/import", {
			method: "POST",
			body: formData,
		});

		const response = await importPOST(request);
		const responseData = await response.json();

		expect(response.status).toBe(401);
		expect(responseData.error).toContain("Unauthorized");
	});
});

describe("GET /api/import/status/[jobId]", () => {
	const mockJobId = "job-123";

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("処理中ジョブのステータス取得", async () => {
		const request = new NextRequest(
			`http://localhost:3000/api/import/status/${mockJobId}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${mockUser.token}`,
				},
			}
		);

		const response = await importGET(request, { params: { jobId: mockJobId } });
		const responseData = await response.json();

		expect(response.status).toBe(200);
		expect(responseData.status).toBe("processing");
		expect(responseData.progress).toBeGreaterThanOrEqual(0);
		expect(responseData.progress).toBeLessThanOrEqual(100);
	});

	test("完了ジョブのステータス取得", async () => {
		// 完了したジョブをシミュレート
		jest
			.mocked(
				require("@/lib/services/import-job").ImportJobManager.prototype
					.getJobStatus
			)
			.mockResolvedValueOnce({
				status: "completed",
				progress: 100,
				summary: {
					booksAdded: 5,
					booksUpdated: 2,
					sessionsAdded: 10,
					collectionsAdded: 1,
					errors: [],
				},
			} as ImportJobStatus);

		const request = new NextRequest(
			`http://localhost:3000/api/import/status/${mockJobId}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${mockUser.token}`,
				},
			}
		);

		const response = await importGET(request, { params: { jobId: mockJobId } });
		const responseData = await response.json();

		expect(response.status).toBe(200);
		expect(responseData.status).toBe("completed");
		expect(responseData.progress).toBe(100);
		expect(responseData.summary).toBeDefined();
		expect(responseData.summary.booksAdded).toBe(5);
	});

	test("失敗ジョブのステータス取得", async () => {
		jest
			.mocked(
				require("@/lib/services/import-job").ImportJobManager.prototype
					.getJobStatus
			)
			.mockResolvedValueOnce({
				status: "failed",
				progress: 50,
				errors: [
					{
						type: "VALIDATION_ERROR",
						message: "Invalid book data",
						details: { line: 5, field: "pageCount" },
					},
				],
			} as ImportJobStatus);

		const request = new NextRequest(
			`http://localhost:3000/api/import/status/${mockJobId}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${mockUser.token}`,
				},
			}
		);

		const response = await importGET(request, { params: { jobId: mockJobId } });
		const responseData = await response.json();

		expect(response.status).toBe(200);
		expect(responseData.status).toBe("failed");
		expect(responseData.errors).toHaveLength(1);
		expect(responseData.errors[0].type).toBe("VALIDATION_ERROR");
	});

	test("存在しないジョブIDで404エラー", async () => {
		jest
			.mocked(
				require("@/lib/services/import-job").ImportJobManager.prototype
					.getJobStatus
			)
			.mockResolvedValueOnce(null);

		const request = new NextRequest(
			"http://localhost:3000/api/import/status/nonexistent-job",
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${mockUser.token}`,
				},
			}
		);

		const response = await importGET(request, {
			params: { jobId: "nonexistent-job" },
		});
		const responseData = await response.json();

		expect(response.status).toBe(404);
		expect(responseData.error).toContain("Job not found");
	});

	test("未認証ユーザーで401エラー", async () => {
		jest
			.mocked(require("@/lib/auth/server").getAuthenticatedUser)
			.mockResolvedValueOnce(null);

		const request = new NextRequest(
			`http://localhost:3000/api/import/status/${mockJobId}`,
			{
				method: "GET",
			}
		);

		const response = await importGET(request, { params: { jobId: mockJobId } });
		const responseData = await response.json();

		expect(response.status).toBe(401);
		expect(responseData.error).toContain("Unauthorized");
	});
});
