/**
 * テストユーザー作成スクリプト（1回限り実行）
 *
 * 実行方法:
 *   cd apps/web
 *   SUPABASE_SERVICE_ROLE_KEY=xxx pnpm tsx scripts/create-test-users.ts
 *
 * 必要な環境変数:
 *   NEXT_PUBLIC_SUPABASE_URL    — Supabase プロジェクト URL
 *   DATABASE_URL                — PostgreSQL 接続文字列
 *   SUPABASE_SERVICE_ROLE_KEY   — Service Role Key（Supabase Dashboard > Settings > API）
 */

import "dotenv/config";
import { createAdminClient } from "../src/lib/supabase/admin";
import { db } from "../src/lib/db";
import { users, companies, organizations, organizationMembers } from "@e-be/db/schema";
import { eq } from "drizzle-orm";

const TEST_ACCOUNTS = [
  {
    email: "test-user@e-be.internal",
    password: "testpass2026",
    name: "テストユーザー",
    userType: "user" as const,
  },
  {
    email: "test-venue@e-be.internal",
    password: "testpass2026",
    name: "テスト事業者",
    userType: "venue_user" as const,
  },
] as const;

async function main() {
  const admin = createAdminClient();

  for (const account of TEST_ACCOUNTS) {
    console.log(`\n▶ ${account.email} を作成中...`);

    // 1. Supabase Auth にユーザーを作成（メール確認スキップ）
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { full_name: account.name },
    });

    let authUserId: string;

    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`  ⚠️  すでに存在します。スキップ。`);
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list.users.find((u) => u.email === account.email);
        if (!existing) continue;
        authUserId = existing.id;
      } else {
        console.error(`  ❌ Auth 作成失敗:`, error.message);
        continue;
      }
    } else {
      authUserId = data.user!.id;
    }
    console.log(`  ✅ Auth ユーザー作成: ${authUserId}`);

    // 2. public.users に upsert（userType を設定）
    await db
      .insert(users)
      .values({
        id: authUserId,
        email: account.email,
        name: account.name,
        userType: account.userType,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: account.email,
          name: account.name,
          userType: account.userType,
          updatedAt: new Date(),
        },
      });
    console.log(`  ✅ users テーブルに upsert (userType: ${account.userType})`);

    // 3. venue_user にはテスト用の組織を作成
    if (account.userType === "venue_user") {
      await createTestOrg(authUserId);
    }
  }

  console.log("\n✨ 完了しました。");
  process.exit(0);
}

async function createTestOrg(ownerId: string) {
  const companySlug = "test-company-internal";
  const orgSlug = "test-venue-internal";

  // Company
  const [existing] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, companySlug))
    .limit(1);

  let companyId = existing?.id;

  if (!companyId) {
    const [company] = await db
      .insert(companies)
      .values({ name: "テスト法人", slug: companySlug })
      .returning({ id: companies.id });
    companyId = company.id;
    console.log(`  ✅ テスト法人を作成`);
  } else {
    console.log(`  ⚠️  テスト法人はすでに存在します`);
  }

  // Organization
  const [existingOrg] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);

  let orgId = existingOrg?.id;

  if (!orgId) {
    const [org] = await db
      .insert(organizations)
      .values({
        companyId,
        name: "テスト店舗",
        slug: orgSlug,
        description: "バイパス検証用のテスト店舗です",
        address: "東京都渋谷区テスト1-1-1",
      })
      .returning({ id: organizations.id });
    orgId = org.id;
    console.log(`  ✅ テスト店舗を作成`);
  } else {
    console.log(`  ⚠️  テスト店舗はすでに存在します`);
  }

  // OrganizationMember
  await db
    .insert(organizationMembers)
    .values({
      orgId,
      userId: ownerId,
      role: "owner",
    })
    .onConflictDoNothing();
  console.log(`  ✅ オーナーとして登録`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
