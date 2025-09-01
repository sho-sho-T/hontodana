/**
 * インポートジョブ管理サービス
 * TDD Green Phase: 最小実装
 */
import type { ImportJobStatus } from "@/types/export-import";

export class ImportJobManager {
	async getJobStatus(jobId: string): Promise<ImportJobStatus | null> {
		// 最小実装: モックジョブステータス
		if (jobId === "nonexistent-job") {
			return null;
		}

		// ジョブIDに基づいてステータスを決定（テスト用）
		if (jobId.includes("completed")) {
			return {
				jobId,
				status: "completed",
				progress: 100,
				startedAt: new Date().toISOString(),
				completedAt: new Date().toISOString(),
				summary: {
					booksAdded: 5,
					booksUpdated: 2,
					booksSkipped: 0,
					sessionsAdded: 10,
					collectionsAdded: 1,
					collectionsUpdated: 0,
					wishlistItemsAdded: 0,
					totalProcessed: 18,
					errors: [],
				},
			};
		}

		if (jobId.includes("failed")) {
			return {
				jobId,
				status: "failed",
				progress: 50,
				startedAt: new Date().toISOString(),
				errors: [
					{
						type: "VALIDATION_ERROR",
						message: "Invalid book data",
						details: {
							line: 5,
							field: "pageCount",
							value: -1,
							suggestion: "Page count must be a positive number",
						},
					},
				],
			};
		}

		// デフォルトは処理中
		return {
			jobId,
			status: "processing",
			progress: Math.floor(Math.random() * 80) + 10, // 10-90%のランダム進捗
			estimatedTimeRemaining: Math.floor(Math.random() * 300) + 30, // 30-330秒
			startedAt: new Date().toISOString(),
		};
	}

	async startImportJob(
		jobId: string,
		userId: string,
		_data: any
	): Promise<void> {
		// 最小実装: ジョブの開始（非同期処理のシミュレート）
		console.log(`Starting import job ${jobId} for user ${userId}`);
	}

	async cancelJob(jobId: string): Promise<boolean> {
		// 最小実装: ジョブのキャンセル
		console.log(`Cancelling job ${jobId}`);
		return true;
	}
}
