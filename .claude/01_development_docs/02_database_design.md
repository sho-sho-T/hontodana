# データベース設計書

## 1. データベース全体設計

### 1.1 データベース選択理由
- **Supabase（PostgreSQL）**: リアルタイム機能・認証・ストレージの統合管理
- **PostgreSQL**: ACID特性・豊富な型・JSON対応・全文検索機能

### 1.2 命名規則
- **テーブル名**: スネークケース（単数形）例: `user`, `book`, `reading_record`
- **カラム名**: スネークケース 例: `created_at`, `updated_at`, `user_id`
- **インデックス名**: `idx_{table}_{column(s)}` 例: `idx_book_user_id`
- **外部キー制約**: `fk_{table}_{referenced_table}` 例: `fk_book_user`

## 2. テーブル設計

### 2.1 ユーザー管理

#### users（ユーザー）
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  profile_image_url TEXT,
  bio TEXT,
  reading_preferences JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{"profile_public": true, "reading_records_public": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### user_follows（フォロー関係）
```sql
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

-- インデックス
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
```

### 2.2 書籍管理

#### books（書籍）
```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_books_id VARCHAR(255),
  isbn VARCHAR(20),
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  publisher VARCHAR(255),
  published_date DATE,
  page_count INTEGER CHECK(page_count > 0),
  book_type VARCHAR(20) NOT NULL CHECK(book_type IN ('PHYSICAL', 'DIGITAL')),
  cover_image_url TEXT,
  description TEXT,
  language VARCHAR(10) DEFAULT 'ja',
  purchase_date DATE,
  purchase_price INTEGER CHECK(purchase_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_title ON books USING gin(to_tsvector('japanese', title));
CREATE INDEX idx_books_author ON books USING gin(to_tsvector('japanese', author));
CREATE INDEX idx_books_book_type ON books(book_type);
CREATE INDEX idx_books_created_at ON books(created_at);
CREATE INDEX idx_books_google_books_id ON books(google_books_id);
```

#### book_tags（書籍タグ）
```sql
CREATE TABLE book_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(book_id, tag_name)
);

-- インデックス
CREATE INDEX idx_book_tags_book_id ON book_tags(book_id);
CREATE INDEX idx_book_tags_name ON book_tags(tag_name);
```

#### genres（ジャンル）
```sql
CREATE TABLE genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  parent_id UUID REFERENCES genres(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_genres_parent_id ON genres(parent_id);
```

#### book_genres（書籍ジャンル関連）
```sql
CREATE TABLE book_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(book_id, genre_id)
);

-- インデックス
CREATE INDEX idx_book_genres_book_id ON book_genres(book_id);
CREATE INDEX idx_book_genres_genre_id ON book_genres(genre_id);
```

### 2.3 読書記録管理

#### reading_records（読書記録）
```sql
CREATE TABLE reading_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK(status IN ('NOT_STARTED', 'READING', 'COMPLETED', 'PAUSED', 'REREADING')),
  current_page INTEGER DEFAULT 0 CHECK(current_page >= 0),
  start_date DATE,
  completed_date DATE,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  review TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(book_id, user_id),
  CHECK(completed_date IS NULL OR start_date IS NULL OR completed_date >= start_date)
);

-- インデックス
CREATE INDEX idx_reading_records_book_id ON reading_records(book_id);
CREATE INDEX idx_reading_records_user_id ON reading_records(user_id);
CREATE INDEX idx_reading_records_status ON reading_records(status);
CREATE INDEX idx_reading_records_completed_date ON reading_records(completed_date);
CREATE INDEX idx_reading_records_rating ON reading_records(rating);
CREATE INDEX idx_reading_records_is_public ON reading_records(is_public);
```

#### reading_sessions（読書セッション）
```sql
CREATE TABLE reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_record_id UUID NOT NULL REFERENCES reading_records(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  pages_read INTEGER DEFAULT 0 CHECK(pages_read >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK(end_time IS NULL OR end_time > start_time)
);

-- インデックス
CREATE INDEX idx_reading_sessions_record_id ON reading_sessions(reading_record_id);
CREATE INDEX idx_reading_sessions_start_time ON reading_sessions(start_time);
```

#### reading_notes（読書メモ）
```sql
CREATE TABLE reading_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_record_id UUID NOT NULL REFERENCES reading_records(id) ON DELETE CASCADE,
  page_number INTEGER CHECK(page_number > 0),
  note_text TEXT NOT NULL,
  note_type VARCHAR(20) DEFAULT 'GENERAL' CHECK(note_type IN ('GENERAL', 'QUOTE', 'REFLECTION', 'QUESTION')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_reading_notes_record_id ON reading_notes(reading_record_id);
CREATE INDEX idx_reading_notes_page_number ON reading_notes(page_number);
CREATE INDEX idx_reading_notes_type ON reading_notes(note_type);
```

### 2.4 ソーシャル機能

#### likes（いいね）
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK(target_type IN ('READING_RECORD', 'READING_NOTE')),
  target_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, target_type, target_id)
);

-- インデックス
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_target ON likes(target_type, target_id);
```

## 3. ビュー設計

### 3.1 書籍統計ビュー
```sql
CREATE VIEW book_statistics AS
SELECT 
  u.id as user_id,
  u.username,
  COUNT(b.id) as total_books,
  COUNT(CASE WHEN b.book_type = 'PHYSICAL' THEN 1 END) as physical_books,
  COUNT(CASE WHEN b.book_type = 'DIGITAL' THEN 1 END) as digital_books,
  COUNT(CASE WHEN rr.status = 'COMPLETED' THEN 1 END) as completed_books,
  COUNT(CASE WHEN rr.status = 'READING' THEN 1 END) as reading_books,
  AVG(CASE WHEN rr.rating IS NOT NULL THEN rr.rating END) as average_rating
FROM users u
LEFT JOIN books b ON u.id = b.user_id
LEFT JOIN reading_records rr ON b.id = rr.book_id
GROUP BY u.id, u.username;
```

### 3.2 読書活動フィードビュー
```sql
CREATE VIEW reading_activity_feed AS
SELECT 
  'BOOK_ADDED' as activity_type,
  b.user_id,
  b.id as target_id,
  b.title as title,
  b.author as subtitle,
  b.cover_image_url as image_url,
  b.created_at as activity_date
FROM books b
WHERE b.created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'BOOK_COMPLETED' as activity_type,
  rr.user_id,
  rr.book_id as target_id,
  b.title as title,
  CASE WHEN rr.rating IS NOT NULL THEN CONCAT('評価: ', rr.rating, '★') ELSE '' END as subtitle,
  b.cover_image_url as image_url,
  rr.completed_date as activity_date
FROM reading_records rr
JOIN books b ON rr.book_id = b.id
WHERE rr.status = 'COMPLETED' 
  AND rr.completed_date >= NOW() - INTERVAL '30 days'

ORDER BY activity_date DESC;
```

## 4. RLS（Row Level Security）設定

### 4.1 ユーザーデータ保護
```sql
-- ユーザーは自分のデータのみアクセス可能
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### 4.2 書籍データ保護
```sql
-- ユーザーは自分の書籍のみ操作可能
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own books" ON books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books" ON books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (auth.uid() = user_id);
```

### 4.3 読書記録保護
```sql
-- 読書記録の公開設定に応じたアクセス制御
ALTER TABLE reading_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading records" ON reading_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public reading records" ON reading_records
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage own reading records" ON reading_records
  FOR ALL USING (auth.uid() = user_id);
```

## 5. トリガー設定

### 5.1 更新日時自動更新
```sql
-- 汎用的な更新日時トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガー設定
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at 
  BEFORE UPDATE ON books 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_records_updated_at 
  BEFORE UPDATE ON reading_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 読書統計更新トリガー
```sql
-- 読書記録変更時の統計更新
CREATE OR REPLACE FUNCTION update_reading_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- ここで必要に応じて統計テーブルを更新
  -- 現在はリアルタイム計算を想定しているため省略
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stats_on_reading_record_change
  AFTER INSERT OR UPDATE OR DELETE ON reading_records
  FOR EACH ROW EXECUTE FUNCTION update_reading_statistics();
```

## 6. パフォーマンス最適化

### 6.1 インデックス戦略
- **検索用インデックス**: 全文検索（GIN）インデックス
- **外部キーインデックス**: JOIN操作の最適化
- **複合インデックス**: よく使われるフィルター条件の組み合わせ

### 6.2 パーティショニング検討
```sql
-- 将来的な読書記録の月別パーティショニング（データ量増加時）
-- CREATE TABLE reading_records_y2024m01 PARTITION OF reading_records
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## 7. バックアップ・復旧戦略

### 7.1 自動バックアップ
- **Supabaseの自動バックアップ**: 日次フルバックアップ
- **重要データのレプリケーション**: ユーザーデータ・読書記録

### 7.2 データ移行計画
- **初期データインポート**: CSVインポート機能
- **他サービスからの移行**: 読書メーター・ブクログからのデータ移行ツール

## 8. データ整合性制約

### 8.1 ビジネスルール制約
- 読書記録の完読日は開始日以降である必要がある
- ページ数は正の整数である必要がある
- 評価は1-5の範囲内である必要がある
- ユーザーは自分自身をフォローできない

### 8.2 参照整合性
- 外部キー制約による参照整合性の保証
- CASCADE削除による関連データの自動削除