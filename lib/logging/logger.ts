import { v4 as uuidv4 } from "uuid";

export enum LogLevel {
	DEBUG = "debug",
	INFO = "info",
	WARN = "warn",
	ERROR = "error",
	FATAL = "fatal",
}

export interface LogEntry {
	id: string;
	level: LogLevel;
	message: string;
	timestamp: Date;
	source: string;
	requestId?: string;
	metadata?: Record<string, unknown>;
}

export class Logger {
	private source: string;
	private minLevel: LogLevel;

	private readonly levelPriorities = {
		[LogLevel.DEBUG]: 0,
		[LogLevel.INFO]: 1,
		[LogLevel.WARN]: 2,
		[LogLevel.ERROR]: 3,
		[LogLevel.FATAL]: 4,
	};

	private readonly sensitiveKeys = [
		"password",
		"token",
		"secret",
		"apiKey",
		"auth",
		"authorization",
		"bearer",
		"credential",
		"key",
		"privateKey",
		"publicKey",
	];

	constructor(source: string, minLevel: LogLevel = LogLevel.INFO) {
		this.source = source;
		this.minLevel = minLevel;
	}

	debug(
		message: string,
		metadata?: Record<string, unknown>,
		requestId?: string
	): void {
		this.log(LogLevel.DEBUG, message, metadata, requestId);
	}

	info(
		message: string,
		metadata?: Record<string, unknown>,
		requestId?: string
	): void {
		this.log(LogLevel.INFO, message, metadata, requestId);
	}

	warn(
		message: string,
		metadata?: Record<string, unknown>,
		requestId?: string
	): void {
		this.log(LogLevel.WARN, message, metadata, requestId);
	}

	error(
		message: string,
		metadata?: Record<string, unknown>,
		requestId?: string
	): void {
		this.log(LogLevel.ERROR, message, metadata, requestId);
	}

	fatal(
		message: string,
		metadata?: Record<string, unknown>,
		requestId?: string
	): void {
		this.log(LogLevel.FATAL, message, metadata, requestId);
	}

	private log(
		level: LogLevel,
		message: string,
		metadata?: Record<string, unknown>,
		requestId?: string
	): void {
		// Check if log level meets minimum threshold
		if (this.levelPriorities[level] < this.levelPriorities[this.minLevel]) {
			return;
		}

		const logEntry: LogEntry = {
			id: uuidv4(),
			level,
			message,
			timestamp: new Date(),
			source: this.source,
			requestId,
			metadata: this.sanitizeMetadata(metadata),
		};

		// Output to console (in production, this would go to a proper logging service)
		console.log(logEntry);
	}

	private sanitizeMetadata(
		metadata?: Record<string, unknown>
	): Record<string, unknown> | undefined {
		if (!metadata) {
			return undefined;
		}

		try {
			return this.deepSanitize(metadata);
		} catch {
			// Handle circular references or other serialization errors
			return {
				_sanitizationError: "Failed to sanitize metadata",
				_originalKeys: Object.keys(metadata),
			};
		}
	}

	private deepSanitize(obj: any, seen = new WeakSet()): any {
		// Handle null/undefined
		if (obj === null || obj === undefined) {
			return obj;
		}

		// Handle primitive types
		if (typeof obj !== "object") {
			return obj;
		}

		// Handle circular references
		if (seen.has(obj)) {
			return "[Circular Reference]";
		}
		seen.add(obj);

		// Handle arrays
		if (Array.isArray(obj)) {
			return obj.map((item) => this.deepSanitize(item, seen));
		}

		// Handle objects
		const sanitized: Record<string, any> = {};
		for (const [key, value] of Object.entries(obj)) {
			if (this.isSensitiveKey(key)) {
				sanitized[key] = "***MASKED***";
			} else {
				sanitized[key] = this.deepSanitize(value, seen);
			}
		}

		return sanitized;
	}

	private isSensitiveKey(key: string): boolean {
		const lowerKey = key.toLowerCase();
		return this.sensitiveKeys.some((sensitiveKey) =>
			lowerKey.includes(sensitiveKey.toLowerCase())
		);
	}
}
