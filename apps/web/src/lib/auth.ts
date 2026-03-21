import { cache } from 'react';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from './db';
import { organizationMembers, organizations, users } from '@e-be/db/schema';
import { createClient } from './supabase/server';

/** 現在のユーザーを取得（未認証なら null）
 *  React.cache() により同一リクエスト内で複数回呼ばれても Supabase への問い合わせは1回のみ
 *
 *  getSession() を使用してローカルJWT検証を行う（getUser() はリモートHTTP往復が発生するため使用しない）。
 *  proxy.ts の updateSession() がセッション Cookie のリフレッシュを担うため、
 *  Server Component ではローカル検証で十分かつ安全。
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
});

/** DB上の users レコードを取得（email で JOIN、deleted_at IS NULL 条件付き）
 *  React.cache() により同一リクエスト内で複数回呼ばれても DB 問い合わせは1回のみ
 */
export const getDbUser = cache(async () => {
  const authUser = await getUser();
  if (!authUser?.email) return null;

  const rows = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, authUser.email),
        isNull(users.deletedAt)
      )
    )
    .limit(1);

  return rows[0] ?? null;
});

/** 指定組織でのロールを取得（非メンバーなら null） */
export async function getOrgRole(
  userId: string,
  orgId: string
): Promise<'owner' | 'member' | null> {
  const rows = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.orgId, orgId),
        isNull(organizationMembers.deletedAt)
      )
    )
    .limit(1);

  return rows[0]?.role ?? null;
}

/** ユーザーが所属する全組織とロールを取得 */
export async function getUserOrgs(userId: string) {
  return db
    .select({
      org: organizations,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.orgId, organizations.id))
    .where(
      and(
        eq(organizationMembers.userId, userId),
        isNull(organizationMembers.deletedAt),
        isNull(organizations.deletedAt)
      )
    );
}

/** ユーザー種別を取得
 *  React.cache() により同一リクエスト内で同じ userId なら DB 問い合わせは1回のみ
 */
export const getUserType = cache(async (
  userId: string
): Promise<'user' | 'venue_user' | 'system_user'> => {
  const rows = await db
    .select({ userType: users.userType })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return rows[0]?.userType ?? 'user';
});

/** system_user かどうかを判定 */
export async function isAdmin(userId: string): Promise<boolean> {
  const userType = await getUserType(userId);
  return userType === 'system_user';
}
