CREATE TABLE IF NOT EXISTS "lineup_custom_entries" (
  "id"           SERIAL NOT NULL,
  "brand"        TEXT NOT NULL DEFAULT '기타',
  "title"        TEXT NOT NULL,
  "image_url"    TEXT,
  "store_date"   TEXT,
  "online_date"  TEXT,
  "url"          TEXT,
  "submitted_by" TEXT,
  "year"         INTEGER NOT NULL,
  "month"        INTEGER NOT NULL,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lineup_custom_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lineup_custom_entries_year_month_idx"
  ON "lineup_custom_entries"("year", "month");
