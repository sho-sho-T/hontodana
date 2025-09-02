/**
 * 動的インポート版の読書進捗チャートコンポーネント
 */

"use client";

import dynamic from "next/dynamic";
import type { DailyStats } from "@/lib/utils/stats-formatters";

// Chart.jsを動的インポート（SSR無効、ローディング表示付き）
const ReadingProgressChart = dynamic(
	() =>
		import("./ReadingProgressChart").then((mod) => ({
			default: mod.ReadingProgressChart,
		})),
	{
		loading: () => (
			<div className="w-full h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
					<p className="text-gray-500 text-sm">チャート読み込み中...</p>
				</div>
			</div>
		),
		ssr: false, // Chart.jsはブラウザ環境でのみ動作
	}
);

export interface DynamicReadingProgressChartProps {
	data: DailyStats[];
	type: "pages" | "minutes" | "sessions";
	title?: string;
	height?: number;
	showTrend?: boolean;
	className?: string;
}

export function DynamicReadingProgressChart(
	props: DynamicReadingProgressChartProps
) {
	return <ReadingProgressChart {...props} />;
}
