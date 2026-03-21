'use server';

import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

export async function signOutAction() {
  const [supabase, locale] = await Promise.all([createClient(), getLocale()]);
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}
