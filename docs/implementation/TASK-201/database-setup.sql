-- TASK-201: 検索・フィルタリング機能用データベース設定

-- 全文検索インデックスを作成
CREATE INDEX IF NOT EXISTS books_search_idx ON books 
USING GIN(to_tsvector('japanese', 
  title || ' ' || 
  array_to_string(authors, ' ') || ' ' || 
  COALESCE(description, '')
));

-- 複合インデックス（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS user_books_search_idx ON user_books (user_id, status, created_at);
CREATE INDEX IF NOT EXISTS user_books_progress_idx ON user_books (user_id, current_page, book_id);

-- カテゴリ検索用インデックス
CREATE INDEX IF NOT EXISTS books_categories_idx ON books USING GIN(categories);

-- 日付範囲検索用インデックス
CREATE INDEX IF NOT EXISTS user_books_created_at_idx ON user_books (created_at);

-- 評価検索用インデックス（NULLを除く）
CREATE INDEX IF NOT EXISTS user_books_rating_idx ON user_books (rating) WHERE rating IS NOT NULL;