-- フェーズ1: 新しいテーブルと既存テーブルへのカラム追加

-- 1. 新しい enum 型
DO $$ BEGIN
 CREATE TYPE "public"."user_type" AS ENUM('user', 'venue_user', 'system_user');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."application_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- 2. users.user_type を追加
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "user_type" "user_type" DEFAULT 'user' NOT NULL;
--> statement-breakpoint

-- 3. companies テーブルを作成
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"stripe_customer_id" text,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"plan_expires_at" timestamp,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint

-- 4. organizations に company_id と brand を追加
--    company_id は既存行を考慮して nullable として追加し、後でデータ移行後に NOT NULL 制約を付与
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "company_id" uuid REFERENCES "companies"("id");
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "brand" text;
--> statement-breakpoint

-- 5. operator_applications テーブルを作成
CREATE TABLE IF NOT EXISTS "operator_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"company_name" text NOT NULL,
	"org_name" text NOT NULL,
	"org_slug" text NOT NULL,
	"brand" text,
	"description" text,
	"address" text,
	"reviewed_by" uuid REFERENCES "users"("id"),
	"reviewed_at" timestamp,
	"review_note" text
);
--> statement-breakpoint

-- 6. fc_relationships テーブルを作成
CREATE TABLE IF NOT EXISTS "fc_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"franchisor_org_id" uuid NOT NULL REFERENCES "organizations"("id"),
	"franchisee_org_id" uuid NOT NULL REFERENCES "organizations"("id"),
	"granted_by" uuid NOT NULL REFERENCES "users"("id"),
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp
);
