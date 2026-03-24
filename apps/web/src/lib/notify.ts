'use server';
import { db } from '@/lib/db';
import { notifications } from '@e-be/db/schema';

export async function sendNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  payload?: Record<string, unknown>,
  dedupeKey?: string
): Promise<void> {
  await db
    .insert(notifications)
    .values({ userId, type, title, body, payload: payload ?? null, dedupeKey: dedupeKey ?? null })
    .onConflictDoNothing({
      target: [notifications.userId, notifications.dedupeKey],
    });
}
