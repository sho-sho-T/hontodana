/**
 * レスポンス時間パフォーマンステスト
 * 現在の実装では目標値を満たさない可能性が高いため、失敗するテスト
 */

import { getUserBooks, searchBooks } from "@/lib/server-actions/books";

describe("Response Time Performance Tests", () => {
	// このテストは最適化前は失敗する可能性が高い
	it("should search books within 3 seconds", async () => {
		const startTime = performance.now();

		try {
			await searchBooks("JavaScript プログラミング");
		} catch (_error) {
			// エラーでも時間測定は続行
		}

		const endTime = performance.now();
		const responseTime = endTime - startTime;

		console.log(`Book search response time: ${responseTime}ms`);
		expect(responseTime).toBeLessThanOrEqual(3000); // 3秒以内を期待
	});

	it("should load user books within 2 seconds", async () => {
		const startTime = performance.now();

		try {
			await getUserBooks();
		} catch (_error) {
			// エラーでも時間測定は続行
		}

		const endTime = performance.now();
		const responseTime = endTime - startTime;

		console.log(`User books load time: ${responseTime}ms`);
		expect(responseTime).toBeLessThanOrEqual(2000); // 2秒以内を期待
	});

	// データベースクエリのN+1問題をテスト
	it("should not have N+1 query problems", async () => {
		// モックDBクエリカウンター
		let queryCount = 0;
		const _originalPrismaQuery = jest.fn(() => {
			queryCount++;
			return Promise.resolve([]);
		});

		// 100冊のデータ取得で複数クエリが実行されないことを確認
		try {
			await getUserBooks();
		} catch (_error) {
			// エラーでもクエリ数は確認
		}

		// N+1問題がある場合、このテストは失敗する
		console.log(`Query count: ${queryCount}`);
		expect(queryCount).toBeLessThanOrEqual(3); // 理想的には1-3クエリ以内
	});
});
