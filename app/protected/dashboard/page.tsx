"use client";

import { OfflineNotice } from "@/components/offline/OfflineNotice";
import { Dashboard } from "@/components/library/Dashboard";
import { useLibrary } from "../components/LibraryProvider";
import { ReadingDashboard } from "@/components/dashboard/ReadingDashboard";
import { ReadingProgressChart } from "@/components/charts/ReadingProgressChart";
import { BookDistributionChart } from "@/components/charts/BookDistributionChart";
import { RatingStatsCard } from "@/components/rating/RatingStatsCard";

export default function DashboardPage() {
	const { myBooks, stats, isLoading } = useLibrary();

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
					<ReadingProgressChart
						data={[]} // 実際のデータを渡す
						type="pages"
						title="ページ数の推移"
						height={300}
						showTrend={true}
					/>
				</div>
				
				{/* 書籍分布チャート */}
				<div className="bg-white p-6 rounded-lg shadow">
					<h3 className="text-lg font-semibold mb-4">書籍分布</h3>
					<BookDistributionChart
						data={[]} // 実際のデータを渡す
						type="doughnut"
						title="読書ステータス別分布"
						height={300}
					/>
				</div>
			</div>
			
			{/* 評価統計カード */}
			<div className="mt-6">
				<RatingStatsCard 
					stats={{
						averageRating: stats.averageRating || 0,
						totalRated: 0,
						totalBooks: stats.totalBooks || 0,
						distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
						reviewsCount: 0
					}}
					className="bg-white rounded-lg shadow"
				/>
			</div>
		</div>
	);
}