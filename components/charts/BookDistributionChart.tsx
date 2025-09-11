/**
 * 書籍分布チャートコンポーネント（ドーナツ/棒グラフ）
 */

"use client";

import React, { useEffect, useRef, useMemo, useCallback } from "react";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	type ChartOptions,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Chart.js の設定
ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend
);

export interface BookDistributionData {
	label: string;
	value: number;
	color?: string;
}

export interface BookDistributionChartProps {
	data: BookDistributionData[];
	type: "doughnut" | "bar";
	title?: string;
	height?: number;
	showLegend?: boolean;
	showPercentage?: boolean;
	className?: string;
	onSegmentClick?: (data: BookDistributionData, index: number) => void;
}

export const BookDistributionChart = React.memo<BookDistributionChartProps>(
	function BookDistributionChart({
		data,
		type,
		title,
		height = 300,
		showLegend = true,
		showPercentage = true,
		className = "",
		onSegmentClick,
	}) {
		const chartRef = useRef<ChartJS<"doughnut" | "bar"> | null>(null);

		// カラーパレット（アクセシブル対応、メモ化）
		const colorPalette = useMemo(
			() => [
				"#3B82F6", // blue-500
				"#10B981", // emerald-500
				"#F59E0B", // amber-500
				"#EF4444", // red-500
				"#8B5CF6", // violet-500
				"#06B6D4", // cyan-500
				"#84CC16", // lime-500
				"#F97316", // orange-500
			],
			[]
		);

		// チャートデータの変換（メモ化最適化）
		const chartData = useMemo(() => {
			if (!data || data.length === 0) return null;

			const labels = data.map((item) => item.label);
			const values = data.map((item) => item.value);
			const colors = data.map(
				(item, index) => item.color || colorPalette[index % colorPalette.length]
			);

			return {
				labels,
				datasets: [
					{
						label: "書籍数",
						data: values,
						backgroundColor: colors,
						borderColor: colors.map((color) => color),
						borderWidth: type === "doughnut" ? 0 : 1,
						hoverBackgroundColor: colors.map((color) => `${color}CC`),
						hoverBorderColor: colors,
						hoverBorderWidth: 2,
					},
				],
			};
		}, [data, type, colorPalette]);

		// データハッシュの計算（深い比較の代替）
		const dataHash = useMemo(() => {
			if (!data) return "";
			return JSON.stringify({
				data: data.slice(0, 5),
				length: data.length,
				type,
			});
		}, [data, type]);

		// 合計値の計算（メモ化最適化）
		const total = useMemo(() => {
			if (!data || data.length === 0) return 0;
			return data.reduce((sum, item) => sum + item.value, 0);
		}, [data]);

		// ラベル生成コールバック
		const generateLabelsCallback = useCallback(
			(chart: any) => {
				const data = chart.data;
				if (data.labels.length && data.datasets.length) {
					return data.labels.map((label: string, i: number) => {
						const value = data.datasets[0].data[i];
						const percentage =
							total > 0 ? Math.round((value / total) * 100) : 0;
						const displayLabel = showPercentage
							? `${label} (${percentage}%)`
							: label;

						return {
							text: displayLabel,
							fillStyle: data.datasets[0].backgroundColor[i],
							strokeStyle: data.datasets[0].borderColor[i],
							lineWidth: data.datasets[0].borderWidth,
							hidden: false,
							index: i,
						};
					});
				}
				return [];
			},
			[total, showPercentage]
		);

		// ツールチップラベルコールバック
		const tooltipLabelCallback = useCallback(
			(context: any) => {
				const value = context.parsed || context.raw;
				const actualValue =
					type === "doughnut" ? value : value.y || value;
				const percentage =
					total > 0 ? Math.round((actualValue / total) * 100) : 0;
				return `${context.label}: ${actualValue}冊 (${percentage}%)`;
			},
			[type, total]
		);

		// クリックハンドラー
		const onClickHandler = useCallback(
			(event: any, elements: any[]) => {
				if (elements.length > 0 && onSegmentClick && data) {
					const index = elements[0].index;
					onSegmentClick(data[index], index);
				}
			},
			[onSegmentClick, data]
		);

		// チャートオプション
		const options = useMemo(() => {
			const baseOptions = {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: showLegend,
						position:
							type === "doughnut" ? ("right" as const) : ("top" as const),
						labels: {
							usePointStyle: true,
							font: {
								size: 12,
							},
							generateLabels: generateLabelsCallback,
						},
					},
					title: {
						display: !!title,
						text: title,
						font: {
							size: 16,
							weight: "bold",
						},
					},
					tooltip: {
						backgroundColor: "rgba(0, 0, 0, 0.8)",
						titleColor: "white",
						bodyColor: "white",
						borderColor: "rgba(255, 255, 255, 0.1)",
						borderWidth: 1,
						cornerRadius: 8,
						displayColors: true,
						callbacks: {
							label: tooltipLabelCallback,
						},
					},
				},
				onClick: onClickHandler,
				animation: {
					duration: 1000,
					easing: "easeInOutQuart",
				},
			};

			// バーチャート固有のオプション
			if (type === "bar") {
				return {
					...baseOptions,
					scales: {
						x: {
							display: true,
							title: {
								display: true,
								text: "カテゴリ",
							},
							grid: {
								display: false,
							},
						},
						y: {
							display: true,
							title: {
								display: true,
								text: "書籍数",
							},
							beginAtZero: true,
							grid: {
								display: true,
								color: "rgba(0, 0, 0, 0.1)",
							},
						},
					},
				};
			}

			// ドーナツチャート固有のオプション
			return {
				...baseOptions,
				cutout: "60%",
				elements: {
					arc: {
						borderWidth: 0,
					},
				},
			};
		}, [
			title,
			type,
			showLegend,
			showPercentage,
			total,
			dataHash,
			generateLabelsCallback,
			tooltipLabelCallback,
			onClickHandler,
		]);

		// アクセシビリティ対応（メモ化）
		const updateAccessibility = useCallback(() => {
			const chart = chartRef.current;
			if (chart?.canvas && data) {
				chart.canvas.setAttribute("role", "img");
				chart.canvas.setAttribute(
					"aria-label",
					`書籍分布チャート: ${title || ""} - ${type}形式のデータ可視化`
				);

				// スクリーンリーダー用の詳細説明
				const description = data
					.map((item) => {
						const percentage =
							total > 0 ? Math.round((item.value / total) * 100) : 0;
						return `${item.label}: ${item.value}冊 (${percentage}%)`;
					})
					.join(", ");

				chart.canvas.setAttribute(
					"aria-describedby",
					`chart-description-${Math.random().toString(36).substr(2, 9)}`
				);
			}
		}, [title, type, data, total]);

		useEffect(() => {
			updateAccessibility();
		}, [updateAccessibility]);

		// 空データコンポーネント（メモ化）
		const EmptyState = useMemo(
			() => (
				<Card className={`p-6 ${className}`}>
					<div className="flex flex-col items-center justify-center h-64 text-gray-500">
						<svg
							className="w-12 h-12 mb-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
							/>
						</svg>
						<p className="text-sm font-medium">表示するデータがありません</p>
						<p className="text-xs mt-1">書籍を追加すると分布が表示されます</p>
					</div>
				</Card>
			),
			[className]
		);

		// データが空の場合
		if (!data || data.length === 0 || total === 0 || !chartData) {
			return EmptyState;
		}

		return (
			<Card className={`p-6 ${className}`}>
				<div style={{ height: `${height}px` }} className="relative">
					{type === "doughnut" ? (
						<>
							<Doughnut
								ref={chartRef as any}
								data={chartData}
								options={options as ChartOptions<"doughnut">}
							/>
							{/* 中央の合計表示 */}
							<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
								<div className="text-center">
									<div className="text-2xl font-bold text-gray-900">
										{total}
									</div>
									<div className="text-sm text-gray-600">冊</div>
								</div>
							</div>
						</>
					) : (
						<Bar
							ref={chartRef as any}
							data={chartData}
							options={options as ChartOptions<"bar">}
						/>
					)}
				</div>

				{/* 詳細統計表示（メモ化） */}
				{showPercentage && (
					<div className="mt-4 space-y-2">
						<h4 className="text-sm font-medium text-gray-700">詳細統計</h4>
						<div className="grid grid-cols-2 gap-2 text-xs">
							{data.map((item, index) => {
								const percentage =
									total > 0 ? Math.round((item.value / total) * 100) : 0;
								return (
									<div
										key={`${item.label}-${index}`}
										className="flex items-center space-x-2"
									>
										<div
											className="w-3 h-3 rounded-full"
											style={{
												backgroundColor:
													item.color ||
													colorPalette[index % colorPalette.length],
											}}
											aria-hidden="true"
										/>
										<span className="text-gray-600">{item.label}</span>
										<span className="font-medium">
											{item.value}冊 ({percentage}%)
										</span>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</Card>
		);
	}
);