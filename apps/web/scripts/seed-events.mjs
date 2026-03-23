/**
 * 開催予定イベントのサンプルデータ seed スクリプト
 *
 * 使い方:
 *   node scripts/seed-events.mjs
 *   # または
 *   pnpm seed:events
 *
 * 必要な環境変数 (apps/web/.env.local から読み込み):
 *   DATABASE_URL
 *
 * 前提:
 *   - seed-test-accounts.mjs が先に実行されていること
 *   - test-venue@e-be.internal と test-company が DB に存在すること
 */

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

loadEnv(resolve(__dirname, '../.env.local'));

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL が未設定です。apps/web/.env.local を確認してください。');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

// 現在日時を基準に start_at を計算するヘルパー
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(19, 0, 0, 0);
  return d;
}
function daysFromNowEnd(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(22, 0, 0, 0);
  return d;
}

// テスト用店舗定義
const TEST_ORGS = [
  {
    slug: 'test-bar-shibuya',
    name: 'テストバー渋谷',
    description: '検証用・渋谷エリアのテストバーです',
    address: '東京都渋谷区道玄坂1丁目',
    prefecture: '東京都',
    events: [
      {
        title: '【テスト】渋谷ジャズナイト vol.1',
        nearestStation: '渋谷',
        chargeAmount: 1000,
        maxParticipants: 10,
        offsetDays: 7,
      },
      {
        title: '【テスト】渋谷フリーミキサー',
        nearestStation: '恵比寿',
        chargeAmount: 0,
        maxParticipants: 30,
        offsetDays: 14,
      },
      {
        title: '【テスト】渋谷プレミアムナイト',
        nearestStation: '代官山',
        chargeAmount: 3000,
        maxParticipants: 5,
        offsetDays: 21,
      },
      {
        title: '【テスト】渋谷サンデーアフタヌーン',
        nearestStation: '渋谷',
        chargeAmount: 500,
        maxParticipants: 20,
        offsetDays: 28,
      },
    ],
  },
  {
    slug: 'test-bar-shinjuku',
    name: 'テストバー新宿',
    description: '検証用・新宿エリアのテストバーです',
    address: '東京都新宿区歌舞伎町1丁目',
    prefecture: '東京都',
    events: [
      {
        title: '【テスト】新宿ジャズナイト vol.1',
        nearestStation: '新宿',
        chargeAmount: 1000,
        maxParticipants: 10,
        offsetDays: 8,
      },
      {
        title: '【テスト】新宿フリーミキサー',
        nearestStation: '西新宿',
        chargeAmount: 0,
        maxParticipants: 30,
        offsetDays: 15,
      },
      {
        title: '【テスト】新宿プレミアムナイト',
        nearestStation: '中野',
        chargeAmount: 3000,
        maxParticipants: 5,
        offsetDays: 22,
      },
      {
        title: '【テスト】新宿ミッドナイト・セッション',
        nearestStation: '新宿',
        chargeAmount: 1500,
        maxParticipants: 15,
        offsetDays: 29,
      },
    ],
  },
  {
    slug: 'test-bar-osaka',
    name: 'テストバー大阪',
    description: '検証用・大阪エリアのテストバーです',
    address: '大阪府大阪市北区梅田1丁目',
    prefecture: '大阪府',
    events: [
      {
        title: '【テスト】大阪ジャズナイト vol.1',
        nearestStation: '梅田',
        chargeAmount: 1000,
        maxParticipants: 10,
        offsetDays: 9,
      },
      {
        title: '【テスト】大阪フリーミキサー',
        nearestStation: '難波',
        chargeAmount: 0,
        maxParticipants: 30,
        offsetDays: 16,
      },
      {
        title: '【テスト】大阪プレミアムナイト',
        nearestStation: '心斎橋',
        chargeAmount: 3000,
        maxParticipants: 5,
        offsetDays: 23,
      },
    ],
  },
  {
    slug: 'test-bar-fukuoka',
    name: 'テストバー福岡',
    description: '検証用・福岡エリアのテストバーです',
    address: '福岡県福岡市博多区博多駅前3丁目',
    prefecture: '福岡県',
    events: [
      {
        title: '【テスト】福岡ジャズナイト vol.1',
        nearestStation: '博多',
        chargeAmount: 1000,
        maxParticipants: 10,
        offsetDays: 10,
      },
      {
        title: '【テスト】福岡フリーミキサー',
        nearestStation: '天神',
        chargeAmount: 0,
        maxParticipants: 30,
        offsetDays: 17,
      },
      {
        title: '【テスト】福岡プレミアムナイト',
        nearestStation: '薬院',
        chargeAmount: 3000,
        maxParticipants: 5,
        offsetDays: 24,
      },
    ],
  },
];

async function upsertOrg(companyId, venueUserId, org) {
  const [existing] = await sql`
    SELECT id FROM organizations WHERE slug = ${org.slug} AND deleted_at IS NULL LIMIT 1
  `;

  let orgId;
  if (existing) {
    orgId = existing.id;
    console.log(`  ⏭  organization: ${org.slug} は既に存在します (id: ${orgId})`);
  } else {
    const [inserted] = await sql`
      INSERT INTO organizations (company_id, name, slug, description, address, prefecture)
      VALUES (${companyId}, ${org.name}, ${org.slug}, ${org.description}, ${org.address}, ${org.prefecture})
      RETURNING id
    `;
    orgId = inserted.id;
    console.log(`  ✅ organization: ${org.name} を作成しました`);
  }

  // organization_members (owner) — 冪等
  const [existingMember] = await sql`
    SELECT id FROM organization_members
    WHERE org_id = ${orgId} AND user_id = ${venueUserId} AND deleted_at IS NULL LIMIT 1
  `;
  if (!existingMember) {
    await sql`
      INSERT INTO organization_members (org_id, user_id, role)
      VALUES (${orgId}, ${venueUserId}, 'owner')
    `;
    console.log(`  ✅ organization_members: owner (${org.name}) として紐付け完了`);
  } else {
    console.log(`  ⏭  organization_members: ${org.slug} の owner は既に紐付き済み`);
  }

  return orgId;
}

async function upsertEvent(orgId, venueUserId, event) {
  const [existing] = await sql`
    SELECT id FROM events
    WHERE org_id = ${orgId} AND title = ${event.title} AND deleted_at IS NULL
    LIMIT 1
  `;

  if (existing) {
    console.log(`  ⏭  event: "${event.title}" は既に存在します`);
    return;
  }

  const startAt = daysFromNow(event.offsetDays);
  const endAt = daysFromNowEnd(event.offsetDays);

  await sql`
    INSERT INTO events (
      org_id, user_id, status, is_public,
      title, start_at, end_at,
      charge_amount, max_participants, nearest_station
    )
    VALUES (
      ${orgId}, ${venueUserId}, 'published', true,
      ${event.title}, ${startAt}, ${endAt},
      ${event.chargeAmount ?? null}, ${event.maxParticipants}, ${event.nearestStation}
    )
  `;
  console.log(`  ✅ event: "${event.title}" (${event.nearestStation}駅、${event.chargeAmount === 0 ? '無料' : `¥${event.chargeAmount}`}、定員${event.maxParticipants}名)`);
}

async function main() {
  console.log('🌱 開催予定イベント seed 開始\n');

  // test-venue@e-be.internal の userId を取得
  const [venueUser] = await sql`
    SELECT id FROM users WHERE email = 'test-venue@e-be.internal' AND deleted_at IS NULL LIMIT 1
  `;
  if (!venueUser) {
    console.error('❌ test-venue@e-be.internal が見つかりません。先に seed-test-accounts.mjs を実行してください。');
    process.exit(1);
  }
  const venueUserId = venueUser.id;
  console.log(`✓ test-venue ユーザー: ${venueUserId}\n`);

  // test-company の companyId を取得
  const [company] = await sql`
    SELECT id FROM companies WHERE slug = 'test-company' AND deleted_at IS NULL LIMIT 1
  `;
  if (!company) {
    console.error('❌ test-company が見つかりません。先に seed-test-accounts.mjs を実行してください。');
    process.exit(1);
  }
  const companyId = company.id;
  console.log(`✓ test-company: ${companyId}\n`);

  // 各店舗とイベントを upsert
  let totalEvents = 0;
  for (const org of TEST_ORGS) {
    console.log(`▶ ${org.name} (${org.prefecture})`);
    const orgId = await upsertOrg(companyId, venueUserId, org);

    for (const event of org.events) {
      await upsertEvent(orgId, venueUserId, event);
      totalEvents++;
    }
    console.log();
  }

  console.log(`✅ 完了: ${TEST_ORGS.length} 店舗、${totalEvents} イベントを処理しました`);

  await sql.end();
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
