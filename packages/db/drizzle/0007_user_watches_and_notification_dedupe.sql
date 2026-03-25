ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "dedupe_key" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_notification_dedupe_key"
  ON "notifications" ("user_id", "dedupe_key")
  WHERE "dedupe_key" IS NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_watches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "watcher_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "target_user_id" uuid NOT NULL REFERENCES "users"("id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_user_watch"
  ON "user_watches" ("watcher_user_id", "target_user_id")
  WHERE "deleted_at" IS NULL;

