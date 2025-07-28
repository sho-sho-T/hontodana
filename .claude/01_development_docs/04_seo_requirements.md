# SEO要件設計書

## 1. SEO戦略概要

### 1.1 SEO目標
- **有機検索流入の獲得**: 読書関連キーワードでの上位表示
- **ユーザー獲得**: 読書好きのライトユーザーの流入促進
- **ブランド認知向上**: 「hontodana」ブランドの認知度向上

### 1.2 ターゲットキーワード

#### プライマリキーワード
- 読書記録
- 読書管理
- 本棚アプリ
- 読書ログ

#### セカンダリキーワード
- 読書 アプリ おすすめ
- 本 管理 アプリ
- 読書 進捗管理
- 読書メーター 代替

#### ロングテールキーワード
- 読書記録 つけ方 アプリ
- 本棚 デジタル化 方法
- 読書習慣 継続 アプリ
- 書籍管理 アプリ 無料

## 2. テクニカルSEO設計

### 2.1 Next.js SEO最適化

#### App Router設定
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'hontodana - あなたの読書体験を見える化',
    template: '%s | hontodana'
  },
  description: '物理本・電子書籍を統合管理し、読書体験を向上させるWebアプリケーション',
  keywords: ['読書記録', '本棚管理', '読書アプリ', '書籍管理'],
  authors: [{ name: 'hontodana' }],
  creator: 'hontodana',
  publisher: 'hontodana',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://hontodana.com',
    siteName: 'hontodana',
    title: 'hontodana - あなたの読書体験を見える化',
    description: '物理本・電子書籍を統合管理し、読書体験を向上させるWebアプリケーション',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'hontodana',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@hontodana',
    creator: '@hontodana',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-verification-code',
  },
};
```

#### 動的メタタグ生成
```typescript
// app/books/[id]/page.tsx
export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const book = await getBook(params.id);
  
  if (!book) {
    return {
      title: '書籍が見つかりません',
    };
  }

  return {
    title: `${book.title} - ${book.author}`,
    description: `「${book.title}」の読書記録と詳細情報。${book.author}著。hontodanaで読書体験を管理しましょう。`,
    openGraph: {
      title: `${book.title} - ${book.author} | hontodana`,
      description: `「${book.title}」の読書記録をhontodanaで管理`,
      images: book.coverImageUrl ? [
        {
          url: book.coverImageUrl,
          width: 400,
          height: 600,
          alt: `${book.title}の表紙`,
        },
      ] : [],
    },
    twitter: {
      title: `${book.title} - ${book.author}`,
      description: `「${book.title}」の読書記録をhontodanaで管理`,
      images: book.coverImageUrl ? [book.coverImageUrl] : [],
    },
  };
}
```

### 2.2 構造化データ実装

#### 書籍情報（Book Schema）
```typescript
// components/StructuredData/BookSchema.tsx
interface BookSchemaProps {
  book: Book;
  rating?: number;
  reviewCount?: number;
}

export function BookSchema({ book, rating, reviewCount }: BookSchemaProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: {
      '@type': 'Person',
      name: book.author,
    },
    publisher: book.publisher,
    datePublished: book.publishedDate,
    isbn: book.isbn,
    numberOfPages: book.pageCount,
    image: book.coverImageUrl,
    description: book.description,
    ...(rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        ratingCount: reviewCount,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

#### レビュー情報（Review Schema）
```typescript
// components/StructuredData/ReviewSchema.tsx
interface ReviewSchemaProps {
  review: ReadingRecord;
  book: Book;
  user: User;
}

export function ReviewSchema({ review, book, user }: ReviewSchemaProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Book',
      name: book.title,
      author: book.author,
      isbn: book.isbn,
    },
    author: {
      '@type': 'Person',
      name: user.username,
    },
    reviewRating: review.rating ? {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
    } : undefined,
    reviewBody: review.review,
    datePublished: review.completedDate?.toISOString(),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

#### 組織情報（Organization Schema）
```typescript
// components/StructuredData/OrganizationSchema.tsx
export function OrganizationSchema() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'hontodana',
    url: 'https://hontodana.com',
    logo: 'https://hontodana.com/logo.png',
    description: '読書体験を向上させるWebアプリケーション',
    sameAs: [
      'https://twitter.com/hontodana',
      'https://github.com/hontodana',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
```

### 2.3 サイトマップ生成

#### 静的サイトマップ
```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hontodana.com';
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}
```

#### 動的サイトマップ（公開書籍）
```typescript
// app/sitemap-books.xml/route.ts
export async function GET() {
  const publicBooks = await getPublicBooks();
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${publicBooks.map(book => `
        <url>
          <loc>https://hontodana.com/books/${book.id}</loc>
          <lastmod>${book.updatedAt.toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.5</priority>
        </url>
      `).join('')}
    </urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
```

### 2.4 robots.txt設定
```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/books/*', '/auth/*'],
      disallow: ['/dashboard/', '/profile/', '/api/'],
    },
    sitemap: 'https://hontodana.com/sitemap.xml',
  };
}
```

## 3. コンテンツSEO戦略

### 3.1 ページ別SEO戦略

#### ランディングページ
- **H1**: 読書記録・本棚管理アプリ hontodana
- **メタディスクリプション**: 物理本・電子書籍を統合管理し、読書体験を向上させるWebアプリケーション（160文字以内）
- **コンテンツ戦略**: 機能紹介・メリット・ユーザーの声

#### 書籍詳細ページ
- **H1**: 書籍タイトル - 著者名
- **メタディスクリプション**: 書籍の読書記録と詳細情報
- **コンテンツ戦略**: 書籍情報・読書記録・レビュー

#### ユーザープロフィールページ（公開）
- **H1**: ユーザー名の読書記録
- **メタディスクリプション**: ユーザーの読書統計・最近の読書記録
- **コンテンツ戦略**: 読書統計・読了書籍・レビュー

### 3.2 コンテンツマーケティング

#### ブログコンテンツ
```typescript
// 将来的なブログ機能
const blogTopics = [
  '効果的な読書記録のつけ方',
  '読書習慣を継続するコツ',
  '本棚整理術',
  '読書アプリの選び方',
  '速読vs精読の使い分け',
];
```

#### ユーザー生成コンテンツ
- 読書レビューの充実化
- 読書目標の公開機能
- おすすめ本リストの作成機能

## 4. パフォーマンス最適化

### 4.1 Core Web Vitals対策

#### LCP（Largest Contentful Paint）
```typescript
// 画像最適化
import Image from 'next/image';

<Image
  src={book.coverImageUrl}
  alt={`${book.title}の表紙`}
  width={300}
  height={450}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

#### FID（First Input Delay）
- React 18のConcurrent Featuresを活用
- 重いコンポーネントの遅延読み込み
- インタラクション優先度の最適化

#### CLS（Cumulative Layout Shift）
- 画像サイズの事前指定
- フォント読み込みの最適化
- スケルトンローディングの実装

### 4.2 読み込み速度最適化
```typescript
// 動的インポート
const BookEditor = dynamic(() => import('@/components/BookEditor'), {
  loading: () => <BookEditorSkeleton />,
  ssr: false,
});

// プリフェッチ
<Link href="/books" prefetch={true}>
  本棚を見る
</Link>
```

## 5. モバイルSEO対策

### 5.1 レスポンシブデザイン
```css
/* モバイルファースト設計 */
.bookshelf-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 768px) {
  .bookshelf-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .bookshelf-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}
```

### 5.2 タッチ操作最適化
- ボタンサイズ：最小44px×44px
- スワイプジェスチャーの実装
- タップ可能領域の明確化

## 6. ローカルSEO対策

### 6.1 地域関連コンテンツ
- 地域の図書館情報連携（将来機能）
- 地域の読書会情報
- 地域の書店情報

### 6.2 構造化データ（Local Business）
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "hontodana",
  "url": "https://hontodana.com",
  "applicationCategory": "BookApplication",
  "operatingSystem": "Web",
  "description": "読書記録・本棚管理Webアプリケーション"
}
```

## 7. 国際化対応

### 7.1 多言語対応準備
```typescript
// 将来的な多言語対応
const i18nConfig = {
  locales: ['ja', 'en'],
  defaultLocale: 'ja',
  domains: [
    {
      domain: 'hontodana.com',
      defaultLocale: 'ja',
    },
    {
      domain: 'en.hontodana.com',
      defaultLocale: 'en',
    },
  ],
};
```

### 7.2 hreflang実装
```typescript
// 多言語ページのrel="alternate"
<link rel="alternate" hrefLang="ja" href="https://hontodana.com/books" />
<link rel="alternate" hrefLang="en" href="https://en.hontodana.com/books" />
<link rel="alternate" hrefLang="x-default" href="https://hontodana.com/books" />
```

## 8. 分析・監視設定

### 8.1 Google Analytics 4設定
```typescript
// gtag設定
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

export const pageview = (url: string) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

export const event = (action: string, parameters: any) => {
  window.gtag('event', action, parameters);
};
```

### 8.2 Google Search Console連携
- サイトマップ登録
- 検索パフォーマンス監視
- インデックス登録リクエスト

### 8.3 SEO KPI設定
- オーガニック検索流入数
- ターゲットキーワードランキング
- ページ滞在時間
- バウンス率
- コンバージョン率（新規登録）

## 9. SEO実装チェックリスト

### 9.1 テクニカルSEO
- [ ] メタタグ最適化
- [ ] 構造化データ実装
- [ ] サイトマップ生成
- [ ] robots.txt設定
- [ ] 内部リンク最適化
- [ ] URL構造最適化
- [ ] 404エラーページ対応

### 9.2 コンテンツSEO
- [ ] タイトルタグ最適化
- [ ] 見出しタグ階層化
- [ ] メタディスクリプション作成
- [ ] alt属性設定
- [ ] コンテンツ品質向上

### 9.3 パフォーマンス
- [ ] Core Web Vitals最適化
- [ ] 画像最適化
- [ ] CSS/JS最適化
- [ ] キャッシュ設定
- [ ] CDN設定