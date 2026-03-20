import { eq, and, isNull } from 'drizzle-orm';
import { db } from './db';
import { organizationMembers, organizations, users } from '@e-be/db/schema';
import { createClient } from './supabase/server';

/** 現在のユーザーを取得（未認証なら null） */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

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

/** ユーザー種別を取得 */
export async function getUserType(
  userId: string
): Promise<'user' | 'venue_user' | 'system_user'> {
  const rows = await db
    .select({ userType: users.userType })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return rows[0]?.userType ?? 'user';
}

/** system_user かどうかを判定 */
export async function isAdmin(userId: string): Promise<boolean> {
  const userType = await getUserType(userId);
  return userType === 'system_user';
}
