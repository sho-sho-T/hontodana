import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 書籍分布統計の取得
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

		// ユーザーの書籍をステータス別に集計
		const { data: statusDistribution, error: statusError } = await supabase
			.from("user_books")
			.select("status")
			.eq("user_id", user.id);

		if (statusError) {
			console.error("Error fetching book status distribution:", statusError);
			return NextResponse.json(
				{ error: "Failed to fetch book distribution" },
				{ status: 500 }
			);
		}

		// ステータス別に集計
		const statusCounts = statusDistribution.reduce(
			(acc, book) => {
				acc[book.status] = (acc[book.status] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		// チャート用のデータ形式に変換
		const distributionData = [
			{
				label: "読了",
				value: statusCounts.completed || 0,
				color: "#10B981", // emerald-500
			},
			{
				label: "読書中",
				value: statusCounts.reading || 0,
				color: "#3B82F6", // blue-500
			},
			{
				label: "読みたい",
				value: statusCounts.want_to_read || 0,
				color: "#F59E0B", // amber-500
			},
			{
				label: "一時停止",
				value: statusCounts.paused || 0,
				color: "#8B5CF6", // violet-500
			},
			{
				label: "中断",
				value: statusCounts.abandoned || 0,
				color: "#EF4444", // red-500
			},
			{
				label: "参考書",
				value: statusCounts.reference || 0,
				color: "#06B6D4", // cyan-500
			},
		].filter((item) => item.value > 0); // 値が0のものは除外

		// ジャンル別分布も取得
		const { data: genreDistribution, error: genreError } = await supabase
			.from("user_books")
			.select(
				`
				status,
				books!inner(categories)
			`
			)
			.eq("user_id", user.id)
			.eq("status", "completed");

		let genreData: Array<{ label: string; value: number; color: string }> = [];
		if (!genreError && genreDistribution) {
			const genreCounts = new Map<string, number>();

			genreDistribution.forEach((book: any) => {
				if (book.books && Array.isArray(book.books.categories)) {
					book.books.categories.forEach((category: string) => {
						genreCounts.set(category, (genreCounts.get(category) || 0) + 1);
					});
				}
			});

			// 上位5ジャンルを取得
			genreData = Array.from(genreCounts.entries())
				.sort(([, a], [, b]) => b - a)
				.slice(0, 5)
				.map(([genre, count], index) => ({
					label: genre,
					value: count,
					color: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"][index],
				}));
		}

		return NextResponse.json({
			statusDistribution: distributionData,
			genreDistribution: genreData,
			success: true,
		});
	} catch (error) {
		console.error("Error in distribution API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
