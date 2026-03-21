'use server';

import { getDbUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { events, eventParticipations } from '@e-be/db/schema';
import { eq, and, isNull, count } from 'drizzle-orm';
import { sendNotification } from '@/lib/notify';
import { NOTIFICATION_TYPES } from '@e-be/db';

type ActionResult = { error: string } | { ok: true };

export async function joinEvent(eventId: string): Promise<ActionResult> {
  const dbUser = await getDbUser();
  if (!dbUser) return { error: 'unauthorized' };

  // イベント取得（published かつ deleted_at IS NULL）
  const [event] = await db
    .select({
      id: events.id,
      userId: events.userId,
      startAt: events.startAt,
      maxParticipants: events.maxParticipants,
    })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.status, 'published'), isNull(events.deletedAt)))
    .limit(1);

  if (!event) return { error: 'not_found' };

  // 開催前チェック
  const now = new Date();
  if (!event.startAt || event.startAt <= now) return { error: 'event_ended' };

  // 既存参加レコードを確認
  const [existing] = await db
    .select({ id: eventParticipations.id, status: eventParticipations.status })
    .from(eventParticipations)
    .where(
      and(
        eq(eventParticipations.eventId, eventId),
        eq(eventParticipations.userId, dbUser.id),
        isNull(eventParticipations.deletedAt)
      )
    )
    .limit(1);

  if (existing?.status === 'registered') return { error: 'already_registered' };

  // 定員チェック
  if (event.maxParticipants !== null) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(eventParticipations)
      .where(
        and(
          eq(eventParticipations.eventId, eventId),
          eq(eventParticipations.status, 'registered'),
          isNull(eventParticipations.deletedAt)
        )
      );
    if (total >= event.maxParticipants) return { error: 'full_capacity' };
  }

  // INSERT または UPDATE
  if (existing) {
    // status が 'cancelled' だったケース → registered に戻す
    await db
      .update(eventParticipations)
      .set({ status: 'registered', updatedAt: new Date() })
      .where(eq(eventParticipations.id, existing.id));
  } else {
    await db.insert(eventParticipations).values({
      eventId,
      userId: dbUser.id,
      status: 'registered',
    });
  }

  // 主催者へ通知
  await sendNotification(
    event.userId,
    NOTIFICATION_TYPES.PARTICIPATION_RECEIVED,
    '参加表明がありました',
    `イベントへの参加表明が届きました。`,
    { eventId }
  );

  return { ok: true };
}

export async function cancelParticipation(eventId: string): Promise<ActionResult> {
  const dbUser = await getDbUser();
  if (!dbUser) return { error: 'unauthorized' };

  // 参加レコードを取得
  const [participation] = await db
    .select({ id: eventParticipations.id })
    .from(eventParticipations)
    .where(
      and(
        eq(eventParticipations.eventId, eventId),
        eq(eventParticipations.userId, dbUser.id),
        eq(eventParticipations.status, 'registered'),
        isNull(eventParticipations.deletedAt)
      )
    )
    .limit(1);

  if (!participation) return { error: 'not_found' };

  // イベントの開催前チェック
  const [event] = await db
    .select({ startAt: events.startAt })
    .from(events)
    .where(and(eq(events.id, eventId), isNull(events.deletedAt)))
    .limit(1);

  if (!event) return { error: 'not_found' };

  const now = new Date();
  if (event.startAt && event.startAt <= now) return { error: 'event_started' };

  await db
    .update(eventParticipations)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(eventParticipations.id, participation.id));

  return { ok: true };
}
