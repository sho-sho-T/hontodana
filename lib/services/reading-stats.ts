/**
 * 読書統計サービス
 */

import { prisma } from "@/lib/prisma";
import type {
	ReadingStats,
	ReadingStatsOptions,
	DailyStats,
	WeeklyStats,
	ReadingSpeed,
	MonthlyStats,
} from "@/lib/models/reading-progress";
import { createHash } from "crypto";
import { memo } from "react";
import { useMemo } from "react";

// キャッシュ用のメモリストア（本番環境ではRedisを推奨）
const statsCache = new Map<
	string,
	{ data: any; timestamp: number; ttl: number }
>();
const CACHE_TTL = {
	READING_STATS: 5 * 60 * 1000, // 5分
	READING_SPEED: 10 * 60 * 1000, // 10分
	MONTHLY_STATS: 60 * 60 * 1000, // 1時間
};

/**
 * キャッシュキーの生成
 */
function generateCacheKey(
	prefix: string,
	userId: string,
	options?: any
): string {
	const optionsStr = options ? JSON.stringify(options) : "";
	return `${prefix}:${userId}:${createHash("md5").update(optionsStr).digest("hex")}`;
}

/**
 * キャッシュからデータを取得
 */
function getCachedData<T>(key: string): T | null {
	const cached = statsCache.get(key);
	if (cached && Date.now() - cached.timestamp < cached.ttl) {
		return cached.data as T;
	}
	statsCache.delete(key);
	return null;
}

/**
 * データをキャッシュに保存
 */
function setCachedData<T>(key: string, data: T, ttl: number): void {
	statsCache.set(key, {
		data,
		timestamp: Date.now(),
		ttl,
	});
}

/**
 * 共通のページ数計算ロジック (メモ化対応)
 */
const calculatePagesRead = (() => {
	const cache = new WeakMap<object, number>();

	return (session: any): number => {
		if (cache.has(session)) {
			return cache.get(session)!;
		}

		const pagesRead =
			session.pagesRead || Math.max(0, session.endPage - session.startPage + 1);
		cache.set(session, pagesRead);
		return pagesRead;
	};
})();

/**
 * セッションの有効性チェック (メモ化対応)
 */
const isValidSession = (() => {
	const cache = new WeakMap<object, boolean>();

	return (session: any): boolean => {
		if (cache.has(session)) {
			return cache.get(session)!;
		}

		const pagesRead = calculatePagesRead(session);
		const durationMinutes = session.durationMinutes || 0;

		const isValid =
			pagesRead > 0 &&
			durationMinutes >= 0 &&
			session.endPage >= session.startPage &&
			pagesRead <= 1000 && // 異常値チェック：1000ページ以上は除外
			durationMinutes <= 24 * 60; // 異常値チェック：24時間以上は除外

		cache.set(session, isValid);
		return isValid;
	};
})();

/**
 * 統計値の安全な計算（NaN、Infinity対策）
 */
function safeCalculate(
	numerator: number,
	denominator: number,
	precision = 1
): number {
	if (denominator === 0 || !isFinite(numerator) || !isFinite(denominator)) {
		return 0;
	}
	const result = numerator / denominator;
	return Math.round(result * Math.pow(10, precision)) / Math.pow(10, precision);
}

/**
 * 読書統計を生成
 */
export async function generateReadingStats(
	userId: string,
	options: ReadingStatsOptions = {}
): Promise<ReadingStats> {
	// キャッシュチェック
	const cacheKey = generateCacheKey("reading-stats", userId, options);
	const cachedResult = getCachedData<ReadingStats>(cacheKey);
	if (cachedResult) {
		return cachedResult;
	}

	try {
		// 効率的なデータ取得
		const [
			sessionsData,
			completedBooks,
			booksInProgress,
			// 統計用集計データ
			sessionStats,
		] = await Promise.all([
			// 全セッションデータ（最新順）
			prisma.readingSession.findMany({
				where: {
					userBook: { userId },
				},
				select: {
					id: true,
					startPage: true,
					endPage: true,
					pagesRead: true,
					sessionDate: true,
					durationMinutes: true,
					userBook: {
						select: {
							book: {
								select: {
									pageCount: true,
								},
							},
						},
					},
				},
				orderBy: {
					sessionDate: "desc",
				},
			}),

			// 完読書籍
			prisma.userBook.findMany({
				where: {
					userId,
					status: "completed",
				},
				select: {
					book: {
						select: {
							pageCount: true,
						},
					},
				},
			}),

			// 読書中書籍数
			prisma.userBook.count({
				where: {
					userId,
					status: "reading",
				},
			}),

			// 統計集計
			prisma.readingSession.groupBy({
				by: ["userBookId"],
				where: {
					userBook: { userId },
				},
				_sum: {
					durationMinutes: true,
					pagesRead: true,
				},
				_count: {
					id: true,
				},
			}),
		]);

		// 有効なセッションデータをフィルタリング（最適化）
		const validSessions = (sessionsData || []).filter(isValidSession);

		// 基本統計計算（最適化 - reduce使用でより関数型的に）
		const { totalReadingTime, totalPagesRead } = validSessions.reduce(
			(acc, session) => ({
				totalReadingTime: acc.totalReadingTime + (session.durationMinutes || 0),
				totalPagesRead: acc.totalPagesRead + calculatePagesRead(session),
			}),
			{ totalReadingTime: 0, totalPagesRead: 0 }
		);

		const averageSessionTime = safeCalculate(
			totalReadingTime,
			validSessions.length,
			0
		);
		const averagePagesPerSession = safeCalculate(
			totalPagesRead,
			validSessions.length,
			1
		);

		// 完読書籍統計（最適化）
		const safeCompletedBooks = completedBooks || [];
		const totalCompletedPages = safeCompletedBooks.reduce(
			(sum, book) => sum + (book.book.pageCount || 0),
			0
		);

		const averageBookLength = safeCalculate(
			totalCompletedPages,
			safeCompletedBooks.length,
			0
		);

		// 日別統計生成
		const dailyStats = validSessions.length > 0 
			? generateDailyStats(validSessions, options.days || 7)
			: [];

		// 週別統計生成
		const weeklyStats = validSessions.length > 0 
			? generateWeeklyStats(validSessions, options.weeks || 4)
			: [];

		// 読書ペース計算（最適化）
		const last7DaysPages = dailyStats
			.slice(0, 7)
			.reduce((sum, day) => sum + day.pagesRead, 0);
		const last30DaysStats = generateDailyStats(validSessions, 30);
		const last30DaysPages = last30DaysStats.reduce(
			(sum, day) => sum + day.pagesRead,
			0
		);

		const readingPace = {
			last7Days: safeCalculate(last7DaysPages, 7, 1),
			last30Days: safeCalculate(last30DaysPages, 30, 1),
		};

		// 読書の一貫性計算（簡易版）
		const readingConsistency = calculateReadingConsistency(dailyStats);

		const result = {
			totalReadingTime,
			averageSessionTime,
			totalPagesRead,
			averagePagesPerSession,
			averagePagesPerDay: readingPace.last7Days,
			booksCompleted: safeCompletedBooks.length,
			totalCompletedPages,
			averageBookLength,
			booksInProgress: booksInProgress || 0,
			dailyStats,
			weeklyStats,
			readingPace,
			readingConsistency,
		};

		// 結果をキャッシュに保存
		setCachedData(cacheKey, result, CACHE_TTL.READING_STATS);
		return result;
	} catch (error) {
		// 構造化ログ出力（本番環境考慮）と詳細なエラー処理
		const errorDetails = {
			timestamp: new Date().toISOString(),
			userId,
			options,
			requestId: generateRequestId(),
			error:
				error instanceof Error
					? {
							message: error.message,
							name: error.name,
							code: (error as any).code,
							errno: (error as any).errno,
							stack: error.stack?.split("\n").slice(0, 5), // スタックトレースを5行に制限
						}
					: { message: "Unknown error", error },
		};

		console.error("Error generating reading stats:", errorDetails);

		// エラータイプ別処理
		if (error instanceof Error) {
			// データベース接続エラー
			if (
				error.message.includes("connect") ||
				error.message.includes("ECONNREFUSED") ||
				error.message.includes("timeout")
			) {
				console.error("Database connection error detected:", errorDetails);
				// アラート送信やメトリクス記録をここで行う
			}

			// メモリ不足エラー
			if (
				error.message.includes("out of memory") ||
				error.message.includes("heap")
			) {
				console.error("Memory error detected:", errorDetails);
				// メモリ使用量の監視アラート
			}

			// 権限エラー
			if (
				error.message.includes("permission") ||
				error.message.includes("unauthorized")
			) {
				console.warn("Permission error in stats generation:", errorDetails);
			}
		}

		// エラー時はデフォルト値を返す（関数で抽出）
		const defaultStats = getDefaultReadingStats();

		// エラー時もキャッシュして過度なリクエストを防ぐ（短時間）
		setCachedData(cacheKey, defaultStats, 60 * 1000); // 1分
		return defaultStats;
	}

	// リクエストID生成（統計サービス用）
	function generateRequestId(): string {
		return `stats-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
}

/**
 * 日別統計を生成（エクスポート - メモ化対応）
 */
export const generateDailyStats = (() => {
	const cache = new Map<string, DailyStats[]>();

	return (sessionsData: any[], days: number): DailyStats[] => {
		// キャッシュキー生成（データのハッシュ + 日数）
		const dataHash = createHash("md5")
			.update(JSON.stringify(sessionsData.map((s) => s.id)))
			.digest("hex");
		const cacheKey = `${dataHash}-${days}`;

		if (cache.has(cacheKey)) {
			return cache.get(cacheKey)!;
		}

		const stats: DailyStats[] = [];

		// 日付生成を最適化
		const dates = Array.from({ length: days }, (_, i) => {
			const date = new Date();
			date.setDate(date.getDate() - i);
			return {
				date: date,
				dateStr: date.toISOString().split("T")[0],
			};
		});

		for (const { dateStr } of dates) {
			const daySessions = sessionsData.filter(
				(session) => session.sessionDate.toISOString().split("T")[0] === dateStr
			);

			// reduceで統計計算を最適化
			const { dayPagesRead, dayReadingTime } = daySessions.reduce(
				(acc, session) => ({
					dayPagesRead: acc.dayPagesRead + calculatePagesRead(session),
					dayReadingTime: acc.dayReadingTime + (session.durationMinutes || 0),
				}),
				{ dayPagesRead: 0, dayReadingTime: 0 }
			);

			stats.push({
				date: dateStr,
				pagesRead: dayPagesRead,
				readingTime: dayReadingTime,
				sessionsCount: daySessions.length,
			});
		}

		// 結果をキャッシュ（最大100エントリ）
		if (cache.size >= 100) {
			const firstKey = cache.keys().next().value;
			if (firstKey !== undefined) {
				cache.delete(firstKey);
			}
		}
		cache.set(cacheKey, stats);

		return stats;
	};
})();

/**
 * 週別統計を生成（メモ化対応）
 */
const generateWeeklyStats = (() => {
	const cache = new Map<string, WeeklyStats[]>();

	return (sessionsData: any[], weeks: number): WeeklyStats[] => {
		// キャッシュキー生成
		const dataHash = createHash("md5")
			.update(JSON.stringify(sessionsData.map((s) => s.id)))
			.digest("hex");
		const cacheKey = `${dataHash}-${weeks}`;

		if (cache.has(cacheKey)) {
			return cache.get(cacheKey)!;
		}

		const stats: WeeklyStats[] = [];

		for (let i = 0; i < weeks; i++) {
			const weekStart = new Date();
			weekStart.setDate(weekStart.getDate() - i * 7);
			const weekEnd = new Date(weekStart);
			weekEnd.setDate(weekEnd.getDate() + 6);

			const weekSessions = sessionsData.filter((session) => {
				const sessionDate = session.sessionDate;
				return sessionDate >= weekStart && sessionDate <= weekEnd;
			});

			// reduceで統計計算を最適化
			const { weekPagesRead, weekReadingTime } = weekSessions.reduce(
				(acc, session) => ({
					weekPagesRead: acc.weekPagesRead + calculatePagesRead(session),
					weekReadingTime: acc.weekReadingTime + (session.durationMinutes || 0),
				}),
				{ weekPagesRead: 0, weekReadingTime: 0 }
			);

			stats.push({
				weekStart: weekStart.toISOString().split("T")[0],
				pagesRead: weekPagesRead,
				readingTime: weekReadingTime,
				sessionsCount: weekSessions.length,
				booksCompleted: 0, // 簡易版では0
			});
		}

		// 結果をキャッシュ（最大50エントリ）
		if (cache.size >= 50) {
			const firstKey = cache.keys().next().value;
			if (firstKey !== undefined) {
				cache.delete(firstKey);
			}
		}
		cache.set(cacheKey, stats);

		return stats;
	};
})();

/**
 * 読書の一貫性を計算（0-1）、最適化
 */
function calculateReadingConsistency(dailyStats: DailyStats[]): number {
	if (dailyStats.length === 0) return 0;

	const activeDays = dailyStats.filter((day) => day.pagesRead > 0).length;
	return safeCalculate(activeDays, dailyStats.length, 2);
}

/**
 * キャッシュをクリア（メンテナンス用）
 */
export function clearStatsCache(userId?: string): void {
	if (userId) {
		// 特定ユーザーのキャッシュをクリア
		for (const [key] of statsCache) {
			if (key.includes(userId)) {
				statsCache.delete(key);
			}
		}
	} else {
		// 全キャッシュをクリア
		statsCache.clear();
	}
}

/**
 * デフォルト統計データ生成
 */
function getDefaultReadingStats(): ReadingStats {
	return {
		totalReadingTime: 0,
		averageSessionTime: 0,
		totalPagesRead: 0,
		averagePagesPerSession: 0,
		averagePagesPerDay: 0,
		booksCompleted: 0,
		totalCompletedPages: 0,
		averageBookLength: 0,
		booksInProgress: 0,
		dailyStats: [],
		weeklyStats: [],
		readingPace: {
			last7Days: 0,
			last30Days: 0,
		},
		readingConsistency: 0,
	};
}

/**
 * キャッシュ統計情報を取得（デバッグ用）
 */
export function getCacheStats(): {
	size: number;
	keys: string[];
	memory: string;
} {
	const roughSizeOfObject = (object: any): number => {
		const objectList: any[] = [];
		const stack = [object];
		let bytes = 0;

		while (stack.length) {
			const value = stack.pop();

			if (typeof value === "boolean") {
				bytes += 4;
			} else if (typeof value === "string") {
				bytes += value.length * 2;
			} else if (typeof value === "number") {
				bytes += 8;
			} else if (
				typeof value === "object" &&
				objectList.indexOf(value) === -1
			) {
				objectList.push(value);

				for (const prop in value) {
					stack.push(value[prop]);
				}
			}
		}

		return bytes;
	};

	const totalSize = Array.from(statsCache.values()).reduce(
		(acc, cached) => acc + roughSizeOfObject(cached.data),
		0
	);

	return {
		size: statsCache.size,
		keys: Array.from(statsCache.keys()),
		memory: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
	};
}

/**
 * 読書速度を計算
 */
export async function calculateReadingSpeed(
	userId: string
): Promise<ReadingSpeed> {
	// キャッシュチェック
	const cacheKey = generateCacheKey("reading-speed", userId);
	const cachedResult = getCachedData<ReadingSpeed>(cacheKey);
	if (cachedResult) {
		return cachedResult;
	}

	try {
		const sessionsData = await prisma.readingSession.findMany({
			where: {
				userBook: { userId },
				durationMinutes: { gt: 0 }, // 時間が記録されているセッションのみ
			},
			select: {
				startPage: true,
				endPage: true,
				pagesRead: true,
				durationMinutes: true,
			},
		});

		if (sessionsData.length === 0) {
			const defaultResult = {
				averageSpeed: 0,
				minSpeed: 0,
				maxSpeed: 0,
				validSessions: 0,
				outliers: [],
			};

			setCachedData(cacheKey, defaultResult, CACHE_TTL.READING_SPEED);
			return defaultResult;
		}

		// 読書速度を計算（ページ/分）、最適化
		const speeds: number[] = [];

		for (const session of sessionsData) {
			const pages = calculatePagesRead(session);
			const minutes = session.durationMinutes || 1;
			const speed = pages / minutes;

			// 異常値チェックとフィルタリング
			if (speed > 0 && speed < 50 && isFinite(speed)) {
				// 50ページ/分以上は異常値
				speeds.push(speed);
			}
		}

		if (speeds.length === 0) {
			const defaultResult = {
				averageSpeed: 0,
				minSpeed: 0,
				maxSpeed: 0,
				validSessions: 0,
				outliers: [],
			};

			setCachedData(cacheKey, defaultResult, CACHE_TTL.READING_SPEED);
			return defaultResult;
		}

		// 異常値検出（改善版: 四分位数ベース）
		const sortedSpeeds = [...speeds].sort((a, b) => a - b);
		const q1 = sortedSpeeds[Math.floor(sortedSpeeds.length * 0.25)];
		const q3 = sortedSpeeds[Math.floor(sortedSpeeds.length * 0.75)];
		const iqr = q3 - q1;
		const lowerBound = q1 - 1.5 * iqr;
		const upperBound = q3 + 1.5 * iqr;

		const outliers = speeds.filter(
			(speed) => speed < lowerBound || speed > upperBound
		);
		const validSpeeds = speeds.filter(
			(speed) => speed >= lowerBound && speed <= upperBound
		);

		if (validSpeeds.length === 0) {
			const defaultResult = {
				averageSpeed: 0,
				minSpeed: 0,
				maxSpeed: 0,
				validSessions: 0,
				outliers,
			};

			setCachedData(cacheKey, defaultResult, CACHE_TTL.READING_SPEED);
			return defaultResult;
		}

		const result = {
			averageSpeed: safeCalculate(
				validSpeeds.reduce((sum, speed) => sum + speed, 0),
				validSpeeds.length,
				2
			),
			minSpeed: validSpeeds.length > 0 ? Math.min(...validSpeeds) : 0,
			maxSpeed: validSpeeds.length > 0 ? Math.max(...validSpeeds) : 0,
			validSessions: validSpeeds.length,
			outliers,
		};

		// 結果をキャッシュに保存
		setCachedData(cacheKey, result, CACHE_TTL.READING_SPEED);
		return result;
	} catch (error) {
		console.error("Error calculating reading speed:", {
			userId,
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});

		const defaultResult = {
			averageSpeed: 0,
			minSpeed: 0,
			maxSpeed: 0,
			validSessions: 0,
			outliers: [],
		};

		// エラー時も短時間キャッシュ
		setCachedData(
			generateCacheKey("reading-speed", userId),
			defaultResult,
			60 * 1000
		);
		return defaultResult;
	}
}

/**
 * 月別統計を生成（最適化）
 */
export async function generateMonthlyStats(
	userId: string,
	months: number
): Promise<MonthlyStats[]> {
	// キャッシュチェック
	const cacheKey = generateCacheKey("monthly-stats", userId, { months });
	const cachedResult = getCachedData<MonthlyStats[]>(cacheKey);
	if (cachedResult) {
		return cachedResult;
	}

	try {
		// 期間範囲を事前計算
		const dateRanges = Array.from({ length: months }, (_, i) => {
			const monthStart = new Date();
			monthStart.setMonth(monthStart.getMonth() - i);
			monthStart.setDate(1);
			monthStart.setHours(0, 0, 0, 0);

			const monthEnd = new Date(monthStart);
			monthEnd.setMonth(monthEnd.getMonth() + 1);
			monthEnd.setDate(0);
			monthEnd.setHours(23, 59, 59, 999);

			return {
				start: monthStart,
				end: monthEnd,
				key: monthStart.toISOString().substring(0, 7), // YYYY-MM
			};
		});

		// 全期間のセッションを一括取得（N+1問題回避）
		const allMonthSessions = await prisma.readingSession.findMany({
			where: {
				userBook: { userId },
				sessionDate: {
					gte: dateRanges[dateRanges.length - 1].start,
					lte: dateRanges[0].end,
				},
			},
			select: {
				startPage: true,
				endPage: true,
				pagesRead: true,
				durationMinutes: true,
				sessionDate: true,
			},
		});

		const stats: MonthlyStats[] = [];

		for (const range of dateRanges) {
			// 該当月のセッションをフィルタリング
			const monthSessions = allMonthSessions.filter(
				(session) =>
					session.sessionDate >= range.start && session.sessionDate <= range.end
			);

			// reduceで統計計算を最適化
			const { monthPagesRead, monthReadingTime } = monthSessions.reduce(
				(acc, session) => ({
					monthPagesRead: acc.monthPagesRead + calculatePagesRead(session),
					monthReadingTime:
						acc.monthReadingTime + (session.durationMinutes || 0),
				}),
				{ monthPagesRead: 0, monthReadingTime: 0 }
			);

			stats.push({
				month: range.key,
				pagesRead: monthPagesRead,
				readingTime: monthReadingTime,
				sessionsCount: monthSessions.length,
				booksCompleted: 0, // 簡易版では0
			});
		}

		// 結果をキャッシュに保存
		setCachedData(cacheKey, stats, CACHE_TTL.MONTHLY_STATS);
		return stats;
	} catch (error) {
		// 構造化エラーログ
		const errorDetails = {
			timestamp: new Date().toISOString(),
			userId,
			months,
			error:
				error instanceof Error
					? {
							message: error.message,
							name: error.name,
							stack: error.stack?.split("\n").slice(0, 5),
						}
					: { message: "Unknown error", error },
		};

		console.error("Error generating monthly stats:", errorDetails);

		const defaultStats = Array(months)
			.fill(null)
			.map((_, i) => {
				const monthStart = new Date();
				monthStart.setMonth(monthStart.getMonth() - i);
				return {
					month: monthStart.toISOString().substring(0, 7),
					pagesRead: 0,
					readingTime: 0,
					sessionsCount: 0,
					booksCompleted: 0,
				};
			});

		// エラー時も短時間キャッシュ
		setCachedData(cacheKey, defaultStats, 60 * 1000);
		return defaultStats;
	}
}
