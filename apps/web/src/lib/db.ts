import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@e-be/db/schema';

// サーバーサイド専用 — クライアントバンドルに含まれないよう注意
const client = postgres(process.env.DATABASE_URL!, { max: 1 });
export const db = drizzle(client, { schema });
