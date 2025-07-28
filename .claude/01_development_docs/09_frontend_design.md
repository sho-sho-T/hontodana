# フロントエンド設計書

## 1. フロントエンド全体アーキテクチャ

### 1.1 技術スタック
- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript 5.x
- **スタイリング**: Tailwind CSS + shadcn/ui
- **状態管理**: Zustand + React Query
- **フォーム**: React Hook Form + Zod
- **アニメーション**: Framer Motion

### 1.2 ディレクトリ構成
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証関連ルート
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/                # ダッシュボード
│   ├── books/                    # 書籍管理
│   │   ├── [id]/
│   │   └── add/
│   ├── globals.css               # グローバルスタイル
│   ├── layout.tsx                # ルートレイアウト
│   └── page.tsx                  # ホームページ
├── components/                   # コンポーネント
│   ├── ui/                       # 基本UIコンポーネント
│   ├── features/                 # 機能別コンポーネント
│   │   ├── auth/
│   │   ├── books/
│   │   ├── dashboard/
│   │   └── social/
│   ├── layouts/                  # レイアウトコンポーネント
│   └── providers/                # プロバイダーコンポーネント
├── hooks/                        # カスタムフック
├── lib/                          # ユーティリティライブラリ
├── stores/                       # 状態管理ストア
└── types/                        # 型定義
```

## 2. コンポーネント設計原則

### 2.1 コンポーネント分類

#### UI Components（基本UIコンポーネント）
```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

#### Feature Components（機能別コンポーネント）
```typescript
// components/features/books/BookCard.tsx
interface BookCardProps {
  book: Book;
  readingRecord?: ReadingRecord;
  showProgress?: boolean;
  showActions?: boolean;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
  onClick?: (book: Book) => void;
}

export function BookCard({
  book,
  readingRecord,
  showProgress = false,
  showActions = false,
  onEdit,
  onDelete,
  onClick,
}: BookCardProps) {
  return (
    <Card className="group cursor-pointer transition-all hover:shadow-lg">
      <CardContent className="p-4">
        <div className="aspect-[3/4] relative mb-3">
          <Image
            src={book.coverImageUrl || '/placeholder-book.png'}
            alt={`${book.title}の表紙`}
            fill
            className="object-cover rounded-md"
          />
          {showProgress && readingRecord && (
            <div className="absolute bottom-2 left-2 right-2">
              <Progress 
                value={readingRecord.progress.percentage} 
                className="h-2 bg-white/20"
              />
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="text-muted-foreground text-xs line-clamp-1 mb-2">
          {book.author}
        </p>
        
        {showProgress && readingRecord && (
          <div className="text-xs text-muted-foreground">
            {readingRecord.progress.currentPage} / {readingRecord.progress.totalPages} ページ
          </div>
        )}

        {showActions && (
          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" onClick={() => onEdit?.(book)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete?.(book)}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### Layout Components（レイアウトコンポーネント）
```typescript
// components/layouts/MainLayout.tsx
interface MainLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}

export function MainLayout({ children, sidebar, header }: MainLayoutProps) {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {header || <MainHeader onMenuClick={toggleSidebar} />}
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "w-64 shrink-0 border-r bg-muted/10 transition-transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}>
          {sidebar || <MainSidebar />}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### 2.2 コンポーネント設計パターン

#### Compound Components（複合コンポーネント）
```typescript
// components/features/books/BookshelfView.tsx
const BookshelfView = {
  Root: BookshelfRoot,
  Toolbar: BookshelfToolbar,
  Filters: BookshelfFilters,
  Grid: BookshelfGrid,
  List: BookshelfList,
  Empty: BookshelfEmpty,
};

// 使用例
<BookshelfView.Root>
  <BookshelfView.Toolbar>
    <BookshelfView.Filters />
  </BookshelfView.Toolbar>
  
  {books.length > 0 ? (
    <BookshelfView.Grid books={books} />
  ) : (
    <BookshelfView.Empty />
  )}
</BookshelfView.Root>
```

#### Render Props Pattern
```typescript
// components/features/data/DataFetcher.tsx
interface DataFetcherProps<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  children: (data: {
    data: T | undefined;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
  }) => React.ReactNode;
}

export function DataFetcher<T>({ queryKey, queryFn, children }: DataFetcherProps<T>) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn,
  });

  return children({
    data,
    loading: isLoading,
    error,
    refetch,
  });
}
```

## 3. 状態管理設計

### 3.1 Zustand ストア設計

#### UI状態管理
```typescript
// stores/ui.ts
interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  notifications: Notification[];
  modals: {
    bookForm: boolean;
    deleteConfirm: boolean;
  };
}

interface UIActions {
  setTheme: (theme: UIState['theme']) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarOpen: false,
      notifications: [],
      modals: {
        bookForm: false,
        deleteConfirm: false,
      },

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [
          ...state.notifications,
          { ...notification, id: nanoid() }
        ]
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),

      openModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: true }
      })),
      
      closeModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: false }
      })),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
```

#### アプリケーション状態管理
```typescript
// stores/auth.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false 
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  logout: () => set({ 
    user: null, 
    isAuthenticated: false 
  }),
}));
```

### 3.2 React Query統合

#### カスタムフック設計
```typescript
// hooks/useBooks.ts
export function useBooks(filters?: BookFilters) {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['books', user?.id, filters],
    queryFn: () => bookService.getBooks(filters),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5分
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: bookService.createBook,
    onSuccess: (newBook) => {
      // キャッシュ更新
      queryClient.setQueryData(
        ['books', user?.id],
        (old: Book[] = []) => [...old, newBook]
      );
      
      // 関連キャッシュ無効化
      queryClient.invalidateQueries({ queryKey: ['books'] });
      
      toast.success('書籍を登録しました');
    },
    onError: (error) => {
      toast.error(error.message || '書籍の登録に失敗しました');
    },
  });
}

export function useUpdateReadingProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookId, progress }: { bookId: string; progress: Partial<ReadingProgress> }) =>
      readingService.updateProgress(bookId, progress),
    
    onMutate: async ({ bookId, progress }) => {
      // 楽観的更新
      await queryClient.cancelQueries({ queryKey: ['reading-record', bookId] });
      
      const previous = queryClient.getQueryData(['reading-record', bookId]);
      
      queryClient.setQueryData(['reading-record', bookId], (old: ReadingRecord) => ({
        ...old,
        ...progress,
        updatedAt: new Date(),
      }));

      return { previous };
    },
    
    onError: (err, variables, context) => {
      // ロールバック
      if (context?.previous) {
        queryClient.setQueryData(['reading-record', variables.bookId], context.previous);
      }
    },
    
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reading-record', variables.bookId] });
    },
  });
}
```

## 4. フォーム設計

### 4.1 React Hook Form + Zod統合

#### フォームスキーマ定義
```typescript
// lib/validations/book.ts
export const bookSchema = z.object({
  title: z.string()
    .min(1, '書籍タイトルは必須です')
    .max(200, '書籍タイトルは200文字以内で入力してください'),
  
  author: z.string()
    .min(1, '著者は必須です')
    .max(100, '著者は100文字以内で入力してください'),
  
  isbn: z.string()
    .regex(/^(?:\d{10}|\d{13})$/, 'ISBNは10桁または13桁の数字で入力してください')
    .optional(),
  
  pageCount: z.number()
    .min(1, 'ページ数は1以上の数値を入力してください')
    .max(10000, 'ページ数が上限を超えています')
    .optional(),
  
  bookType: z.nativeEnum(BookType),
  
  description: z.string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional(),
  
  tags: z.array(z.string()).default([]),
});

export type BookFormData = z.infer<typeof bookSchema>;
```

#### カスタムフォームフック
```typescript
// hooks/useBookForm.ts
interface UseBookFormProps {
  book?: Book;
  onSubmit: (data: BookFormData) => Promise<void>;
}

export function useBookForm({ book, onSubmit }: UseBookFormProps) {
  const form = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: book?.title || '',
      author: book?.author || '',
      isbn: book?.isbn || '',
      pageCount: book?.pageCount || undefined,
      bookType: book?.bookType || BookType.PHYSICAL,
      description: book?.description || '',
      tags: book?.tags?.map(tag => tag.name) || [],
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      // エラーハンドリングは上位コンポーネントで行う
      throw error;
    }
  });

  return {
    form,
    handleSubmit,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    isSubmitting: form.formState.isSubmitting,
  };
}
```

#### フォームコンポーネント
```typescript
// components/features/books/BookForm.tsx
interface BookFormProps {
  book?: Book;
  mode: 'create' | 'edit';
  onSubmit: (data: BookFormData) => Promise<void>;
  onCancel?: () => void;
}

export function BookForm({ book, mode, onSubmit, onCancel }: BookFormProps) {
  const { form, handleSubmit, isSubmitting } = useBookForm({ book, onSubmit });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>書籍タイトル</FormLabel>
              <FormControl>
                <Input placeholder="書籍のタイトルを入力" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>著者</FormLabel>
              <FormControl>
                <Input placeholder="著者名を入力" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bookType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>書籍種別</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="書籍種別を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={BookType.PHYSICAL}>物理本</SelectItem>
                  <SelectItem value={BookType.DIGITAL}>電子書籍</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? '登録' : '更新'}
          </Button>
          
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
```

## 5. スタイリング設計

### 5.1 Tailwind CSS設定

#### カスタムテーマ設定
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/line-clamp')],
};

export default config;
```

### 5.2 CSS Variables設定
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  .book-grid {
    @apply grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6;
  }
  
  .reading-progress-bar {
    @apply relative h-2 w-full overflow-hidden rounded-full bg-secondary;
  }
  
  .reading-progress-fill {
    @apply h-full w-full flex-1 bg-primary transition-all;
  }
}
```

## 6. アニメーション設計

### 6.1 Framer Motion統合
```typescript
// components/ui/AnimatedPage.tsx
interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 使用例
export default function DashboardPage() {
  return (
    <AnimatedPage>
      <div className="space-y-6">
        <h1>ダッシュボード</h1>
        {/* コンテンツ */}
      </div>
    </AnimatedPage>
  );
}
```

### 6.2 マイクロインタラクション
```typescript
// components/features/books/AnimatedBookCard.tsx
export function AnimatedBookCard({ book, ...props }: BookCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <BookCard book={book} {...props} />
    </motion.div>
  );
}
```

## 7. レスポンシブデザイン

### 7.1 ブレークポイント戦略
```typescript
// lib/responsive.ts
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState<keyof typeof breakpoints>('sm');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width >= 1536) setScreenSize('2xl');
      else if (width >= 1280) setScreenSize('xl');
      else if (width >= 1024) setScreenSize('lg');
      else if (width >= 768) setScreenSize('md');
      else setScreenSize('sm');
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return {
    screenSize,
    isMobile: screenSize === 'sm',
    isTablet: screenSize === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(screenSize),
  };
};
```

### 7.2 レスポンシブコンポーネント
```typescript
// components/features/books/ResponsiveBookshelf.tsx
export function ResponsiveBookshelf({ books }: { books: Book[] }) {
  const { isMobile, isTablet } = useResponsive();

  if (isMobile) {
    return <BookList books={books} compact />;
  }

  if (isTablet) {
    return <BookGrid books={books} columns={3} />;
  }

  return <BookGrid books={books} columns={6} />;
}
```

## 8. パフォーマンス最適化

### 8.1 コードスプリッティング
```typescript
// app/books/page.tsx
import dynamic from 'next/dynamic';

// 重いコンポーネントの遅延読み込み
const BookEditor = dynamic(() => import('@/components/features/books/BookEditor'), {
  loading: () => <BookEditorSkeleton />,
  ssr: false,
});

const BookAnalytics = dynamic(() => import('@/components/features/books/BookAnalytics'), {
  loading: () => <AnalyticsSkeleton />,
});
```

### 8.2 画像最適化
```typescript
// components/ui/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false,
  className 
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    />
  );
}
```

### 8.3 仮想化（Virtual Scrolling）
```typescript
// components/features/books/VirtualizedBookList.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedBookListProps {
  books: Book[];
  itemHeight: number;
  height: number;
}

export function VirtualizedBookList({ books, itemHeight, height }: VirtualizedBookListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <BookListItem book={books[index]} />
    </div>
  );

  return (
    <List
      height={height}
      itemCount={books.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

この設計書により、保守性・パフォーマンス・ユーザビリティを兼ね備えたフロントエンドを構築できます。