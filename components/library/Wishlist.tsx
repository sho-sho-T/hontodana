"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { WishlistCardList } from "@/components/wishlist/WishlistCardList";
import type { WishlistItemWithBook } from "@/lib/models/wishlist";

interface WishlistProps {
	wishlist: WishlistItemWithBook[];
	onPriorityChange: (id: string, newPriority: string) => Promise<void>;
	onMoveToLibrary: (id: string) => Promise<void>;
	onRemove: (id: string) => Promise<void>;
	onSearchClick: () => void;
}

export function Wishlist({
	wishlist,
	onPriorityChange,
	onMoveToLibrary,
	onRemove,
	onSearchClick,
}: WishlistProps) {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>💝 ウィッシュリスト</CardTitle>
					<CardDescription>
						読みたい本のリスト ({wishlist.length}件)
					</CardDescription>
				</CardHeader>
				<CardContent>
					{wishlist.length > 0 ? (
						<WishlistCardList
							items={wishlist}
							onPriorityChange={onPriorityChange}
							onMoveToLibrary={onMoveToLibrary}
							onRemove={onRemove}
						/>
					) : (
						<div className="text-center py-12">
							<p className="text-gray-500 mb-4">ウィッシュリストは空です</p>
							<Button onClick={onSearchClick}>書籍を検索する</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
