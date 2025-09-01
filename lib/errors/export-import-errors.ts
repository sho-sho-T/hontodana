/**
 * エクスポート・インポート機能専用エラークラス
 */

export class ExportImportError extends Error {
	public readonly code: string;
	public readonly details?: any;

	constructor(message: string, code: string, details?: any) {
		super(message);
		this.name = "ExportImportError";
		this.code = code;
		this.details = details;
	}
}

export class ExportError extends ExportImportError {
	constructor(message: string, code: string, details?: any) {
		super(message, `EXPORT_${code}`, details);
		this.name = "ExportError";
	}
}

export class ImportError extends ExportImportError {
	constructor(message: string, code: string, details?: any) {
		super(message, `IMPORT_${code}`, details);
		this.name = "ImportError";
	}
}

// エクスポートエラー
export class InvalidFormatError extends ExportError {
	constructor(format: string) {
		super(
			`Invalid export format: ${format}. Supported formats: json, csv, goodreads`,
			"INVALID_FORMAT",
			{ format, supportedFormats: ["json", "csv", "goodreads"] }
		);
	}
}

export class UserNotFoundError extends ExportError {
	constructor(userId: string) {
		super(`User not found: ${userId}`, "USER_NOT_FOUND", { userId });
	}
}

export class DatabaseConnectionError extends ExportImportError {
	constructor(operation: "export" | "import", details?: any) {
		super(
			`Database connection failed during ${operation} operation`,
			"DATABASE_CONNECTION_FAILED",
			{ operation, ...details }
		);
	}
}

export class RateLimitError extends ExportImportError {
	constructor(
		operation: "export" | "import",
		limit: number,
		retryAfter: number
	) {
		super(
			`Rate limit exceeded for ${operation} operation. Try again in ${retryAfter} seconds.`,
			"RATE_LIMIT_EXCEEDED",
			{ operation, limit, retryAfter }
		);
	}
}

// インポートエラー
export class FileFormatError extends ImportError {
	constructor(filename: string, expectedFormats: string[]) {
		super(
			`Invalid file format: ${filename}. Supported formats: ${expectedFormats.join(", ")}`,
			"INVALID_FILE_FORMAT",
			{ filename, expectedFormats }
		);
	}
}

export class FileSizeError extends ImportError {
	constructor(size: number, maxSize: number) {
		super(
			`File size (${Math.round(size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`,
			"FILE_TOO_LARGE",
			{ size, maxSize }
		);
	}
}

export class ParseError extends ImportError {
	constructor(
		format: string,
		line?: number,
		column?: number,
		details?: string
	) {
		const locationInfo = line
			? ` at line ${line}${column ? `, column ${column}` : ""}`
			: "";
		super(
			`Failed to parse ${format} file${locationInfo}${details ? `: ${details}` : ""}`,
			"PARSE_ERROR",
			{ format, line, column, details }
		);
	}
}

export class ValidationError extends ImportError {
	constructor(field: string, value: any, reason: string, line?: number) {
		const locationInfo = line ? ` (line ${line})` : "";
		super(
			`Validation failed for field '${field}': ${reason}${locationInfo}`,
			"VALIDATION_ERROR",
			{ field, value, reason, line }
		);
	}
}

export class DuplicateHandlingError extends ImportError {
	constructor(operation: string, details: any) {
		super(
			`Failed to handle duplicate data during ${operation}`,
			"DUPLICATE_HANDLING_ERROR",
			{ operation, ...details }
		);
	}
}

// ユーティリティ関数
export function isExportImportError(error: any): error is ExportImportError {
	return error instanceof ExportImportError;
}

export function getErrorResponse(error: any): {
	message: string;
	code: string;
	details?: any;
	statusCode: number;
} {
	if (isExportImportError(error)) {
		let statusCode = 500; // Default to internal server error

		// エラーコードに基づいてHTTPステータスコードを決定
		switch (error.code) {
			case "EXPORT_INVALID_FORMAT":
			case "EXPORT_INVALID_DATA_TYPES":
			case "IMPORT_INVALID_FILE_FORMAT":
			case "IMPORT_PARSE_ERROR":
			case "IMPORT_VALIDATION_ERROR":
				statusCode = 400; // Bad Request
				break;
			case "EXPORT_USER_NOT_FOUND":
				statusCode = 404; // Not Found
				break;
			case "IMPORT_FILE_TOO_LARGE":
				statusCode = 413; // Payload Too Large
				break;
			case "RATE_LIMIT_EXCEEDED":
				statusCode = 429; // Too Many Requests
				break;
			case "DATABASE_CONNECTION_FAILED":
				statusCode = 503; // Service Unavailable
				break;
		}

		return {
			message: error.message,
			code: error.code,
			details: error.details,
			statusCode,
		};
	}

	// その他のエラー
	return {
		message: "Internal server error",
		code: "UNKNOWN_ERROR",
		statusCode: 500,
	};
}
