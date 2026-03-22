'use server';

import { db } from '@/lib/db';
import { users } from '@e-be/db/schema';
import { eq } from 'drizzle-orm';
import { getDbUser } from '@/lib/auth';

function isValidXUrl(url: string): boolean {
  return url.startsWith('https://x.com/') || url.startsWith('https://twitter.com/');
}

export async function updateXUrl(
  formData: FormData
): Promise<{ error: string } | { ok: true }> {
  const dbUser = await getDbUser();
  if (!dbUser) return { error: 'unauthorized' };

  const xUrl = (formData.get('xUrl') as string ?? '').trim();

  if (xUrl && !isValidXUrl(xUrl)) {
    return { error: 'invalid_url' };
  }

  await db
    .update(users)
    .set({ xUrl: xUrl || null })
    .where(eq(users.id, dbUser.id));

  return { ok: true };
}
