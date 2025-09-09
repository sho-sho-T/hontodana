"use client";

import { OfflineNotice } from "@/components/offline/OfflineNotice";
import { Search } from "@/components/library/Search";
import { useLibrary } from "../components/LibraryProvider";

export default function SearchPage() {
	const { searchResults, isSearching, handleSearch, handleAddToLibrary, handleAddToWishlist } =
		useLibrary();

	return (
		<div className="space-y-6">
			<OfflineNotice />
			<Search
				searchResults={searchResults}
				isSearching={isSearching}
				onSearch={handleSearch}
				onAddToLibrary={handleAddToLibrary}
				onAddToWishlist={handleAddToWishlist}
			/>
		</div>
	);
}