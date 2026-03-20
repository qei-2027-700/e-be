/**
 * 検証用テストアカウント作成スクリプト
 *
 * 使い方:
 *   node scripts/seed-test-accounts.mjs
 *
 * 必要な環境変数 (apps/web/.env.local から読み込み):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DATABASE_URL
 */

import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local を手動パース
function loadEnv(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // ファイルがなければスキップ
  }
}

// apps/web/scripts/ から apps/web/.env.local を読む
loadEnv(resolve(__dirname, '../.env.local'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DATABASE_URL) {
  console.error('❌ 必要な環境変数が未設定です。apps/web/.env.local を確認してください。');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('   DATABASE_URL:', DATABASE_URL ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = postgres(DATABASE_URL, { max: 1 });

const TEST_ACCOUNTS = [
  {
    email: 'test-user@e-be.internal',
    password: 'testpass2026',
    name: 'テストユーザー',
    userType: 'user',
    label: '一般ユーザー（イベンター）',
  },
  {
    email: 'test-venue@e-be.internal',
    password: 'testpass2026',
    name: 'テスト事業者',
    userType: 'venue_user',
    label: '事業者（店舗管理）',
    company: {
      name: 'テスト株式会社',
      slug: 'test-company',
    },
    org: {
      name: 'テストバー',
      slug: 'test-bar',
      description: '検証用のテストバーです',
    },
  },
];

async function upsertAuthUser({ email, password, name }) {
  // 既存ユーザーを検索
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = users.find((u) => u.email === email);
  if (existing) {
    console.log(`  ⏭  Supabase Auth: ${email} は既に存在します (id: ${existing.id})`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) throw error;
  console.log(`  ✅ Supabase Auth: ${email} を作成しました (id: ${data.user.id})`);
  return data.user.id;
}

async function upsertDbUser(id, { email, name, userType }) {
  await sql`
    INSERT INTO users (id, email, name, user_type)
    VALUES (${id}, ${email}, ${name}, ${userType})
    ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          name  = EXCLUDED.name,
          user_type = EXCLUDED.user_type,
          updated_at = now()
  `;
  console.log(`  ✅ DB users: ${email} (${userType})`);
}

async function upsertCompanyAndOrg(userId, { company, org }) {
  // company
  const [existingCompany] = await sql`
    SELECT id FROM companies WHERE slug = ${company.slug} AND deleted_at IS NULL LIMIT 1
  `;
  let companyId;
  if (existingCompany) {
    companyId = existingCompany.id;
    console.log(`  ⏭  company: ${company.slug} は既に存在します (id: ${companyId})`);
  } else {
    const [inserted] = await sql`
      INSERT INTO companies (name, slug) VALUES (${company.name}, ${company.slug})
      RETURNING id
    `;
    companyId = inserted.id;
    console.log(`  ✅ company: ${company.name} を作成しました`);
  }

  // organization
  const [existingOrg] = await sql`
    SELECT id FROM organizations WHERE slug = ${org.slug} AND deleted_at IS NULL LIMIT 1
  `;
  let orgId;
  if (existingOrg) {
    orgId = existingOrg.id;
    console.log(`  ⏭  organization: ${org.slug} は既に存在します (id: ${orgId})`);
  } else {
    const [inserted] = await sql`
      INSERT INTO organizations (company_id, name, slug, description)
      VALUES (${companyId}, ${org.name}, ${org.slug}, ${org.description})
      RETURNING id
    `;
    orgId = inserted.id;
    console.log(`  ✅ organization: ${org.name} を作成しました`);
  }

  // organization_members (owner)
  const [existingMember] = await sql`
    SELECT id FROM organization_members
    WHERE org_id = ${orgId} AND user_id = ${userId} AND deleted_at IS NULL LIMIT 1
  `;
  if (!existingMember) {
    await sql`
      INSERT INTO organization_members (org_id, user_id, role)
      VALUES (${orgId}, ${userId}, 'owner')
    `;
    console.log(`  ✅ organization_members: owner として紐付け完了`);
  } else {
    console.log(`  ⏭  organization_members: 既に紐付き済み`);
  }
}

async function main() {
  console.log('🌱 テストアカウント作成開始\n');

  for (const account of TEST_ACCOUNTS) {
    console.log(`▶ ${account.label} (${account.email})`);

    const userId = await upsertAuthUser(account);
    await upsertDbUser(userId, account);

    if (account.company && account.org) {
      await upsertCompanyAndOrg(userId, account);
    }

    console.log();
  }

  console.log('✅ 完了');
  console.log('\nテストアカウント一覧:');
  for (const a of TEST_ACCOUNTS) {
    console.log(`  ${a.label}: ${a.email} / ${a.password}`);
  }

  await sql.end();
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
