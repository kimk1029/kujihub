ALTER TABLE "kuji_players" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
ALTER TABLE "community_posts" ADD COLUMN "is_notice" BOOLEAN NOT NULL DEFAULT false;