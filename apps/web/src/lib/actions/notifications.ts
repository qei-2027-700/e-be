'use server';

import { revalidatePath } from 'next/cache';
import { getDbUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@e-be/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

type ActionResult = { error: string } | { ok: true };

export async function markNotificationRead(notificationId: string, locale: string): Promise<ActionResult> {
  const dbUser = await getDbUser();
  if (!dbUser) return { error: 'unauthorized' };
  if (!/^[0-9a-f-]{36}$/.test(notificationId)) return { error: 'invalid' };

  await db
    .update(notifications)
    .set({ readAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, dbUser.id),
        isNull(notifications.deletedAt)
      )
    );

  revalidatePath(`/${locale}/dashboard/notifications`);
  return { ok: true };
}

export async function markAllNotificationsRead(locale: string): Promise<ActionResult> {
  const dbUser = await getDbUser();
  if (!dbUser) return { error: 'unauthorized' };

  await db
    .update(notifications)
    .set({ readAt: new Date(), updatedAt: new Date() })
    .where(and(eq(notifications.userId, dbUser.id), isNull(notifications.deletedAt), isNull(notifications.readAt)));

  revalidatePath(`/${locale}/dashboard/notifications`);
  return { ok: true };
}

