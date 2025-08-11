-- CreateEnum
CREATE TYPE "public"."BookType" AS ENUM ('physical', 'kindle', 'epub', 'audiobook', 'other');

-- CreateEnum
CREATE TYPE "public"."ReadingStatus" AS ENUM ('want_to_read', 'reading', 'completed', 'paused', 'abandoned', 'reference');

-- CreateEnum
CREATE TYPE "public"."WishlistPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateTable
CREATE TABLE "public"."user_profiles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "display_mode" TEXT NOT NULL DEFAULT 'grid',
    "books_per_page" INTEGER NOT NULL DEFAULT 20,
    "default_book_type" "public"."BookType" NOT NULL DEFAULT 'physical',
    "reading_goal" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."books" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "google_books_id" TEXT,
    "title" TEXT NOT NULL,
    "authors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publisher" TEXT,
    "published_date" TEXT,
    "isbn_10" TEXT,
    "isbn_13" TEXT,
    "page_count" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'ja',
    "description" TEXT,
    "thumbnail_url" TEXT,
    "preview_link" TEXT,
    "info_link" TEXT,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "average_rating" DECIMAL(2,1),
    "ratings_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_books" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "book_type" "public"."BookType" NOT NULL DEFAULT 'physical',
    "status" "public"."ReadingStatus" NOT NULL DEFAULT 'want_to_read',
    "current_page" INTEGER NOT NULL DEFAULT 0,
    "start_date" DATE,
    "finish_date" DATE,
    "rating" INTEGER,
    "review" TEXT,
    "notes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "acquired_date" DATE,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reading_sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_book_id" UUID NOT NULL,
    "start_page" INTEGER NOT NULL,
    "end_page" INTEGER NOT NULL,
    "pages_read" INTEGER NOT NULL,
    "session_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "duration_minutes" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wishlist_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "priority" "public"."WishlistPriority" NOT NULL DEFAULT 'medium',
    "reason" TEXT,
    "target_date" DATE,
    "price_alert" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."collections" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "icon" TEXT NOT NULL DEFAULT '📚',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."collection_books" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "collection_id" UUID NOT NULL,
    "user_book_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_books_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "books_google_books_id_key" ON "public"."books"("google_books_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_books_user_id_book_id_book_type_key" ON "public"."user_books"("user_id", "book_id", "book_type");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_user_id_book_id_key" ON "public"."wishlist_items"("user_id", "book_id");

-- CreateIndex
CREATE UNIQUE INDEX "collections_user_id_name_key" ON "public"."collections"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "collection_books_collection_id_user_book_id_key" ON "public"."collection_books"("collection_id", "user_book_id");

-- AddForeignKey
ALTER TABLE "public"."user_books" ADD CONSTRAINT "user_books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_books" ADD CONSTRAINT "user_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reading_sessions" ADD CONSTRAINT "reading_sessions_user_book_id_fkey" FOREIGN KEY ("user_book_id") REFERENCES "public"."user_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wishlist_items" ADD CONSTRAINT "wishlist_items_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collections" ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collection_books" ADD CONSTRAINT "collection_books_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collection_books" ADD CONSTRAINT "collection_books_user_book_id_fkey" FOREIGN KEY ("user_book_id") REFERENCES "public"."user_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
