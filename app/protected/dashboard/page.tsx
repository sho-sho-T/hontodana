"use client";

import { OfflineNotice } from "@/components/offline/OfflineNotice";
import { Dashboard } from "@/components/library/Dashboard";
import { useLibrary } from "../components/LibraryProvider";

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
			<Dashboard myBooks={myBooks} stats={stats} />
		</div>
	);
}