'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { getUser, getDbUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { events } from '@e-be/db/schema';
import { eq, and, isNull, lt } from 'drizzle-orm';

export async function toggleEventPublicAction(
  eventId: string,
  isPublic: boolean
): Promise<{ error?: string }> {
  const [, dbUser] = await Promise.all([getUser(), getDbUser()]);
  if (!dbUser) return { error: 'unauthorized' };

  const now = new Date();

  // 自分の completed 相当（published かつ終了済み）イベントのみ操作可
  const rows = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(
        eq(events.id, eventId),
        eq(events.userId, dbUser.id),
        eq(events.status, 'published'),
        lt(events.endAt, now),
        isNull(events.deletedAt)
      )
    )
    .limit(1);

  if (rows.length === 0) return { error: 'not_found' };

  await db.update(events).set({ isPublic }).where(eq(events.id, eventId));

  const locale = await getLocale();
  revalidatePath(`/${locale}/dashboard`);
  return {};
}
