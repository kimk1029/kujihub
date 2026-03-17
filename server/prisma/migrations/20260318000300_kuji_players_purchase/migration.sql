CREATE TABLE IF NOT EXISTS "kuji_players" (
  "id" TEXT NOT NULL,
  "nickname" TEXT NOT NULL DEFAULT '게스트',
  "points" INTEGER NOT NULL DEFAULT 100000,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kuji_players_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "kuji_purchases" (
  "id" TEXT NOT NULL,
  "kuji_id" INTEGER NOT NULL,
  "player_id" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "total_price" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "selected_slots" JSONB,
  "result_json" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kuji_purchases_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kuji_purchases_kuji_id_fkey'
  ) THEN
    ALTER TABLE "kuji_purchases"
      ADD CONSTRAINT "kuji_purchases_kuji_id_fkey"
      FOREIGN KEY ("kuji_id") REFERENCES "kujis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kuji_purchases_player_id_fkey'
  ) THEN
    ALTER TABLE "kuji_purchases"
      ADD CONSTRAINT "kuji_purchases_player_id_fkey"
      FOREIGN KEY ("player_id") REFERENCES "kuji_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "kuji_purchases_player_id_created_at_idx" ON "kuji_purchases"("player_id", "created_at");
CREATE INDEX IF NOT EXISTS "kuji_purchases_kuji_id_created_at_idx" ON "kuji_purchases"("kuji_id", "created_at");
