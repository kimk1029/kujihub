CREATE TABLE IF NOT EXISTS "kujis" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "image_url" TEXT,
  "price" INTEGER NOT NULL,
  "board_size" INTEGER NOT NULL DEFAULT 80,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kujis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "kuji_prizes" (
  "id" SERIAL NOT NULL,
  "kuji_id" INTEGER NOT NULL,
  "grade" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#718096',
  "chance" DOUBLE PRECISION NOT NULL,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "kuji_prizes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "kuji_slots" (
  "kuji_id" INTEGER NOT NULL,
  "slot_number" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "grade" TEXT,
  "grade_name" TEXT,
  "grade_color" TEXT,
  "locked_at" TIMESTAMPTZ,
  "locked_user_id" TEXT,
  "completed_at" TIMESTAMPTZ,
  CONSTRAINT "kuji_slots_pkey" PRIMARY KEY ("kuji_id", "slot_number")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kuji_prizes_kuji_id_fkey'
  ) THEN
    ALTER TABLE "kuji_prizes"
      ADD CONSTRAINT "kuji_prizes_kuji_id_fkey"
      FOREIGN KEY ("kuji_id") REFERENCES "kujis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kuji_slots_kuji_id_fkey'
  ) THEN
    ALTER TABLE "kuji_slots"
      ADD CONSTRAINT "kuji_slots_kuji_id_fkey"
      FOREIGN KEY ("kuji_id") REFERENCES "kujis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "kuji_slots_kuji_id_idx" ON "kuji_slots"("kuji_id");
