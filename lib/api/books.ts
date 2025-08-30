import { ErrorType } from "@/lib/errors/app-error";

export interface SearchBooksResult {
	success: boolean;
	data?: any[];
	error?: {
		type: ErrorType;
		code: string;
		message: string;
		context?: Record<string, unknown>;
	};
}

export interface SearchBooksOptions {
	maxResults?: number;
}

export async function searchBooks(
	query: string,
	options: SearchBooksOptions = {}
): Promise<SearchBooksResult> {
	return await retryWithBackoff(async () => {
		const startTime = Date.now();

		try {
			const response = await fetch(
				`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`
			);

			if (!response.ok) {
				return handleHttpError(response, query, options, startTime);
			}

			const data = await response.json();
			return { success: true, data: data.items || [] };
		} catch (error) {
			return handleFetchError(error, query, options, startTime);
		}
	}, 3); // Retry up to 3 times
}

async function retryWithBackoff<_T>(
	operation: () => Promise<SearchBooksResult>,
	maxRetries: number,
	currentRetry = 0
): Promise<SearchBooksResult> {
	const result = await operation();

	// If successful, return immediately
	if (result.success) {
		return result;
	}

	// If we've exhausted retries, return the error
	if (currentRetry >= maxRetries - 1) {
		return result;
	}

	// Only retry on temporary failures
	const retryableErrors = [
		"NETWORK_ERROR",
		"REQUEST_TIMEOUT",
		"EXTERNAL_API_ERROR",
	];
	if (!retryableErrors.includes(result.error?.code || "")) {
		return result;
	}

	// Wait with exponential backoff before retrying
	const delay = 2 ** currentRetry * 100; // 100ms, 200ms, 400ms, etc.
	await new Promise((resolve) => setTimeout(resolve, delay));

	return retryWithBackoff(operation, maxRetries, currentRetry + 1);
}

function handleHttpError(
	response: Response,
	query: string,
	options: SearchBooksOptions,
	startTime: number
): SearchBooksResult {
	const context = {
		query,
		options,
		timestamp: startTime,
	};

	switch (response.status) {
		case 429:
			return {
				success: false,
				error: {
					type: ErrorType.RATE_LIMIT,
					code: "RATE_LIMIT_EXCEEDED",
					message:
						"リクエスト制限を超えました。しばらく待ってから再試行してください。",
					context,
				},
			};

		case 401:
			return {
				success: false,
				error: {
					type: ErrorType.AUTHENTICATION,
					code: "API_AUTHENTICATION_FAILED",
					message: "APIの認証に失敗しました。設定を確認してください。",
					context,
				},
			};

		case 403:
			return {
				success: false,
				error: {
					type: ErrorType.RATE_LIMIT,
					code: "QUOTA_EXCEEDED",
					message: "1日の利用上限に達しました。明日再度お試しください。",
					context,
				},
			};
		default:
			return {
				success: false,
				error: {
					type: ErrorType.EXTERNAL_API,
					code: "EXTERNAL_API_ERROR",
					message:
						"サービスの一時的な問題が発生しています。しばらく待ってから再試行してください。",
					context,
				},
			};
	}
}

function handleFetchError(
	error: any,
	query: string,
	options: SearchBooksOptions,
	startTime: number
): SearchBooksResult {
	const context = {
		query,
		options,
		timestamp: startTime,
	};

	if (error instanceof Error) {
		if (error.message.includes("timeout")) {
			return {
				success: false,
				error: {
					type: ErrorType.NETWORK,
					code: "REQUEST_TIMEOUT",
					message: "リクエストがタイムアウトしました。再度お試しください。",
					context,
				},
			};
		}

		if (error.message.includes("Invalid JSON")) {
			return {
				success: false,
				error: {
					type: ErrorType.EXTERNAL_API,
					code: "INVALID_RESPONSE",
					message: "サーバーからの応答が正しくありません。",
					context,
				},
			};
		}

		return {
			success: false,
			error: {
				type: ErrorType.NETWORK,
				code: "NETWORK_ERROR",
				message:
					"通信エラーが発生しました。インターネット接続を確認してください。",
				context,
			},
		};
	}

	return {
		success: false,
		error: {
			type: ErrorType.INTERNAL,
			code: "UNKNOWN_ERROR",
			message: "予期しないエラーが発生しました。",
			context,
		},
	};
}
