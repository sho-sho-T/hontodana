-- ========================================
-- hontodana Database Schema
-- PostgreSQL with Supabase Extensions
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- Users Table (Supabase Auth integration)
-- ========================================

-- User preferences and profile
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    theme TEXT CHECK (theme IN ('light', 'dark', 'system')) DEFAULT 'system',
    display_mode TEXT CHECK (display_mode IN ('grid', 'list')) DEFAULT 'grid',
    books_per_page INTEGER DEFAULT 20 CHECK (books_per_page > 0 AND books_per_page <= 100),
    default_book_type TEXT CHECK (default_book_type IN ('physical', 'kindle', 'epub', 'audiobook', 'other')) DEFAULT 'physical',
    reading_goal INTEGER CHECK (reading_goal > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ========================================
-- Books Master Table
-- ========================================

CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_books_id TEXT UNIQUE,
    title TEXT NOT NULL,
    authors TEXT[] NOT NULL DEFAULT '{}',
    publisher TEXT,
    published_date TEXT, -- Using TEXT for flexible date formats from Google Books API
    isbn_10 TEXT,
    isbn_13 TEXT,
    page_count INTEGER CHECK (page_count > 0),
    language TEXT NOT NULL DEFAULT 'ja',
    description TEXT,
    thumbnail_url TEXT,
    preview_link TEXT,
    info_link TEXT,
    categories TEXT[] DEFAULT '{}',
    average_rating DECIMAL(2,1) CHECK (average_rating >= 0 AND average_rating <= 5),
    ratings_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for books table
CREATE INDEX idx_books_google_books_id ON books(google_books_id);
CREATE INDEX idx_books_title ON books USING GIN (to_tsvector('japanese', title));
CREATE INDEX idx_books_authors ON books USING GIN (authors);
CREATE INDEX idx_books_categories ON books USING GIN (categories);
CREATE INDEX idx_books_isbn_10 ON books(isbn_10);
CREATE INDEX idx_books_isbn_13 ON books(isbn_13);

-- ========================================
-- User Books (Library) Table
-- ========================================

CREATE TYPE book_type AS ENUM ('physical', 'kindle', 'epub', 'audiobook', 'other');
CREATE TYPE reading_status AS ENUM ('want_to_read', 'reading', 'completed', 'paused', 'abandoned', 'reference');

CREATE TABLE user_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    book_type book_type NOT NULL DEFAULT 'physical',
    status reading_status NOT NULL DEFAULT 'want_to_read',
    current_page INTEGER DEFAULT 0 CHECK (current_page >= 0),
    start_date DATE,
    finish_date DATE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    notes TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    acquired_date DATE,
    location TEXT, -- 物理書籍の保管場所
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, book_id, book_type),
    CHECK (
        CASE 
            WHEN status = 'completed' THEN finish_date IS NOT NULL
            WHEN status IN ('reading', 'paused') THEN start_date IS NOT NULL
            ELSE TRUE
        END
    ),
    CHECK (current_page <= (SELECT page_count FROM books WHERE books.id = book_id))
);

-- RLS policies for user_books
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own books"
    ON user_books FOR ALL
    USING (auth.uid() = user_id);

-- Indexes for user_books table
CREATE INDEX idx_user_books_user_id ON user_books(user_id);
CREATE INDEX idx_user_books_book_id ON user_books(book_id);
CREATE INDEX idx_user_books_status ON user_books(status);
CREATE INDEX idx_user_books_book_type ON user_books(book_type);
CREATE INDEX idx_user_books_rating ON user_books(rating);
CREATE INDEX idx_user_books_tags ON user_books USING GIN (tags);
CREATE INDEX idx_user_books_is_favorite ON user_books(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_user_books_created_at ON user_books(created_at);

-- ========================================
-- Reading Sessions Table
-- ========================================

CREATE TABLE reading_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_book_id UUID NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    start_page INTEGER NOT NULL CHECK (start_page >= 0),
    end_page INTEGER NOT NULL CHECK (end_page >= start_page),
    pages_read INTEGER GENERATED ALWAYS AS (end_page - start_page + 1) STORED,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for reading_sessions
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reading sessions"
    ON reading_sessions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_books 
            WHERE user_books.id = reading_sessions.user_book_id 
            AND user_books.user_id = auth.uid()
        )
    );

-- Indexes for reading_sessions table
CREATE INDEX idx_reading_sessions_user_book_id ON reading_sessions(user_book_id);
CREATE INDEX idx_reading_sessions_session_date ON reading_sessions(session_date);
CREATE INDEX idx_reading_sessions_created_at ON reading_sessions(created_at);

-- ========================================
-- Wishlist Table
-- ========================================

CREATE TYPE wishlist_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    priority wishlist_priority DEFAULT 'medium',
    reason TEXT,
    target_date DATE,
    price_alert DECIMAL(10,2) CHECK (price_alert > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, book_id)
);

-- RLS policies for wishlist_items
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist"
    ON wishlist_items FOR ALL
    USING (auth.uid() = user_id);

-- Indexes for wishlist_items table
CREATE INDEX idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX idx_wishlist_items_book_id ON wishlist_items(book_id);
CREATE INDEX idx_wishlist_items_priority ON wishlist_items(priority);
CREATE INDEX idx_wishlist_items_target_date ON wishlist_items(target_date);

-- ========================================
-- Collections Table
-- ========================================

CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6', -- Hex color code
    icon TEXT DEFAULT '📚', -- Emoji or icon name
    is_public BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, name)
);

-- RLS policies for collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own collections"
    ON collections FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections"
    ON collections FOR SELECT
    USING (is_public = TRUE);

-- Indexes for collections table
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_is_public ON collections(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_collections_sort_order ON collections(sort_order);

-- ========================================
-- Collection Books Junction Table
-- ========================================

CREATE TABLE collection_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    user_book_id UUID NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(collection_id, user_book_id)
);

-- RLS policies for collection_books
ALTER TABLE collection_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage books in own collections"
    ON collection_books FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE collections.id = collection_books.collection_id 
            AND collections.user_id = auth.uid()
        )
    );

-- Indexes for collection_books table
CREATE INDEX idx_collection_books_collection_id ON collection_books(collection_id);
CREATE INDEX idx_collection_books_user_book_id ON collection_books(user_book_id);
CREATE INDEX idx_collection_books_sort_order ON collection_books(sort_order);

-- ========================================
-- Functions and Triggers
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_books_updated_at
    BEFORE UPDATE ON user_books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlist_items_updated_at
    BEFORE UPDATE ON wishlist_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update current_page when reading session is added
CREATE OR REPLACE FUNCTION update_current_page_from_session()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_books 
    SET current_page = NEW.end_page,
        updated_at = NOW()
    WHERE id = NEW.user_book_id 
    AND current_page < NEW.end_page;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_current_page_on_session_insert
    AFTER INSERT ON reading_sessions
    FOR EACH ROW EXECUTE FUNCTION update_current_page_from_session();

-- Function to automatically set reading dates based on status
CREATE OR REPLACE FUNCTION update_reading_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Set start_date when status changes to 'reading'
    IF OLD.status != 'reading' AND NEW.status = 'reading' AND NEW.start_date IS NULL THEN
        NEW.start_date = CURRENT_DATE;
    END IF;
    
    -- Set finish_date when status changes to 'completed'
    IF OLD.status != 'completed' AND NEW.status = 'completed' AND NEW.finish_date IS NULL THEN
        NEW.finish_date = CURRENT_DATE;
    END IF;
    
    -- Clear finish_date when status changes from 'completed'
    IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
        NEW.finish_date = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reading_dates_on_status_change
    BEFORE UPDATE ON user_books
    FOR EACH ROW EXECUTE FUNCTION update_reading_dates();

-- ========================================
-- Views for Statistics and Analytics
-- ========================================

-- View for reading statistics per user
CREATE VIEW user_reading_stats AS
SELECT 
    user_id,
    COUNT(*) as total_books,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_books,
    COUNT(*) FILTER (WHERE status = 'reading') as reading_books,
    COUNT(*) FILTER (WHERE status = 'want_to_read') as want_to_read_books,
    COUNT(*) FILTER (WHERE is_favorite = TRUE) as favorite_books,
    AVG(rating) FILTER (WHERE rating IS NOT NULL) as average_rating,
    SUM(current_page) as total_pages_read
FROM user_books
GROUP BY user_id;

-- View for daily reading activity
CREATE VIEW daily_reading_activity AS
SELECT 
    ub.user_id,
    rs.session_date,
    SUM(rs.pages_read) as pages_read,
    COUNT(DISTINCT rs.user_book_id) as books_touched,
    SUM(rs.duration_minutes) as total_minutes
FROM reading_sessions rs
JOIN user_books ub ON rs.user_book_id = ub.id
GROUP BY ub.user_id, rs.session_date;

-- View for genre statistics
CREATE VIEW user_genre_stats AS
SELECT 
    ub.user_id,
    unnest(b.categories) as genre,
    COUNT(*) as book_count,
    COUNT(*) FILTER (WHERE ub.status = 'completed') as completed_count,
    AVG(ub.rating) FILTER (WHERE ub.rating IS NOT NULL) as average_rating
FROM user_books ub
JOIN books b ON ub.book_id = b.id
WHERE array_length(b.categories, 1) > 0
GROUP BY ub.user_id, unnest(b.categories);

-- ========================================
-- Indexes for Performance Optimization
-- ========================================

-- Composite indexes for common queries
CREATE INDEX idx_user_books_user_status ON user_books(user_id, status);
CREATE INDEX idx_user_books_user_type ON user_books(user_id, book_type);
CREATE INDEX idx_user_books_user_favorite ON user_books(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_user_books_status_rating ON user_books(status, rating) WHERE rating IS NOT NULL;

-- Full-text search indexes
CREATE INDEX idx_books_full_text ON books USING GIN (
    to_tsvector('japanese', 
        COALESCE(title, '') || ' ' || 
        COALESCE(array_to_string(authors, ' '), '') || ' ' ||
        COALESCE(description, '')
    )
);

-- ========================================
-- Sample Data Insertion Functions
-- ========================================

-- Function to create a sample user profile
CREATE OR REPLACE FUNCTION create_sample_user_profile(
    user_id UUID,
    user_name TEXT,
    user_email TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_profiles (id, name)
    VALUES (user_id, user_name)
    ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Materialized Views for Performance (Optional)
-- ========================================

-- Materialized view for user reading progress (for dashboard)
CREATE MATERIALIZED VIEW user_reading_progress AS
SELECT 
    ub.user_id,
    COUNT(*) as total_books,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_books,
    COUNT(*) FILTER (WHERE status = 'reading') as reading_books,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as completion_rate,
    COALESCE(SUM(current_page), 0) as total_pages_read,
    EXTRACT(YEAR FROM NOW()) as year
FROM user_books ub
GROUP BY ub.user_id, EXTRACT(YEAR FROM NOW());

-- Index for materialized view
CREATE UNIQUE INDEX idx_user_reading_progress_user_year 
ON user_reading_progress(user_id, year);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_reading_progress() 
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_reading_progress;
END;
$$ LANGUAGE plpgsql;