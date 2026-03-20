import type { User } from '@supabase/supabase-js';
import { db } from './db';
import { users } from '@e-be/db/schema';

/**
 * Supabase Auth のユーザーを public.users に upsert する
 * サインアップ・OAuth コールバック時に呼ぶ
 */
export async function syncUser(authUser: User) {
  await db
    .insert(users)
    .values({
      id: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
      image: authUser.user_metadata?.avatar_url ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: authUser.email!,
        name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
        image: authUser.user_metadata?.avatar_url ?? null,
        updatedAt: new Date(),
      },
    });
}
