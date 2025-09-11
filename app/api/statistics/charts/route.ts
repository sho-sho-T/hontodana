import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 読書進捗統計の取得
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const type = searchParams.get("type") || "pages";
		const days = Number.parseInt(searchParams.get("days") || "30");

		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// 読書セッションから日別統計を取得
		const { data: sessions, error: sessionsError } = await supabase
			.from("reading_sessions")
			.select(
				`
				session_date,
				pages_read,
				duration_minutes,
				user_books!inner(user_id)
			`
			)
			.eq("user_books.user_id", user.id)
			.gte(
				"session_date",
				new Date(Date.now() - days * 24 * 60 * 60 * 1000)
					.toISOString()
					.split("T")[0]
			)
			.order("session_date", { ascending: true });

		if (sessionsError) {
			console.error("Error fetching reading sessions:", sessionsError);
			return NextResponse.json(
				{ error: "Failed to fetch reading sessions" },
				{ status: 500 }
			);
		}

		// 日別にデータを集計
		const dailyStats = new Map();

		// 指定された日数分の日付を初期化
		for (let i = 0; i < days; i++) {
			const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
			const dateKey = date.toISOString().split("T")[0];
			dailyStats.set(dateKey, {
				date: dateKey,
				pagesRead: 0,
				readingTime: 0,
				sessionsCount: 0,
			});
		}

		// セッションデータを日別に集計
		sessions?.forEach((session) => {
			const dateKey = session.session_date;
			if (dailyStats.has(dateKey)) {
				const stats = dailyStats.get(dateKey);
				stats.pagesRead += session.pages_read || 0;
				stats.readingTime += session.duration_minutes || 0;
				stats.sessionsCount += 1;
			}
		});

		const chartData = Array.from(dailyStats.values());

		return NextResponse.json({
			data: chartData,
			type,
			success: true,
		});
	} catch (error) {
		console.error("Error in charts API:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
