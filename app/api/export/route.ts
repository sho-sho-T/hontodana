/**
 * データエクスポート API
 * TDD Green Phase: 最小実装
 */
import { type NextRequest, NextResponse } from "next/server";
import { ExportService } from "@/lib/services/export-service";
import type { ExportOptions } from "@/types/export-import";

// 認証モック（テスト用）
async function getAuthenticatedUser(request: NextRequest) {
	const authHeader = request.headers.get("authorization");

	if (!authHeader?.startsWith("Bearer ")) {
		return null;
	}

	// テスト用のモックユーザー
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

		// リクエストボディの解析
		let requestData: ExportOptions;
		try {
			requestData = await request.json();
		} catch {
			return NextResponse.json(
				{ error: "Invalid JSON request body" },
				{ status: 400 }
			);
		}

		// バリデーション
		if (
			!requestData.format ||
			!["json", "csv", "goodreads"].includes(requestData.format)
		) {
			return NextResponse.json(
				{ error: "Invalid format. Must be json, csv, or goodreads" },
				{ status: 400 }
			);
		}

		if (!requestData.dataTypes || requestData.dataTypes.length === 0) {
			return NextResponse.json(
				{ error: "At least one data type must be specified" },
				{ status: 400 }
			);
		}

		// エクスポートサービスの実行
		const exportService = new ExportService();
		const result = await exportService.exportUserData(user.id, requestData);

		// CSV形式の場合はファイルダウンロードレスポンス
		if (requestData.format === "csv") {
			const filename = `hontodana_export_${new Date().toISOString().split("T")[0]}.csv`;

			return new NextResponse(result as string, {
				status: 200,
				headers: {
					"Content-Type": "text/csv; charset=utf-8",
					"Content-Disposition": `attachment; filename="${filename}"`,
				},
			});
		}

		// JSON形式の場合
		return NextResponse.json(result, {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.includes("Rate limit")) {
				return NextResponse.json(
					{ error: "Rate limit exceeded. Please try again later." },
					{ status: 429 }
				);
			}

			if (error.message.includes("User not found")) {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}

			if (error.message.includes("Invalid")) {
				return NextResponse.json({ error: error.message }, { status: 400 });
			}
		}

		console.error("Export API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
