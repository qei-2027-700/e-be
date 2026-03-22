import { neon, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzleWs } from 'drizzle-orm/neon-serverless';
import * as schema from '@e-be/db/schema';

// サーバーサイド専用 — クライアントバンドルに含まれないよう注意
// HTTP ドライバー: コネクションレスで各クエリを HTTP リクエストとして送信。
// コールドスタート時の TCP 接続確立コストがなく高速。
function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}
export const db = getDb();

// WebSocket ドライバー: トランザクションが必要な処理専用。
// HTTP ドライバーはトランザクション非対応のため、Pool + neon-serverless を使用する。
function getDbWs() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  return drizzleWs(pool, { schema });
}
export const dbWs = getDbWs();
