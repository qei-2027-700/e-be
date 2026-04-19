'use server';

import { getDbUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { userWatches } from '@e-be/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

type ToggleWatchResult = { error: string } | { ok: true; watching: boolean };

export async function toggleWatchUser(targetUserId: string): Promise<ToggleWatchResult> {
  const dbUser = await getDbUser();
  if (!dbUser) return { error: 'unauthorized' };

  if (!/^[0-9a-f-]{36}$/.test(targetUserId)) return { error: 'invalid' };
  if (targetUserId === dbUser.id) return { error: 'invalid' };

  const [active] = await db
    .select({ id: userWatches.id })
    .from(userWatches)
    .where(
      and(
        eq(userWatches.watcherUserId, dbUser.id),
        eq(userWatches.targetUserId, targetUserId),
        isNull(userWatches.deletedAt)
      )
    )
    .limit(1);

  if (active) {
    await db
      .update(userWatches)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(userWatches.id, active.id));
    return { ok: true, watching: false };
  }

  const [existing] = await db
    .select({ id: userWatches.id })
    .from(userWatches)
    .where(and(eq(userWatches.watcherUserId, dbUser.id), eq(userWatches.targetUserId, targetUserId)))
    .limit(1);

  if (existing) {
    await db
      .update(userWatches)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(userWatches.id, existing.id));
    return { ok: true, watching: true };
  }

  await db.insert(userWatches).values({
    watcherUserId: dbUser.id,
    targetUserId,
  });

  return { ok: true, watching: true };
}

export async function isWatchingUser(targetUserId: string): Promise<boolean> {
  const dbUser = await getDbUser();
  if (!dbUser) return false;

  const rows = await db
    .select({ id: userWatches.id })
    .from(userWatches)
    .where(
      and(
        eq(userWatches.watcherUserId, dbUser.id),
        eq(userWatches.targetUserId, targetUserId),
        isNull(userWatches.deletedAt)
      )
    )
    .limit(1);
  return rows.length > 0;
}

export async function getWatchedUserIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ targetUserId: userWatches.targetUserId })
    .from(userWatches)
    .where(
      and(
        eq(userWatches.watcherUserId, userId),
        isNull(userWatches.deletedAt)
      )
    );
  return rows.map((r) => r.targetUserId);
}

