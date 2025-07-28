# 型定義設計書

## 1. 型定義戦略

### 1.1 設計原則
- **型安全性の最大化**: strict モードでの開発
- **DRY（Don't Repeat Yourself）**: 共通型の再利用
- **ドメイン駆動**: ビジネスドメインを反映した型設計
- **保守性**: 変更に強い型設計

### 1.2 型定義の分類
```
types/
├── domain/           # ドメインエンティティの型
├── api/             # API関連の型
├── ui/              # UI コンポーネントの型
├── database/        # データベーススキーマの型
└── common/          # 共通ユーティリティ型
```

## 2. ドメインエンティティ型

### 2.1 基本エンティティ

#### User（ユーザー）
```typescript
// types/domain/user.ts
export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
  readingPreferences: ReadingPreferences;
  privacySettings: PrivacySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadingPreferences {
  preferredGenres: string[];
  readingGoals: ReadingGoals;
  notificationSettings: NotificationSettings;
}

export interface ReadingGoals {
  yearlyTarget?: number;
  monthlyTarget?: number;
  currentYearProgress: number;
}

export interface NotificationSettings {
  readingReminders: boolean;
  socialInteractions: boolean;
  weeklyReports: boolean;
}

export interface PrivacySettings {
  profilePublic: boolean;
  readingRecordsPublic: boolean;
  followersOnly: boolean;
}
```

#### Book（書籍）
```typescript
// types/domain/book.ts
export interface Book {
  id: string;
  userId: string;
  googleBooksId?: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: Date;
  pageCount?: number;
  bookType: BookType;
  coverImageUrl?: string;
  description?: string;
  language: Language;
  purchaseInfo?: PurchaseInfo;
  tags: Tag[];
  genres: Genre[];
  createdAt: Date;
  updatedAt: Date;
}

export enum BookType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
}

export enum Language {
  JA = 'ja',
  EN = 'en',
  ZH = 'zh',
  KO = 'ko',
}

export interface PurchaseInfo {
  purchaseDate: Date;
  price: number;
  currency: string;
  store?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface Genre {
  id: string;
  name: string;
  parentId?: string;
}
```

#### ReadingRecord（読書記録）
```typescript
// types/domain/reading-record.ts
export interface ReadingRecord {
  id: string;
  bookId: string;
  userId: string;
  status: ReadingStatus;
  progress: ReadingProgress;
  dates: ReadingDates;
  rating?: Rating;
  review?: string;
  readingTime: ReadingTime;
  notes: ReadingNote[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReadingStatus {
  NOT_STARTED = 'NOT_STARTED',
  READING = 'READING',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  REREADING = 'REREADING',
  ABANDONED = 'ABANDONED',
}

export interface ReadingProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
}

export interface ReadingDates {
  startDate?: Date;
  completedDate?: Date;
  estimatedCompletionDate?: Date;
}

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface ReadingTime {
  totalMinutes: number;
  sessions: ReadingSession[];
}

export interface ReadingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  pagesRead: number;
  notes?: string;
}

export interface ReadingNote {
  id: string;
  pageNumber?: number;
  noteText: string;
  noteType: NoteType;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum NoteType {
  GENERAL = 'GENERAL',
  QUOTE = 'QUOTE',
  REFLECTION = 'REFLECTION',
  QUESTION = 'QUESTION',
  HIGHLIGHT = 'HIGHLIGHT',
}
```

### 2.2 ソーシャル機能型

#### Social（ソーシャル関連）
```typescript
// types/domain/social.ts
export interface UserFollow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface Like {
  id: string;
  userId: string;
  targetType: LikeTargetType;
  targetId: string;
  createdAt: Date;
}

export enum LikeTargetType {
  READING_RECORD = 'READING_RECORD',
  READING_NOTE = 'READING_NOTE',
  BOOK_REVIEW = 'BOOK_REVIEW',
}

export interface ActivityFeed {
  id: string;
  userId: string;
  activityType: ActivityType;
  targetId: string;
  metadata: ActivityMetadata;
  createdAt: Date;
}

export enum ActivityType {
  BOOK_ADDED = 'BOOK_ADDED',
  BOOK_COMPLETED = 'BOOK_COMPLETED',
  REVIEW_POSTED = 'REVIEW_POSTED',
  NOTE_SHARED = 'NOTE_SHARED',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
}

export interface ActivityMetadata {
  bookTitle?: string;
  bookAuthor?: string;
  rating?: Rating;
  reviewExcerpt?: string;
  [key: string]: any;
}
```

## 3. API関連型

### 3.1 リクエスト・レスポンス型

#### 認証API
```typescript
// types/api/auth.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
```

#### 書籍API
```typescript
// types/api/books.ts
export interface CreateBookRequest {
  googleBooksId?: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  bookType: BookType;
  coverImageUrl?: string;
  description?: string;
  language?: Language;
  tags?: string[];
  genreIds?: string[];
}

export interface UpdateBookRequest extends Partial<CreateBookRequest> {
  id: string;
}

export interface BookSearchQuery {
  q?: string;
  title?: string;
  author?: string;
  isbn?: string;
  genre?: string;
  bookType?: BookType;
  status?: ReadingStatus;
  rating?: Rating;
  limit?: number;
  offset?: number;
  sortBy?: BookSortField;
  sortOrder?: SortOrder;
}

export enum BookSortField {
  TITLE = 'title',
  AUTHOR = 'author',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  RATING = 'rating',
  PAGE_COUNT = 'pageCount',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface BookSearchResponse {
  books: Book[];
  totalCount: number;
  hasMore: boolean;
}
```

#### Google Books API
```typescript
// types/api/google-books.ts
export interface GoogleBooksSearchResponse {
  kind: string;
  totalItems: number;
  items: GoogleBooksItem[];
}

export interface GoogleBooksItem {
  kind: string;
  id: string;
  etag: string;
  selfLink: string;
  volumeInfo: GoogleBooksVolumeInfo;
  saleInfo?: GoogleBooksSaleInfo;
  accessInfo?: GoogleBooksAccessInfo;
}

export interface GoogleBooksVolumeInfo {
  title: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: GoogleBooksIdentifier[];
  readingModes?: GoogleBooksReadingModes;
  pageCount?: number;
  printType?: string;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  maturityRating?: string;
  allowAnonLogging?: boolean;
  contentVersion?: string;
  panelizationSummary?: GoogleBooksPanelizationSummary;
  imageLinks?: GoogleBooksImageLinks;
  language?: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
}

export interface GoogleBooksIdentifier {
  type: string;
  identifier: string;
}

export interface GoogleBooksImageLinks {
  smallThumbnail?: string;
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
  extraLarge?: string;
}
```

### 3.2 エラーレスポンス型
```typescript
// types/api/error.ts
export interface ApiError {
  error: string;
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ValidationError extends ApiError {
  errors: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
  code: string;
}
```

## 4. UI コンポーネント型

### 4.1 コンポーネントProps型

#### 共通Props
```typescript
// types/ui/common.ts
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export interface LoadingProps {
  loading?: boolean;
  loadingText?: string;
}

export interface ErrorProps {
  error?: string | null;
  onRetry?: () => void;
}

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type Color = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';
```

#### フォームコンポーネント
```typescript
// types/ui/form.ts
export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface InputProps extends FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'tel';
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  maxLength?: number;
}

export interface SelectProps<T = string> extends FormFieldProps {
  value?: T;
  onChange?: (value: T) => void;
  options: SelectOption<T>[];
  multiple?: boolean;
  searchable?: boolean;
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface TextareaProps extends FormFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
  maxLength?: number;
  autoResize?: boolean;
}
```

#### 書籍関連コンポーネント
```typescript
// types/ui/book.ts
export interface BookCardProps extends BaseComponentProps {
  book: Book;
  readingRecord?: ReadingRecord;
  showProgress?: boolean;
  showActions?: boolean;
  onClick?: (book: Book) => void;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
}

export interface BookListProps extends BaseComponentProps {
  books: Book[];
  readingRecords?: ReadingRecord[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  onBookClick?: (book: Book) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface BookFormProps extends BaseComponentProps {
  book?: Book;
  mode: 'create' | 'edit';
  onSubmit: (data: CreateBookRequest | UpdateBookRequest) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export interface BookshelfViewProps extends BaseComponentProps {
  viewMode: BookshelfViewMode;
  onViewModeChange: (mode: BookshelfViewMode) => void;
  filters: BookshelfFilters;
  onFiltersChange: (filters: BookshelfFilters) => void;
}

export enum BookshelfViewMode {
  GRID = 'grid',
  LIST = 'list',
  TABLE = 'table',
}

export interface BookshelfFilters {
  search?: string;
  status?: ReadingStatus[];
  bookType?: BookType[];
  genres?: string[];
  tags?: string[];
  rating?: Rating[];
  dateRange?: DateRange;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}
```

## 5. データベース型

### 5.1 Supabase型定義
```typescript
// types/database/supabase.ts
export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      books: {
        Row: BookRow;
        Insert: BookInsert;
        Update: BookUpdate;
      };
      reading_records: {
        Row: ReadingRecordRow;
        Insert: ReadingRecordInsert;
        Update: ReadingRecordUpdate;
      };
      // その他のテーブル...
    };
    Views: {
      book_statistics: {
        Row: BookStatisticsRow;
      };
      reading_activity_feed: {
        Row: ReadingActivityFeedRow;
      };
    };
    Functions: {
      get_user_reading_stats: {
        Args: { user_id: string };
        Returns: UserReadingStats;
      };
    };
  };
}

export interface UserRow {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  profile_image_url: string | null;
  bio: string | null;
  reading_preferences: Json;
  privacy_settings: Json;
  created_at: string;
  updated_at: string;
}

export interface UserInsert extends Omit<UserRow, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface UserUpdate extends Partial<UserInsert> {}

// Json型の定義
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
```

## 6. ユーティリティ型

### 6.1 共通ユーティリティ型
```typescript
// types/common/utility.ts

// API レスポンス用のラッパー型
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// フォーム状態管理用
export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// 非同期操作状態
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// イベントハンドラ型
export type EventHandler<T = Event> = (event: T) => void;
export type ClickHandler = EventHandler<React.MouseEvent>;
export type ChangeHandler = EventHandler<React.ChangeEvent<HTMLInputElement>>;
export type SubmitHandler = EventHandler<React.FormEvent>;

// 条件型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// ID型の厳密化
export type UserId = string & { readonly brand: unique symbol };
export type BookId = string & { readonly brand: unique symbol };
export type ReadingRecordId = string & { readonly brand: unique symbol };

// 型ガード用
export function isUserId(id: string): id is UserId {
  return typeof id === 'string' && id.length > 0;
}

export function isBookId(id: string): id is BookId {
  return typeof id === 'string' && id.length > 0;
}
```

### 6.2 バリデーション型
```typescript
// types/common/validation.ts
import { z } from 'zod';

// Zodスキーマ定義
export const BookSchema = z.object({
  title: z.string().min(1, '書籍タイトルは必須です').max(200, '書籍タイトルは200文字以内で入力してください'),
  author: z.string().min(1, '著者は必須です').max(100, '著者は100文字以内で入力してください'),
  isbn: z.string().regex(/^(?:\d{10}|\d{13})$/, 'ISBNは10桁または13桁の数字で入力してください').optional(),
  pageCount: z.number().min(1, 'ページ数は1以上の数値を入力してください').max(10000, 'ページ数が上限を超えています').optional(),
  bookType: z.nativeEnum(BookType),
  language: z.nativeEnum(Language).default(Language.JA),
});

export const ReadingRecordSchema = z.object({
  status: z.nativeEnum(ReadingStatus),
  currentPage: z.number().min(0, 'ページ数は0以上の数値を入力してください'),
  rating: z.number().min(1).max(5).optional(),
  review: z.string().max(1000, 'レビューは1000文字以内で入力してください').optional(),
  isPublic: z.boolean().default(true),
});

export const UserProfileSchema = z.object({
  username: z.string().min(3, 'ユーザー名は3文字以上で入力してください').max(20, 'ユーザー名は20文字以内で入力してください'),
  displayName: z.string().max(50, '表示名は50文字以内で入力してください').optional(),
  bio: z.string().max(200, '自己紹介は200文字以内で入力してください').optional(),
});

// 型推論
export type BookFormData = z.infer<typeof BookSchema>;
export type ReadingRecordFormData = z.infer<typeof ReadingRecordSchema>;
export type UserProfileFormData = z.infer<typeof UserProfileSchema>;
```

## 7. 状態管理型

### 7.1 Zustand ストア型
```typescript
// types/store/index.ts
export interface AppState {
  auth: AuthState;
  bookshelf: BookshelfState;
  readingSession: ReadingSessionState;
  ui: UIState;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface BookshelfState {
  books: Book[];
  readingRecords: ReadingRecord[];
  filters: BookshelfFilters;
  viewMode: BookshelfViewMode;
  setBooks: (books: Book[]) => void;
  addBook: (book: Book) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  removeBook: (id: string) => void;
  setFilters: (filters: BookshelfFilters) => void;
  setViewMode: (mode: BookshelfViewMode) => void;
}

export interface ReadingSessionState {
  activeSession: ReadingSession | null;
  startSession: (bookId: string) => void;
  endSession: (pagesRead: number, notes?: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
}

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  notifications: Notification[];
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

## 8. 型定義のベストプラクティス

### 8.1 strict 設定
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 8.2 型安全性の向上
```typescript
// 型ガードの活用
export function isReadingRecord(obj: any): obj is ReadingRecord {
  return obj && typeof obj.id === 'string' && typeof obj.bookId === 'string';
}

// 判別可能なユニオン型
export type AsyncOperation<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// const assertionの活用
export function assertIsBook(obj: unknown): asserts obj is Book {
  if (!obj || typeof obj !== 'object' || !('id' in obj) || !('title' in obj)) {
    throw new Error('Invalid book object');
  }
}
```