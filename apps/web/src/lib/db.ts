import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@e-be/db/schema';

// サーバーサイド専用 — クライアントバンドルに含まれないよう注意
// Vercel Serverless では関数インスタンスごとに接続を使い回すため prepare: false が必要
const client = postgres(process.env.DATABASE_URL!, {
  max: 1,
  prepare: false, // Neon の pgbouncer プーラーに対応
});
export const db = drizzle(client, { schema });
