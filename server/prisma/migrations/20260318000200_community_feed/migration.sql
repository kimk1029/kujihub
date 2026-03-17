CREATE TABLE IF NOT EXISTS "community_posts" (
  "id" SERIAL NOT NULL,
  "category" TEXT NOT NULL DEFAULT '자유',
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "author" TEXT NOT NULL DEFAULT '익명',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "community_feed_items" (
  "id" SERIAL NOT NULL,
  "type" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'community',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "author" TEXT,
  "link" TEXT,
  "post_id" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_feed_items_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_feed_items_post_id_fkey'
  ) THEN
    ALTER TABLE "community_feed_items"
      ADD CONSTRAINT "community_feed_items_post_id_fkey"
      FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "community_feed_items_created_at_idx" ON "community_feed_items"("created_at");
