DO $$ BEGIN
 CREATE TYPE "public"."participation_status" AS ENUM('registered', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_participations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "participation_status" DEFAULT 'registered' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "charge_amount" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_participations" ADD CONSTRAINT "event_participations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_event_participation" ON "event_participations" USING btree ("event_id","user_id");