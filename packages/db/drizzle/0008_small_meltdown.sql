DROP INDEX "ai_chat_daily_usage_user_idx";--> statement-breakpoint
ALTER TABLE "ai_chat_daily_usage" ADD COLUMN "tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_chat_daily_usage_user_date_idx" ON "ai_chat_daily_usage" USING btree ("user_id","date");