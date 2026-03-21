'use server';

import { getDbUser, getUserType } from '@/lib/auth';
import { db } from '@/lib/db';
import { events } from '@e-be/db/schema';

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
    })
    .returning({ id: events.id });

  return { eventId: event.id };
}
