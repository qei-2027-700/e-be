'use server';

import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getUser, getDbUser } from '@/lib/auth';
import { checkWithdrawalBlockers, withdrawUser } from '@/lib/withdrawal';
import { createAdminClient } from '@/lib/supabase/admin';

export async function checkWithdrawalAction() {
  const [authUser, dbUser] = await Promise.all([getUser(), getDbUser()]);
  if (!authUser || !dbUser) return { error: 'unauthorized' as const };

  const blockers = await checkWithdrawalBlockers(dbUser.id);
  return { blockers };
}

export async function withdrawAction() {
  const locale = await getLocale();
  const [authUser, dbUser] = await Promise.all([getUser(), getDbUser()]);
  if (!authUser || !dbUser) redirect(`/${locale}/auth/sign-in`);

  // DB 退会処理
  await withdrawUser(dbUser.id);

  // Supabase Auth ユーザー削除
  const adminClient = createAdminClient();
  await adminClient.auth.admin.deleteUser(authUser.id);

  redirect(`/${locale}`);
}
