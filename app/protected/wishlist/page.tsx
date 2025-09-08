"use client";

import { OfflineNotice } from "@/components/offline/OfflineNotice";
import { Wishlist } from "@/components/library/Wishlist";
import { useLibrary } from "../components/LibraryProvider";
import { useRouter } from "next/navigation";

export default function WishlistPage() {
	const {
		wishlist,
		handleWishlistPriorityChange,
		handleMoveToLibrary,
		handleRemoveFromWishlist,
		isLoading,
	} = useLibrary();
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
			<Wishlist
				wishlist={wishlist}
				onPriorityChange={handleWishlistPriorityChange}
				onMoveToLibrary={handleMoveToLibrary}
				onRemove={handleRemoveFromWishlist}
				onSearchClick={() => router.push("/protected/search")}
			/>
		</div>
	);
}