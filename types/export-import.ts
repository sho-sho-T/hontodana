/**
 * データエクスポート・インポート機能の型定義
 */

// エクスポートオプション
export interface ExportOptions {
	format: "json" | "csv" | "goodreads";
	dataTypes: (
		| "userBooks"
		| "wishlist"
		| "collections"
		| "sessions"
		| "profile"
	)[];
	dateRange?: {
		from?: Date;
		to?: Date;
	};
	options?: {
		includeImages?: boolean;
		compressOutput?: boolean;
	};
}

// エクスポートデータのメタデータ
export interface ExportMetadata {
	version: string;
	exportDate: string;
	userId: string;
	format: "hontodana-v1" | "hontodana-v2";
	dataTypes: string[];
	totalRecords: number;
}

// エクスポートされたユーザープロフィール
export interface UserProfileExport {
	id: string;
	name: string;
	avatarUrl?: string;
	theme: string;
	displayMode: string;
	booksPerPage: number;
	defaultBookType: string;
	readingGoal?: number;
}

// エクスポートされた書籍情報
export interface BookExport {
	id: string;
	googleBooksId?: string;
	title: string;
	authors: string[];
	publisher?: string;
	publishedDate?: string;
	isbn10?: string;
	isbn13?: string;
	pageCount?: number;
	language: string;
	description?: string;
	thumbnailUrl?: string;
	previewLink?: string;
	infoLink?: string;
	categories: string[];
	averageRating?: number;
	ratingsCount: number;
}

// エクスポートされたユーザー書籍情報
export interface UserBookExport {
	id: string;
	userId: string;
	bookId: string;
	bookType: string;
	status: string;
	currentPage: number;
	startDate?: string;
	finishDate?: string;
	rating?: number;
	review?: string;
	notes: string[];
	tags: string[];
	isFavorite: boolean;
	acquiredDate?: string;
	location?: string;
}

// エクスポートされた読書セッション
export interface ReadingSessionExport {
	id: string;
	userBookId: string;
	startPage: number;
	endPage: number;
	pagesRead: number;
	sessionDate: string;
	durationMinutes?: number;
	notes?: string;
}

// エクスポートされたウィッシュリストアイテム
export interface WishlistItemExport {
	id: string;
	userId: string;
	bookId: string;
	priority: string;
	reason?: string;
	targetDate?: string;
	priceAlert?: number;
}

// エクスポートされたコレクション
export interface CollectionExport {
	id: string;
	userId: string;
	name: string;
	description?: string;
	color: string;
	icon: string;
	isPublic: boolean;
	sortOrder: number;
	books: string[]; // userBookIds
}

// 完全なエクスポートデータ
export interface ExportData {
	metadata: ExportMetadata;
	userProfile?: UserProfileExport;
	books: BookExport[];
	userBooks: UserBookExport[];
	readingSessions: ReadingSessionExport[];
	wishlistItems: WishlistItemExport[];
	collections: CollectionExport[];
}

// インポートエラー
export interface ImportError {
	type:
		| "VALIDATION_ERROR"
		| "DUPLICATE_ERROR"
		| "CONSTRAINT_ERROR"
		| "SYSTEM_ERROR";
	message: string;
	details?: {
		line?: number;
		field?: string;
		value?: any;
		suggestion?: string;
	};
}

// インポート結果サマリー
export interface ImportSummary {
	booksAdded: number;
	booksUpdated: number;
	booksSkipped: number;
	sessionsAdded: number;
	collectionsAdded: number;
	collectionsUpdated: number;
	wishlistItemsAdded: number;
	totalProcessed: number;
	errors: ImportError[];
}

// インポート結果
export interface ImportResult {
	success: boolean;
	summary: ImportSummary;
	rollbackId?: string;
	warnings?: string[];
}

// インポートプレビュー
export interface ImportPreview {
	metadata?: ExportMetadata;
	userBooks: UserBookExport[];
	wishlistItems: WishlistItemExport[];
	collections: CollectionExport[];
	readingSessions: ReadingSessionExport[];
	duplicates: {
		books: BookExport[];
		userBooks: UserBookExport[];
	};
	validationErrors: ImportError[];
}

// インポートジョブのステータス
export interface ImportJobStatus {
	jobId: string;
	status: "queued" | "processing" | "completed" | "failed" | "cancelled";
	progress: number; // 0-100
	estimatedTimeRemaining?: number; // seconds
	startedAt?: string;
	completedAt?: string;
	summary?: ImportSummary;
	errors?: ImportError[];
}

// ファイル解析結果
export interface ParsedImportData {
	isValid: boolean;
	format: "json" | "csv" | "goodreads";
	data: Partial<ExportData>;
	preview: ImportPreview;
	errors: ImportError[];
	warnings: string[];
}

// 重複処理設定
export interface DuplicateHandlingOptions {
	strategy: "skip" | "update" | "merge" | "create_new";
	mergeFields?: string[]; // マージ時に更新するフィールド
	comparisonFields?: string[]; // 重複判定に使用するフィールド
}

// インポート設定
export interface ImportOptions {
	duplicateHandling: DuplicateHandlingOptions;
	validation: {
		skipInvalidRecords: boolean;
		strictMode: boolean;
	};
	processing: {
		batchSize: number;
		maxConcurrency: number;
	};
}

// CSV カラムマッピング
export interface CsvColumnMapping {
	[csvColumn: string]: {
		field: string;
		type: "string" | "number" | "boolean" | "date" | "array";
		required?: boolean;
		defaultValue?: any;
		transform?: (value: string) => any;
	};
}

// Goodreads フィールドマッピング
export interface GoodreadsMapping extends CsvColumnMapping {
	// Goodreads固有のマッピング定義
}

// データ変換設定
export interface ConversionOptions {
	csvMapping?: CsvColumnMapping;
	goodreadsMapping?: GoodreadsMapping;
	dateFormat?: string;
	encoding?: string;
	delimiter?: string;
}

// ファイル制約
export interface FileConstraints {
	maxFileSize: number; // bytes
	allowedMimeTypes: string[];
	allowedExtensions: string[];
	maxRecords?: number;
}

// レート制限
export interface RateLimit {
	exports: {
		perHour: number;
		perDay: number;
	};
	imports: {
		perHour: number;
		perDay: number;
	};
	fileSize: {
		perUpload: number;
		perDay: number;
	};
}

// エクスポート・インポート統計
export interface ExportImportStats {
	totalExports: number;
	totalImports: number;
	totalDataExported: number; // records
	totalDataImported: number; // records
	avgExportTime: number; // milliseconds
	avgImportTime: number; // milliseconds
	errorRate: number; // percentage
	popularFormats: {
		format: string;
		count: number;
	}[];
}

// バックアップ設定
export interface BackupConfig {
	enabled: boolean;
	schedule?: {
		frequency: "daily" | "weekly" | "monthly";
		time?: string; // HH:MM format
		dayOfWeek?: number; // 0-6 (Sunday-Saturday)
		dayOfMonth?: number; // 1-31
	};
	retention: {
		count: number;
		duration: number; // days
	};
	format: "json" | "csv";
	location: "local" | "cloud";
}

// セキュリティ設定
export interface SecuritySettings {
	encryptionEnabled: boolean;
	passwordProtected: boolean;
	accessToken?: string;
	expirationTime?: number; // hours
	allowedIpRanges?: string[];
}

// 通知設定
export interface NotificationSettings {
	onExportComplete: boolean;
	onImportComplete: boolean;
	onErrors: boolean;
	emailNotifications: boolean;
	webhookUrl?: string;
}

// システム設定
export interface ExportImportSettings {
	fileConstraints: FileConstraints;
	rateLimit: RateLimit;
	backup: BackupConfig;
	security: SecuritySettings;
	notifications: NotificationSettings;
}

// API レスポンス型
export interface ExportResponse {
	data?: ExportData | string; // JSON data or CSV string
	downloadUrl?: string;
	filename: string;
	size: number;
	expiresAt: string;
}

export interface ImportResponse {
	jobId: string;
	estimatedTime: number; // seconds
	previewData: ImportPreview;
	uploadId: string;
}

export interface ImportStatusResponse extends ImportJobStatus {
	// 追加のレスポンスフィールドがあれば定義
}
