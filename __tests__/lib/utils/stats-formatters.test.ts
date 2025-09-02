/**
 * 統計データ変換・フォーマッター テスト - TDD Red フェーズ
 * P2優先度テストケース: チャート用データ変換、統計値フォーマット
 */

import {
	calculateTrend,
	formatStatValue,
	generateChartLabels,
	transformStatsForChart,
} from "@/lib/utils/stats-formatters";

describe("transformStatsForChart", () => {
	const mockDailyStats = [
		{ date: "2024-08-20", pagesRead: 30, readingTime: 45, sessionsCount: 2 },
		{ date: "2024-08-19", pagesRead: 25, readingTime: 40, sessionsCount: 1 },
		{ date: "2024-08-18", pagesRead: 0, readingTime: 0, sessionsCount: 0 },
	];

	// TDD Red フェーズ: P2優先度テストケース - チャート用データ変換
	describe("P2: チャート用データ変換テスト", () => {
		test("日別統計をChart.js形式に変換", () => {
			const chartData = transformStatsForChart(mockDailyStats, "pages");

			expect(chartData.labels).toEqual(["8/18", "8/19", "8/20"]);
			expect(chartData.datasets[0].data).toEqual([0, 25, 30]);
			expect(chartData.datasets[0].label).toBe("読書ページ数");
			expect(chartData.datasets[0].borderColor).toBeDefined();
			expect(chartData.datasets[0].backgroundColor).toBeDefined();
		});

		test("時間データのChart.js形式変換", () => {
			const chartData = transformStatsForChart(mockDailyStats, "minutes");

			expect(chartData.labels).toEqual(["8/18", "8/19", "8/20"]);
			expect(chartData.datasets[0].data).toEqual([0, 40, 45]);
			expect(chartData.datasets[0].label).toBe("読書時間（分）");
		});

		test("セッション数のChart.js形式変換", () => {
			const chartData = transformStatsForChart(mockDailyStats, "sessions");

			expect(chartData.labels).toEqual(["8/18", "8/19", "8/20"]);
			expect(chartData.datasets[0].data).toEqual([0, 1, 2]);
			expect(chartData.datasets[0].label).toBe("読書セッション数");
		});

		test("欠損データの補間処理", () => {
			const incompleteStats = [
				{
					date: "2024-08-20",
					pagesRead: 30,
					readingTime: 45,
					sessionsCount: 2,
				},
				// 8/19 のデータが欠損
				{
					date: "2024-08-18",
					pagesRead: 25,
					readingTime: 40,
					sessionsCount: 1,
				},
			];

			const chartData = transformStatsForChart(incompleteStats, "pages", {
				fillGaps: true,
			});

			expect(chartData.labels).toHaveLength(3);
			expect(chartData.datasets[0].data).toEqual([25, 0, 30]); // 欠損部分は0で補間
		});

		test("時系列データのソート確認", () => {
			const unsortedStats = [
				{
					date: "2024-08-18",
					pagesRead: 25,
					readingTime: 40,
					sessionsCount: 1,
				},
				{
					date: "2024-08-20",
					pagesRead: 30,
					readingTime: 45,
					sessionsCount: 2,
				},
				{
					date: "2024-08-19",
					pagesRead: 20,
					readingTime: 35,
					sessionsCount: 1,
				},
			];

			const chartData = transformStatsForChart(unsortedStats, "pages");

			expect(chartData.labels).toEqual(["8/18", "8/19", "8/20"]);
			expect(chartData.datasets[0].data).toEqual([25, 20, 30]);
		});

		test("空データの処理", () => {
			const chartData = transformStatsForChart([], "pages");

			expect(chartData.labels).toEqual([]);
			expect(chartData.datasets[0].data).toEqual([]);
			expect(chartData.datasets[0].label).toBe("読書ページ数");
		});

		test("大量データのパフォーマンス", () => {
			// 1年分のデータ（365日）を生成
			const largeDataSet = [];
			for (let i = 0; i < 365; i++) {
				const date = new Date();
				date.setDate(date.getDate() - i);
				largeDataSet.push({
					date: date.toISOString().split("T")[0],
					pagesRead: Math.floor(Math.random() * 50),
					readingTime: Math.floor(Math.random() * 120),
					sessionsCount: Math.floor(Math.random() * 3),
				});
			}

			const startTime = Date.now();
			const chartData = transformStatsForChart(largeDataSet, "pages");
			const endTime = Date.now();

			expect(endTime - startTime).toBeLessThan(100); // 100ms以内
			expect(chartData.datasets[0].data).toHaveLength(365);
		});
	});

	describe("P2: チャートオプション設定テスト", () => {
		test("カラーパレットの適用", () => {
			const chartData = transformStatsForChart(mockDailyStats, "pages", {
				colorScheme: "accessible",
			});

			expect(chartData.datasets[0].borderColor).toBe("#3B82F6"); // アクセシブルブルー
			expect(chartData.datasets[0].backgroundColor).toContain(
				"rgba(59, 130, 246, 0.1)"
			);
		});

		test("複数データセットの処理", () => {
			const chartData = transformStatsForChart(mockDailyStats, "combined", {
				includeMultiple: ["pages", "minutes"],
			});

			expect(chartData.datasets).toHaveLength(2);
			expect(chartData.datasets[0].label).toBe("読書ページ数");
			expect(chartData.datasets[1].label).toBe("読書時間（分）");
		});

		test("トレンドライン生成", () => {
			const chartData = transformStatsForChart(mockDailyStats, "pages", {
				includeTrend: true,
			});

			expect(chartData.datasets).toHaveLength(2); // 元データ + トレンド
			expect(chartData.datasets[1].label).toBe("トレンド");
			expect(chartData.datasets[1].type).toBe("line");
			expect(chartData.datasets[1].borderDash).toEqual([5, 5]);
		});
	});
});

describe("formatStatValue", () => {
	// TDD Red フェーズ: P2優先度テストケース - 統計値フォーマット
	describe("P2: 統計値フォーマットテスト", () => {
		test("時間の表示フォーマット", () => {
			expect(formatStatValue(65, "minutes")).toBe("1時間5分");
			expect(formatStatValue(30, "minutes")).toBe("30分");
			expect(formatStatValue(120, "minutes")).toBe("2時間");
			expect(formatStatValue(0, "minutes")).toBe("0分");
			expect(formatStatValue(1440, "minutes")).toBe("24時間"); // 1日
		});

		test("ページ数の表示フォーマット", () => {
			expect(formatStatValue(1234, "pages")).toBe("1,234ページ");
			expect(formatStatValue(0, "pages")).toBe("0ページ");
			expect(formatStatValue(1, "pages")).toBe("1ページ");
			expect(formatStatValue(1000000, "pages")).toBe("1,000,000ページ");
		});

		test("パーセンテージの表示フォーマット", () => {
			expect(formatStatValue(0.75, "percentage")).toBe("75%");
			expect(formatStatValue(0.333, "percentage")).toBe("33%"); // Rounded to nearest integer
			expect(formatStatValue(1, "percentage")).toBe("100%");
			expect(formatStatValue(0, "percentage")).toBe("0%");
			expect(formatStatValue(0.001, "percentage")).toBe("0%"); // Rounded down
		});

		test("書籍数の表示フォーマット", () => {
			expect(formatStatValue(1, "books")).toBe("1冊");
			expect(formatStatValue(10, "books")).toBe("10冊");
			expect(formatStatValue(0, "books")).toBe("0冊");
			expect(formatStatValue(1000, "books")).toBe("1,000冊");
		});

		test("読書速度の表示フォーマット", () => {
			expect(formatStatValue(1.5, "speed")).toBe("2ページ/分"); // Rounded up
			expect(formatStatValue(0.5, "speed")).toBe("1ページ/分"); // Rounded up
			expect(formatStatValue(0, "speed")).toBe("0ページ/分");
			expect(formatStatValue(10.333, "speed")).toBe("10ページ/分"); // Rounded down
		});

		test("期間の表示フォーマット", () => {
			expect(formatStatValue(7, "days")).toBe("7日");
			expect(formatStatValue(1, "days")).toBe("1日");
			expect(formatStatValue(365, "days")).toBe("365日");
			expect(formatStatValue(0, "days")).toBe("0日");
		});

		test("無効な値の処理", () => {
			expect(formatStatValue(null, "pages")).toBe("0ページ");
			expect(formatStatValue(undefined, "minutes")).toBe("0分");
			expect(formatStatValue(Number.NaN, "percentage")).toBe("0%");
			expect(formatStatValue(-10, "books")).toBe("0冊"); // 負の値は0として処理
		});

		test("カスタムフォーマットオプション", () => {
			expect(formatStatValue(1234.567, "pages", { precision: 1 })).toBe(
				"1,234.6ページ"
			);
			expect(formatStatValue(0.6789, "percentage", { precision: 1 })).toBe(
				"67.9%"
			);
			expect(formatStatValue(90, "minutes", { compact: true })).toBe("1h30m");
		});
	});
});

describe("generateChartLabels", () => {
	// TDD Red フェーズ: P2優先度テストケース - ラベル生成
	describe("P2: チャートラベル生成テスト", () => {
		test("日付ラベルの生成", () => {
			const dates = ["2024-08-18", "2024-08-19", "2024-08-20"];

			const labels = generateChartLabels(dates, "daily");

			expect(labels).toEqual(["8/18", "8/19", "8/20"]);
		});

		test("週ラベルの生成", () => {
			const weekDates = [
				"2024-08-12", // 月曜日
				"2024-08-19", // 月曜日
				"2024-08-26", // 月曜日
			];

			const labels = generateChartLabels(weekDates, "weekly");

			expect(labels).toEqual(["8/12週", "8/19週", "8/26週"]);
		});

		test("月ラベルの生成", () => {
			const monthDates = ["2024-06-01", "2024-07-01", "2024-08-01"];

			const labels = generateChartLabels(monthDates, "monthly");

			expect(labels).toEqual(["6月", "7月", "8月"]);
		});

		test("年ラベルの生成", () => {
			const yearDates = ["2022-01-01", "2023-01-01", "2024-01-01"];

			const labels = generateChartLabels(yearDates, "yearly");

			expect(labels).toEqual(["2022年", "2023年", "2024年"]);
		});

		test("空の配列の処理", () => {
			const labels = generateChartLabels([], "daily");

			expect(labels).toEqual([]);
		});

		test("無効な日付の処理", () => {
			const invalidDates = ["invalid-date", "2024-08-20", ""];

			const labels = generateChartLabels(invalidDates, "daily");

			expect(labels).toEqual(["無効", "8/20", "無効"]);
		});
	});
});

describe("calculateTrend", () => {
	// TDD Red フェーズ: P2優先度テストケース - トレンド計算
	describe("P2: トレンド計算テスト", () => {
		test("上昇トレンドの計算", () => {
			const data = [10, 15, 20, 25, 30];

			const trend = calculateTrend(data);

			expect(trend.direction).toBe("up");
			expect(trend.slope).toBeCloseTo(5); // 1日あたり5ページ増加
			expect(trend.correlation).toBeCloseTo(1); // 完全な正の相関
			expect(trend.prediction).toBeGreaterThan(30); // 次の値の予測
		});

		test("下降トレンドの計算", () => {
			const data = [50, 40, 30, 20, 10];

			const trend = calculateTrend(data);

			expect(trend.direction).toBe("down");
			expect(trend.slope).toBeCloseTo(-10); // 1日あたり10ページ減少
			expect(trend.correlation).toBeCloseTo(-1); // 完全な負の相関
		});

		test("フラットトレンドの計算", () => {
			const data = [25, 25, 25, 25, 25];

			const trend = calculateTrend(data);

			expect(trend.direction).toBe("stable");
			expect(trend.slope).toBeCloseTo(0);
			expect(trend.correlation).toBeCloseTo(0); // 相関なし
		});

		test("不規則なデータの処理", () => {
			const data = [10, 50, 5, 45, 15];

			const trend = calculateTrend(data);

			expect(trend.direction).toBe("variable");
			expect(Math.abs(trend.correlation)).toBeLessThan(0.5); // 弱い相関
			expect(trend.volatility).toBeGreaterThan(0.5); // 高いボラティリティ
		});

		test("単一データポイントの処理", () => {
			const data = [25];

			const trend = calculateTrend(data);

			expect(trend.direction).toBe("insufficient_data");
			expect(trend.slope).toBe(0);
			expect(trend.correlation).toBe(0);
		});

		test("空データの処理", () => {
			const data: number[] = [];

			const trend = calculateTrend(data);

			expect(trend.direction).toBe("no_data");
			expect(trend.slope).toBe(0);
			expect(trend.correlation).toBe(0);
		});

		test("外れ値を含むデータの処理", () => {
			const data = [20, 22, 24, 26, 1000]; // 最後が外れ値

			const trend = calculateTrend(data, { removeOutliers: true });

			expect(trend.direction).toBe("up");
			expect(trend.slope).toBeCloseTo(2); // 外れ値を除去した傾き
			expect(trend.outliers).toEqual([1000]);
		});

		test("移動平均を使用したトレンド", () => {
			const data = [10, 15, 12, 18, 16, 22, 20, 25];

			const trend = calculateTrend(data, { useMovingAverage: true, window: 3 });

			expect(trend.smoothedData).toHaveLength(6); // 元データより2つ少ない（3点移動平均）
			expect(trend.direction).toBe("up");
		});
	});
});

describe("統合テスト", () => {
	// TDD Red フェーズ: P2優先度テストケース - 統合テスト
	describe("P2: データフロー統合テスト", () => {
		test("統計データからチャート表示までの完全フロー", () => {
			const rawStats = [
				{
					date: "2024-08-18",
					pagesRead: 20,
					readingTime: 30,
					sessionsCount: 1,
				},
				{
					date: "2024-08-19",
					pagesRead: 35,
					readingTime: 50,
					sessionsCount: 2,
				},
				{
					date: "2024-08-20",
					pagesRead: 40,
					readingTime: 60,
					sessionsCount: 2,
				},
			];

			// データ変換
			const chartData = transformStatsForChart(rawStats, "pages", {
				includeTrend: true,
			});

			// トレンド計算
			const trend = calculateTrend(chartData.datasets[0].data as number[]);

			// 統計値フォーマット
			const totalPages = (chartData.datasets[0].data as number[]).reduce(
				(sum, val) => sum + val,
				0
			);
			const formattedTotal = formatStatValue(totalPages, "pages");

			expect(chartData.labels).toHaveLength(3);
			expect(chartData.datasets).toHaveLength(2); // データ + トレンド
			expect(trend.direction).toBe("up");
			expect(formattedTotal).toBe("95ページ");
		});

		test("エラー条件での統合処理", () => {
			const invalidStats = [
				{
					date: "invalid",
					pagesRead: null,
					readingTime: -10,
					sessionsCount: undefined,
				},
			];

			// エラーが発生せず、適切にフォールバック処理される
			expect(() => {
				const chartData = transformStatsForChart(invalidStats as any, "pages");
				const trend = calculateTrend([]);
				const formatted = formatStatValue(null, "pages");

				expect(chartData.datasets[0].data).toEqual([0]);
				expect(trend.direction).toBe("no_data");
				expect(formatted).toBe("0ページ");
			}).not.toThrow();
		});

		test("大量データでのパフォーマンス統合テスト", () => {
			// 10,000データポイントの生成
			const largeStats = [];
			for (let i = 0; i < 10000; i++) {
				largeStats.push({
					date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
						.toISOString()
						.split("T")[0],
					pagesRead: Math.floor(Math.random() * 50),
					readingTime: Math.floor(Math.random() * 120),
					sessionsCount: Math.floor(Math.random() * 3),
				});
			}

			const startTime = Date.now();

			const chartData = transformStatsForChart(largeStats, "pages");
			const trend = calculateTrend(chartData.datasets[0].data as number[]);

			const endTime = Date.now();

			expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
			expect(chartData.datasets[0].data).toHaveLength(10000);
			expect(trend.direction).toBeDefined();
		});
	});
});
