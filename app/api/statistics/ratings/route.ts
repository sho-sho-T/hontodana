import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 評価統計の取得
export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// ユーザーの評価データを取得
		const { data: ratedBooks, error: ratingsError } = await supabase
			.from("user_books")
			.select("rating, review")
			.eq("user_id", user.id)
			.not("rating", "is", null);

		if (ratingsError) {
			console.error("Error fetching ratings:", ratingsError);
			return NextResponse.json(
				{ error: "Failed to fetch ratings" },
				{ status: 500 }
			);
		}

		// 全書籍数を取得
		const { count: totalBooks, error: countError } = await supabase
			.from("user_books")
			.select("*", { count: "exact", head: true })
			.eq("user_id", user.id);

		if (countError) {
			console.error("Error fetching total books count:", countError);
			return NextResponse.json(
				{ error: "Failed to fetch book count" },
				{ status: 500 }
			);
		}

		// 評価分布を計算
		const ratingDistribution = ratedBooks.reduce(
			(acc, book) => {
				if (book.rating) {
					acc[book.rating as 1 | 2 | 3 | 4 | 5] += 1;
				}
				return acc;
			},
			{ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>
		);

		// 平均評価を計算
		const averageRating =
			ratedBooks.length > 0
				? ratedBooks.reduce((sum, book) => sum + (book.rating || 0), 0) /
					ratedBooks.length
				: 0;

		// レビュー数を計算
		const reviewsCount = ratedBooks.filter(
			(book) => book.review && book.review.trim().length > 0
		).length;

		const ratingStats = {
			averageRating: Math.round(averageRating * 10) / 10, // 小数点1桁まで
			totalRated: ratedBooks.length,
			totalBooks: totalBooks || 0,
			distribution: ratingDistribution,
			reviewsCount,
		};

		return NextResponse.json({
			stats: ratingStats,
			success: true,
		});
	} catch (error) {
		console.error("Error in ratings API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
