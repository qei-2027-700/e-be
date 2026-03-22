'use server';

import { getDbUser, getUserType } from '@/lib/auth';
import { db } from '@/lib/db';
import { events } from '@e-be/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { checkEventConflict, hasBarHostPermission } from '@/lib/events';

type CreateEventDraftResult =
  | { error: string }
  | { eventId: string };

export async function createEventDraft(formData: FormData): Promise<CreateEventDraftResult> {
  const dbUser = await getDbUser();
  if (!dbUser) return { error: 'unauthorized' };

  const userType = await getUserType(dbUser.id);
  if (userType !== 'user') return { error: 'forbidden' };

  const orgId = formData.get('orgId') as string | null;
  const title = (formData.get('title') as string | null)?.trim() ?? '';
  const description = (formData.get('description') as string | null)?.trim() ?? '';
  const maxParticipantsRaw = formData.get('maxParticipants') as string | null;
  const nearestStation = (formData.get('nearestStation') as string | null)?.trim() || null;

  // バリデーション
  if (!orgId || !/^[0-9a-f-]{36}$/.test(orgId)) return { error: 'invalid' };
  if (!title || title.length > 100) return { error: 'invalid' };
  if (!description || description.length > 2000) return { error: 'invalid' };

  let maxParticipants: number | null = null;
  if (maxParticipantsRaw && maxParticipantsRaw !== '') {
    const n = parseInt(maxParticipantsRaw, 10);
    if (isNaN(n) || n < 1 || n > 500) return { error: 'invalid' };
    maxParticipants = n;
  }

  const [event] = await db
    .insert(events)
    .values({
      orgId,
      userId: dbUser.id,
      status: 'draft',
      title,
      description,
      maxParticipants,
      nearestStation,
    })
    .returning({ id: events.id });

  return { eventId: event.id };
}

type ActionResult = { error: string } | { ok: true };

/** draft イベントの基本情報と日時を更新する */
export async function updateEventDraft(eventId: string, formData: FormData): Promise<ActionResult> {
  const dbUser = await getDbUser();
  if (!dbUser) return { error: 'unauthorized' };

  const title = (formData.get('title') as string | null)?.trim() ?? '';
  const description = (formData.get('description') as string | null)?.trim() ?? '';
  const startAtRaw = formData.get('startAt') as string | null;
  const endAtRaw = formData.get('endAt') as string | null;
  const maxParticipantsRaw = formData.get('maxParticipants') as string | null;
  const chargeAmountRaw = formData.get('chargeAmount') as string | null;
  const orgIdRaw = (formData.get('orgId') as string | null)?.trim() ?? '';
  const nearestStation = (formData.get('nearestStation') as string | null)?.trim() || null;

  if (!title || title.length > 100) return { error: 'invalid' };
  if (!description || description.length > 2000) return { error: 'invalid' };

  const orgId = orgIdRaw && /^[0-9a-f-]{36}$/.test(orgIdRaw) ? orgIdRaw : undefined;

  let maxParticipants: number | null = null;
  if (maxParticipantsRaw && maxParticipantsRaw !== '') {
    const n = parseInt(maxParticipantsRaw, 10);
    if (isNaN(n) || n < 1 || n > 500) return { error: 'invalid' };
    maxParticipants = n;
  }

  let chargeAmount: number | null = null;
  if (chargeAmountRaw && chargeAmountRaw !== '') {
    const n = parseInt(chargeAmountRaw, 10);
    if (isNaN(n) || n < 0) return { error: 'invalid' };
    chargeAmount = n;
  }

  // 所有権チェック
  const [target] = await db
    .select({ id: events.id, status: events.status })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, dbUser.id), isNull(events.deletedAt)))
    .limit(1);

  if (!target) return { error: 'not_found' };
  if (target.status !== 'draft') return { error: 'forbidden' };

  const startAt = startAtRaw ? new Date(startAtRaw) : null;
  const endAt = endAtRaw ? new Date(endAtRaw) : null;

  await db
    .update(events)
    .set({ title, description, startAt, endAt, maxParticipants, chargeAmount, nearestStation, ...(orgId ? { orgId } : {}), updatedAt: new Date() })
    .where(eq(events.id, eventId));

  return { ok: true };
}

/** draft → pending（バーへの開催申請） */
export async function submitEvent(eventId: string): Promise<ActionResult> {
  const dbUser = await getDbUser();
  if (!dbUser) return { error: 'unauthorized' };

  const [target] = await db
    .select({ id: events.id, status: events.status, orgId: events.orgId, startAt: events.startAt, endAt: events.endAt })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, dbUser.id), isNull(events.deletedAt)))
    .limit(1);

  if (!target) return { error: 'not_found' };
  if (target.status !== 'draft') return { error: 'forbidden' };
  if (!target.orgId) return { error: 'venue_required' };

  if (target.startAt && target.endAt) {
    const now = new Date();
    if (target.startAt <= now) return { error: 'past_date' };
    if (target.endAt <= target.startAt) return { error: 'invalid_range' };

    const conflict = await checkEventConflict(target.orgId, target.startAt, target.endAt, eventId);
    if (conflict) return { error: 'conflict' };
  }

  await db.update(events).set({ status: 'pending', updatedAt: new Date() }).where(eq(events.id, eventId));
  return { ok: true };
}

/** draft → published（許可済みユーザーが即時公開） */
export async function publishEvent(eventId: string): Promise<ActionResult> {
  const dbUser = await getDbUser();
  if (!dbUser) return { error: 'unauthorized' };

  const [target] = await db
    .select({ id: events.id, status: events.status, orgId: events.orgId, startAt: events.startAt, endAt: events.endAt })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, dbUser.id), isNull(events.deletedAt)))
    .limit(1);

  if (!target) return { error: 'not_found' };
  if (target.status !== 'draft') return { error: 'forbidden' };
  if (!target.startAt || !target.endAt) return { error: 'datetime_required' };

  const now = new Date();
  if (target.startAt <= now) return { error: 'past_date' };
  if (target.endAt <= target.startAt) return { error: 'invalid_range' };

  const permitted = await hasBarHostPermission(dbUser.id, target.orgId);
  if (!permitted) return { error: 'permission_required' };

  const conflict = await checkEventConflict(target.orgId, target.startAt, target.endAt, eventId);
  if (conflict) return { error: 'conflict' };

  await db.update(events).set({ status: 'published', updatedAt: new Date() }).where(eq(events.id, eventId));
  return { ok: true };
}
