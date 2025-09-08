"use client";

import { OfflineNotice } from "@/components/offline/OfflineNotice";
import { Library } from "@/components/library/Library";
import { useLibrary } from "../components/LibraryProvider";
import { useRouter } from "next/navigation";

export default function LibraryPage() {
	const { myBooks, handleStatusChange, handleRemoveBook, isLoading } =
		useLibrary();
	const router = useRouter();

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
			<Library
				myBooks={myBooks}
				onStatusChange={handleStatusChange}
				onRemove={handleRemoveBook}
				onSearchClick={() => router.push("/protected/search")}
			/>
		</div>
	);
}