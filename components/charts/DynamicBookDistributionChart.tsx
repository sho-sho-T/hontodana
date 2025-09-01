/**
 * 動的インポート版の書籍分布チャートコンポーネント
 */

"use client";

import dynamic from "next/dynamic";

// Chart.jsを動的インポート（SSR無効、ローディング表示付き）
const BookDistributionChart = dynamic(
	() =>
		import("./BookDistributionChart").then((mod) => ({
			default: mod.BookDistributionChart,
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

export interface DynamicBookDistributionChartProps {
	data: {
		labels: string[];
		values: number[];
	};
	type: "doughnut" | "bar";
	title?: string;
	height?: number;
	onChartTypeChange?: (type: "doughnut" | "bar") => void;
	showTypeToggle?: boolean;
	colors?: string[];
}

export function DynamicBookDistributionChart(
	props: DynamicBookDistributionChartProps
) {
	return <BookDistributionChart {...props} />;
}
