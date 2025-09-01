/**
 * データインポート API
 * TDD Green Phase: 最小実装
 */
import { type NextRequest, NextResponse } from "next/server";
import { ImportJobManager } from "@/lib/services/import-job";
import { ImportService } from "@/lib/services/import-service";
import type { ImportPreview, ImportResponse } from "@/types/export-import";

// 認証モック（テスト用）
async function getAuthenticatedUser(request: NextRequest) {
	const authHeader = request.headers.get("authorization");

	if (!authHeader?.startsWith("Bearer ")) {
		return null;
	}

	return {
		id: "user-1",
		email: "test@example.com",
		token: authHeader.replace("Bearer ", ""),
	};
}

export async function POST(request: NextRequest) {
	try {
		// 認証チェック
		const user = await getAuthenticatedUser(request);
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// FormDataの解析
		let formData: FormData;
		try {
			formData = await request.formData();
		} catch {
			return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
		}

		const file = formData.get("file") as File;
		if (!file) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}

		// ファイルサイズチェック（100MB制限）
		const maxSize = 100 * 1024 * 1024; // 100MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "File too large. Maximum size is 100MB." },
				{ status: 413 }
			);
		}

		// ファイルタイプの判定
		const fileFormat = determineFileFormat(file);
		if (!fileFormat) {
			return NextResponse.json(
				{ error: "Invalid file format. Supported formats: JSON, CSV" },
				{ status: 400 }
			);
		}

		// ファイル内容の読み込み
		const fileContent = await file.text();

		// ファイル内容の検証とプレビュー生成
		const previewData = await generatePreview(fileContent, fileFormat, user.id);

		// ジョブIDの生成
		const jobId = `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// レスポンス準備
		const response: ImportResponse = {
			jobId,
			estimatedTime: Math.max(
				30,
				Math.floor(previewData.userBooks.length * 0.1)
			), // 最小30秒
			previewData,
			uploadId: `upload-${jobId}`,
		};

		return NextResponse.json(response, { status: 202 });
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.includes("Invalid JSON")) {
				return NextResponse.json(
					{ error: "Invalid JSON format" },
					{ status: 400 }
				);
			}

			if (error.message.includes("Invalid CSV")) {
				return NextResponse.json(
					{ error: "Invalid CSV format" },
					{ status: 400 }
				);
			}
		}

		console.error("Import API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		// 認証チェック
		const user = await getAuthenticatedUser(request);
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// URLからjobIdを抽出
		const url = new URL(request.url);
		const pathParts = url.pathname.split("/");
		const jobId = pathParts[pathParts.length - 1];

		if (!jobId || jobId === "status") {
			return NextResponse.json({ error: "Job ID required" }, { status: 400 });
		}

		// ジョブステータスの取得
		const jobManager = new ImportJobManager();
		const status = await jobManager.getJobStatus(jobId);

		if (!status) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		return NextResponse.json(status);
	} catch (error) {
		console.error("Import status API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

function determineFileFormat(file: File): "json" | "csv" | "goodreads" | null {
	const filename = file.name.toLowerCase();

	if (filename.endsWith(".json")) return "json";
	if (filename.endsWith(".csv")) {
		if (filename.includes("goodreads")) return "goodreads";
		return "csv";
	}

	return null;
}

async function generatePreview(
	content: string,
	format: "json" | "csv" | "goodreads",
	userId: string
): Promise<ImportPreview> {
	const importService = new ImportService();

	let parsedData;

	try {
		if (format === "json") {
			parsedData = JSON.parse(content);
			if (!parsedData || typeof parsedData !== "object") {
				throw new Error("Invalid JSON format");
			}
		} else {
			// CSV/Goodreadsの基本検証
			if (!content.includes(",") || content.split("\n").length < 2) {
				throw new Error(`Invalid ${format.toUpperCase()} format`);
			}

			// CSVをJSON形式に変換（簡易版）
			parsedData = {
				userBooks: [
					{
						id: "preview-1",
						userId,
						bookId: "book-1",
						title: "Preview Book",
						status: "reading",
						currentPage: 100,
						rating: format === "goodreads" ? 5 : undefined,
						bookType: "physical",
						notes: [],
						tags: [],
						isFavorite: false,
					},
				],
			};
		}
	} catch {
		throw new Error(`Invalid ${format} format`);
	}

	return {
		metadata: parsedData.metadata,
		userBooks: parsedData.userBooks || [],
		wishlistItems: parsedData.wishlistItems || [],
		collections: parsedData.collections || [],
		readingSessions: parsedData.readingSessions || [],
		duplicates: {
			books: [],
			userBooks: [],
		},
		validationErrors: [],
	};
}
