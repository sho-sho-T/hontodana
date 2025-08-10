// ========================================
// Core Entity Interfaces
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  preferences: UserPreferences;
  created_at: Date;
  updated_at: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  display_mode: 'grid' | 'list';
  books_per_page: number;
  default_book_type: BookType;
  reading_goal?: number; // 年間読書目標冊数
}

export interface Book {
  id: string;
  google_books_id?: string; // Google Books API ID
  title: string;
  authors: string[];
  publisher?: string;
  published_date?: string;
  isbn_10?: string;
  isbn_13?: string;
  page_count?: number;
  language: string;
  description?: string;
  thumbnail_url?: string;
  preview_link?: string;
  info_link?: string;
  categories: string[];
  average_rating?: number;
  ratings_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  book_type: BookType;
  status: ReadingStatus;
  current_page: number;
  start_date?: Date;
  finish_date?: Date;
  rating?: number; // 1-5 stars
  review?: string;
  notes: string[];
  tags: string[];
  is_favorite: boolean;
  acquired_date?: Date;
  location?: string; // 物理書籍の保管場所
  created_at: Date;
  updated_at: Date;
  
  // Relations
  user: User;
  book: Book;
  reading_sessions: ReadingSession[];
}

export interface ReadingSession {
  id: string;
  user_book_id: string;
  start_page: number;
  end_page: number;
  pages_read: number;
  session_date: Date;
  duration_minutes?: number;
  notes?: string;
  created_at: Date;
  
  // Relations
  user_book: UserBook;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  book_id: string;
  priority: WishlistPriority;
  reason?: string;
  target_date?: Date; // いつまでに読みたいか
  price_alert?: number; // 価格アラート設定
  created_at: Date;
  updated_at: Date;
  
  // Relations
  user: User;
  book: Book;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_public: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  
  // Relations
  user: User;
  books: CollectionBook[];
}

export interface CollectionBook {
  id: string;
  collection_id: string;
  user_book_id: string;
  sort_order: number;
  added_at: Date;
  
  // Relations
  collection: Collection;
  user_book: UserBook;
}

// ========================================
// Enums
// ========================================

export type BookType = 'physical' | 'kindle' | 'epub' | 'audiobook' | 'other';

export type ReadingStatus = 
  | 'want_to_read'    // 読みたい
  | 'reading'         // 読書中
  | 'completed'       // 読了
  | 'paused'          // 一時停止
  | 'abandoned'       // 挫折
  | 'reference';      // 参考書（辞書的使用）

export type WishlistPriority = 'low' | 'medium' | 'high' | 'urgent';

export type SortOption = 
  | 'title_asc'
  | 'title_desc'
  | 'author_asc'
  | 'author_desc'
  | 'date_added_asc'
  | 'date_added_desc'
  | 'progress_asc'
  | 'progress_desc'
  | 'rating_asc'
  | 'rating_desc';

// ========================================
// API Request/Response Types
// ========================================

// Google Books API Response
export interface GoogleBooksResponse {
  kind: string;
  totalItems: number;
  items?: GoogleBookItem[];
}

export interface GoogleBookItem {
  kind: string;
  id: string;
  etag: string;
  selfLink: string;
  volumeInfo: GoogleBookVolumeInfo;
  saleInfo?: GoogleBookSaleInfo;
  accessInfo?: GoogleBookAccessInfo;
}

export interface GoogleBookVolumeInfo {
  title: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: GoogleBookIdentifier[];
  readingModes?: {
    text: boolean;
    image: boolean;
  };
  pageCount?: number;
  printType?: string;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  maturityRating?: string;
  allowAnonLogging?: boolean;
  contentVersion?: string;
  panelizationSummary?: {
    containsEpubBubbles: boolean;
    containsImageBubbles: boolean;
  };
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  language: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
}

export interface GoogleBookIdentifier {
  type: 'ISBN_10' | 'ISBN_13' | 'OTHER';
  identifier: string;
}

export interface GoogleBookSaleInfo {
  country: string;
  saleability: string;
  isEbook: boolean;
  listPrice?: {
    amount: number;
    currencyCode: string;
  };
  retailPrice?: {
    amount: number;
    currencyCode: string;
  };
  buyLink?: string;
}

export interface GoogleBookAccessInfo {
  country: string;
  viewability: string;
  embeddable: boolean;
  publicDomain: boolean;
  textToSpeechPermission: string;
  epub: {
    isAvailable: boolean;
    acsTokenLink?: string;
  };
  pdf: {
    isAvailable: boolean;
    acsTokenLink?: string;
  };
  webReaderLink?: string;
  accessViewStatus: string;
  quoteSharingAllowed: boolean;
}

// API Request Types
export interface SearchBooksRequest {
  query: string;
  max_results?: number;
  start_index?: number;
  filter?: 'ebooks' | 'free-ebooks' | 'full' | 'paid-ebooks' | 'partial';
  order_by?: 'newest' | 'relevance';
}

export interface CreateUserBookRequest {
  google_books_id?: string;
  book_data?: Partial<Book>;
  book_type: BookType;
  status: ReadingStatus;
  current_page?: number;
  rating?: number;
  review?: string;
  tags?: string[];
  location?: string;
}

export interface UpdateUserBookRequest {
  status?: ReadingStatus;
  current_page?: number;
  rating?: number;
  review?: string;
  notes?: string[];
  tags?: string[];
  is_favorite?: boolean;
  location?: string;
}

export interface CreateReadingSessionRequest {
  user_book_id: string;
  start_page: number;
  end_page: number;
  session_date?: Date;
  duration_minutes?: number;
  notes?: string;
}

export interface UpdateWishlistItemRequest {
  priority?: WishlistPriority;
  reason?: string;
  target_date?: Date;
  price_alert?: number;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_public?: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_previous: boolean;
  has_next: boolean;
}

// ========================================
// UI State Types
// ========================================

export interface LibraryViewState {
  display_mode: 'grid' | 'list';
  sort_option: SortOption;
  filter_status?: ReadingStatus;
  filter_type?: BookType;
  search_query?: string;
  selected_collection?: string;
  show_completed: boolean;
}

export interface ReadingProgressState {
  total_books: number;
  completed_books: number;
  reading_books: number;
  pages_read_today: number;
  pages_read_this_week: number;
  pages_read_this_month: number;
  current_reading_streak: number;
  longest_reading_streak: number;
}

export interface StatisticsData {
  reading_progress: ReadingProgressState;
  books_by_status: Record<ReadingStatus, number>;
  books_by_type: Record<BookType, number>;
  reading_activity: DailyReadingActivity[];
  top_genres: GenreCount[];
  reading_pace: ReadingPaceData;
}

export interface DailyReadingActivity {
  date: string; // YYYY-MM-DD
  pages_read: number;
  books_finished: number;
  reading_time_minutes: number;
}

export interface GenreCount {
  genre: string;
  count: number;
}

export interface ReadingPaceData {
  average_pages_per_day: number;
  average_books_per_month: number;
  estimated_completion_date?: Date;
  reading_velocity_trend: 'increasing' | 'decreasing' | 'stable';
}

// ========================================
// Form Types
// ========================================

export interface BookSearchFilters {
  status?: ReadingStatus[];
  type?: BookType[];
  rating_min?: number;
  rating_max?: number;
  page_count_min?: number;
  page_count_max?: number;
  date_added_from?: Date;
  date_added_to?: Date;
  tags?: string[];
  collections?: string[];
}

export interface UserBookFormData {
  book_type: BookType;
  status: ReadingStatus;
  current_page: number;
  total_pages?: number;
  rating?: number;
  review?: string;
  tags: string[];
  location?: string;
  start_date?: Date;
}

// ========================================
// Utility Types
// ========================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithTimestamps<T> = T & {
  created_at: Date;
  updated_at: Date;
};

export type OptionalId<T> = Omit<T, 'id'> & { id?: string };

// ========================================
// Component Props Types
// ========================================

export interface BookCardProps {
  userBook: UserBook;
  displayMode: 'grid' | 'list';
  onStatusChange?: (status: ReadingStatus) => void;
  onProgressUpdate?: (pages: number) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export interface ProgressBarProps {
  current: number;
  total: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showPercentage?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  filters?: BookSearchFilters;
  onFiltersChange?: (filters: BookSearchFilters) => void;
  loading?: boolean;
}