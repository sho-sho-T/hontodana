"use client";

import { OfflineNotice } from "@/components/offline/OfflineNotice";
import { Dashboard } from "@/components/library/Dashboard";
import { useLibrary } from "../components/LibraryProvider";
import { ReadingDashboard } from "@/components/dashboard/ReadingDashboard";
import { ReadingProgressChart } from "@/components/charts/ReadingProgressChart";
import { BookDistributionChart } from "@/components/charts/BookDistributionChart";
import { RatingStatsCard } from "@/components/rating/RatingStatsCard";
import { useEffect, useState } from "react";

interface ChartData {
	date: string;
	pagesRead: number;
	readingTime: number;
	sessionsCount: number;
}

interface DistributionData {
	label: string;
	value: number;
	color: string;
}

interface RatingStats {
	averageRating: number;
	totalRated: number;
	totalBooks: number;
	distribution: Record<1 | 2 | 3 | 4 | 5, number>;
	reviewsCount: number;
}

export default function DashboardPage() {
	const { myBooks, stats, isLoading } = useLibrary();
	const [chartData, setChartData] = useState<ChartData[]>([]);
	const [distributionData, setDistributionData] = useState<DistributionData[]>([]);
	const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
	const [statsLoading, setStatsLoading] = useState(true);

	// 統計データを取得
	useEffect(() => {
		const fetchStatistics = async () => {
			try {
				setStatsLoading(true);
				
				// 並列でAPIを呼び出し
				const [chartsRes, distributionRes, ratingsRes] = await Promise.all([
					fetch('/api/statistics/charts?type=pages&days=30'),
					fetch('/api/statistics/distribution'),
					fetch('/api/statistics/ratings'),
				]);

				if (chartsRes.ok) {
					const chartsData = await chartsRes.json();
					setChartData(chartsData.data || []);
				}

				if (distributionRes.ok) {
					const distData = await distributionRes.json();
					setDistributionData(distData.statusDistribution || []);
				}

				if (ratingsRes.ok) {
					const ratingsData = await ratingsRes.json();
					setRatingStats(ratingsData.stats);
				}
			} catch (error) {
				console.error('統計データの取得に失敗しました:', error);
			} finally {
				setStatsLoading(false);
			}
		};

		if (!isLoading) {
			fetchStatistics();
		}
	}, [isLoading]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
					<p className="mt-4 text-gray-600">データを読み込んでいます...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<OfflineNotice />
			
			{/* 基本的な統計サマリー */}
			<Dashboard myBooks={myBooks} stats={stats} />
			
			{/* 詳細な読書分析ダッシュボード */}
			<div className="mt-8">
				<h2 className="text-2xl font-bold text-gray-900 mb-6">読書分析</h2>
				<ReadingDashboard userId="current-user" />
			</div>
			
			{/* チャートセクション */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
				{/* 読書進捗チャート */}
				<div className="bg-white p-6 rounded-lg shadow">
					<h3 className="text-lg font-semibold mb-4">読書進捗</h3>
					{statsLoading ? (
						<div className="flex items-center justify-center h-[300px]">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
						</div>
					) : (
						<ReadingProgressChart
							data={chartData}
							type="pages"
							title="ページ数の推移"
							height={300}
							showTrend={true}
						/>
					)}
				</div>
				
				{/* 書籍分布チャート */}
				<div className="bg-white p-6 rounded-lg shadow">
					<h3 className="text-lg font-semibold mb-4">書籍分布</h3>
					{statsLoading ? (
						<div className="flex items-center justify-center h-[300px]">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
						</div>
					) : (
						<BookDistributionChart
							data={distributionData}
							type="doughnut"
							title="読書ステータス別分布"
							height={300}
						/>
					)}
				</div>
			</div>
			
			{/* 評価統計カード */}
			{ratingStats && (
				<div className="mt-6">
					<RatingStatsCard 
						stats={ratingStats}
						className="bg-white rounded-lg shadow"
					/>
				</div>
			)}
		</div>
	);
}