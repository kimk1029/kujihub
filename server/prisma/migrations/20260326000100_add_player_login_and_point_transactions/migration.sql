ALTER TABLE "kuji_players"
  ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS "point_transactions" (
  "id" SERIAL NOT NULL,
  "player_id" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'point_transactions_player_id_fkey'
  ) THEN
    ALTER TABLE "point_transactions"
      ADD CONSTRAINT "point_transactions_player_id_fkey"
      FOREIGN KEY ("player_id") REFERENCES "kuji_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "point_transactions_player_id_created_at_idx"
  ON "point_transactions"("player_id", "created_at");
