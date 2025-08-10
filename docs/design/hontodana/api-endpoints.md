# API エンドポイント仕様

## 認証

すべてのAPIエンドポイントは Supabase Auth による JWT 認証を使用します。

### 共通ヘッダー
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### エラーレスポンス共通形式
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {}
  }
}
```

## 書籍検索・管理

### GET /api/books/search
Google Books API を使用した書籍検索

**リクエストパラメータ:**
```
?query=検索キーワード
&max_results=10
&start_index=0
&filter=ebooks|free-ebooks|full|paid-ebooks|partial
&order_by=newest|relevance
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "total_items": 100,
    "items": [
      {
        "id": "google_books_id",
        "title": "書籍タイトル",
        "authors": ["著者1", "著者2"],
        "publisher": "出版社",
        "published_date": "2023-01-01",
        "isbn_10": "1234567890",
        "isbn_13": "9781234567890",
        "page_count": 300,
        "language": "ja",
        "description": "書籍の説明",
        "thumbnail_url": "https://...",
        "categories": ["Fiction", "Drama"],
        "average_rating": 4.5,
        "ratings_count": 100
      }
    ]
  },
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_items": 100,
    "items_per_page": 10,
    "has_previous": false,
    "has_next": true
  }
}
```

### GET /api/books/:id
特定の書籍情報を取得

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "book_uuid",
    "google_books_id": "google_books_id",
    "title": "書籍タイトル",
    "authors": ["著者1"],
    "publisher": "出版社",
    "published_date": "2023-01-01",
    "page_count": 300,
    "description": "書籍の説明",
    "categories": ["Fiction"]
  }
}
```

## ユーザー本棚管理

### GET /api/library
ユーザーの本棚一覧を取得

**リクエストパラメータ:**
```
?status=reading|completed|want_to_read|paused|abandoned|reference
&book_type=physical|kindle|epub|audiobook|other
&sort=title_asc|title_desc|date_added_desc|progress_desc
&search=検索キーワード
&page=1
&limit=20
&collection_id=collection_uuid
```

**レスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_book_uuid",
      "book": {
        "id": "book_uuid",
        "title": "書籍タイトル",
        "authors": ["著者1"],
        "thumbnail_url": "https://...",
        "page_count": 300
      },
      "book_type": "physical",
      "status": "reading",
      "current_page": 150,
      "progress_percentage": 50.0,
      "rating": 4,
      "review": "面白い本です",
      "tags": ["推理小説", "おすすめ"],
      "is_favorite": true,
      "start_date": "2023-01-01",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 95,
    "items_per_page": 20,
    "has_previous": false,
    "has_next": true
  }
}
```

### POST /api/library
書籍を本棚に追加

**リクエストボディ:**
```json
{
  "google_books_id": "google_books_id",
  "book_data": {
    "title": "書籍タイトル",
    "authors": ["著者1"],
    "page_count": 300
  },
  "book_type": "physical",
  "status": "want_to_read",
  "current_page": 0,
  "tags": ["タグ1", "タグ2"],
  "location": "本棚A-1"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "user_book_uuid",
    "message": "書籍が本棚に追加されました"
  }
}
```

### PUT /api/library/:id
本棚の書籍情報を更新

**リクエストボディ:**
```json
{
  "status": "reading",
  "current_page": 150,
  "rating": 4,
  "review": "更新されたレビュー",
  "tags": ["更新されたタグ"],
  "is_favorite": true
}
```

### DELETE /api/library/:id
本棚から書籍を削除

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "message": "書籍が本棚から削除されました"
  }
}
```

## 読書進捗管理

### GET /api/progress/:userBookId
特定書籍の読書セッション履歴を取得

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "user_book": {
      "id": "user_book_uuid",
      "current_page": 150,
      "total_pages": 300,
      "progress_percentage": 50.0
    },
    "sessions": [
      {
        "id": "session_uuid",
        "start_page": 100,
        "end_page": 150,
        "pages_read": 51,
        "session_date": "2023-01-01",
        "duration_minutes": 60,
        "notes": "面白い展開でした"
      }
    ]
  }
}
```

### POST /api/progress
読書セッションを記録

**リクエストボディ:**
```json
{
  "user_book_id": "user_book_uuid",
  "start_page": 150,
  "end_page": 200,
  "session_date": "2023-01-01",
  "duration_minutes": 45,
  "notes": "今日の読書メモ"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "session_uuid",
    "pages_read": 51,
    "new_progress_percentage": 66.7,
    "message": "読書進捗が記録されました"
  }
}
```

### GET /api/statistics
ユーザーの読書統計を取得

**リクエストパラメータ:**
```
?period=week|month|year|all
&year=2023
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "reading_progress": {
      "total_books": 50,
      "completed_books": 30,
      "reading_books": 5,
      "pages_read_today": 25,
      "pages_read_this_week": 150,
      "pages_read_this_month": 600,
      "current_reading_streak": 7,
      "longest_reading_streak": 30
    },
    "books_by_status": {
      "completed": 30,
      "reading": 5,
      "want_to_read": 10,
      "paused": 3,
      "abandoned": 2
    },
    "books_by_type": {
      "physical": 35,
      "kindle": 10,
      "epub": 3,
      "audiobook": 2
    },
    "reading_activity": [
      {
        "date": "2023-01-01",
        "pages_read": 25,
        "books_finished": 1,
        "reading_time_minutes": 60
      }
    ],
    "top_genres": [
      {
        "genre": "Fiction",
        "count": 15
      },
      {
        "genre": "Mystery",
        "count": 8
      }
    ],
    "reading_pace": {
      "average_pages_per_day": 20.5,
      "average_books_per_month": 2.5,
      "estimated_completion_date": "2023-12-31",
      "reading_velocity_trend": "increasing"
    }
  }
}
```

## ウィッシュリスト管理

### GET /api/wishlist
ウィッシュリスト一覧を取得

**リクエストパラメータ:**
```
?priority=low|medium|high|urgent
&sort=priority_desc|date_added_desc|target_date_asc
&page=1
&limit=20
```

**レスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": "wishlist_uuid",
      "book": {
        "id": "book_uuid",
        "title": "欲しい本",
        "authors": ["著者1"],
        "thumbnail_url": "https://...",
        "page_count": 250
      },
      "priority": "high",
      "reason": "話題の本なので読んでみたい",
      "target_date": "2023-06-01",
      "price_alert": 1500,
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 25,
    "items_per_page": 20
  }
}
```

### POST /api/wishlist
ウィッシュリストに書籍を追加

**リクエストボディ:**
```json
{
  "google_books_id": "google_books_id",
  "book_data": {
    "title": "欲しい本",
    "authors": ["著者1"]
  },
  "priority": "high",
  "reason": "友人におすすめされた",
  "target_date": "2023-06-01",
  "price_alert": 1500
}
```

### PUT /api/wishlist/:id
ウィッシュリストアイテムを更新

**リクエストボディ:**
```json
{
  "priority": "urgent",
  "reason": "更新された理由",
  "target_date": "2023-05-01",
  "price_alert": 1200
}
```

### DELETE /api/wishlist/:id
ウィッシュリストから削除

### POST /api/wishlist/:id/move-to-library
ウィッシュリストから本棚に移動

**リクエストボディ:**
```json
{
  "book_type": "physical",
  "status": "want_to_read"
}
```

## コレクション管理

### GET /api/collections
ユーザーのコレクション一覧を取得

**レスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": "collection_uuid",
      "name": "お気に入りの推理小説",
      "description": "読んで面白かった推理小説集",
      "color": "#3B82F6",
      "icon": "🕵️",
      "is_public": false,
      "book_count": 15,
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/collections
新しいコレクションを作成

**リクエストボディ:**
```json
{
  "name": "SF小説コレクション",
  "description": "お気に入りのSF小説",
  "color": "#10B981",
  "icon": "🚀",
  "is_public": true
}
```

### PUT /api/collections/:id
コレクション情報を更新

### DELETE /api/collections/:id
コレクションを削除

### GET /api/collections/:id/books
コレクション内の書籍一覧を取得

### POST /api/collections/:id/books
コレクションに書籍を追加

**リクエストボディ:**
```json
{
  "user_book_id": "user_book_uuid"
}
```

### DELETE /api/collections/:id/books/:userBookId
コレクションから書籍を削除

## ユーザープロフィール管理

### GET /api/profile
ユーザープロフィールを取得

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "user_uuid",
    "name": "ユーザー名",
    "avatar_url": "https://...",
    "preferences": {
      "theme": "dark",
      "display_mode": "grid",
      "books_per_page": 20,
      "default_book_type": "physical",
      "reading_goal": 50
    }
  }
}
```

### PUT /api/profile
ユーザープロフィールを更新

**リクエストボディ:**
```json
{
  "name": "新しいユーザー名",
  "preferences": {
    "theme": "light",
    "display_mode": "list",
    "books_per_page": 30,
    "reading_goal": 60
  }
}
```

## エクスポート・インポート

### GET /api/export
ユーザーデータをエクスポート

**リクエストパラメータ:**
```
?format=json|csv|goodreads
&include=library|wishlist|collections|statistics|all
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "export_url": "https://storage.supabase.co/.../export.json",
    "expires_at": "2023-01-02T00:00:00Z"
  }
}
```

### POST /api/import
データをインポート

**リクエストボディ (multipart/form-data):**
```
file: [CSV/JSON file]
format: goodreads|json|csv
overwrite: true|false
```

## ヘルスチェック

### GET /api/health
APIの稼働状況を確認

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2023-01-01T00:00:00Z",
    "database": "connected",
    "google_books_api": "available"
  }
}
```

## レート制限

- **認証済みユーザー**: 1000 requests/hour
- **Google Books API**: 1000 requests/day/user
- **検索API**: 100 requests/minute/user

## Server Actions (Next.js)

Next.js Server Actions を使用した主要な操作:

### updateReadingProgress
```typescript
async function updateReadingProgress(
  userBookId: string, 
  currentPage: number
): Promise<{ success: boolean; data?: any; error?: string }>
```

### addBookToLibrary
```typescript
async function addBookToLibrary(
  bookData: CreateUserBookRequest
): Promise<{ success: boolean; data?: any; error?: string }>
```

### updateBookStatus
```typescript
async function updateBookStatus(
  userBookId: string, 
  status: ReadingStatus
): Promise<{ success: boolean; data?: any; error?: string }>
```

### createReadingSession
```typescript
async function createReadingSession(
  sessionData: CreateReadingSessionRequest
): Promise<{ success: boolean; data?: any; error?: string }>
```