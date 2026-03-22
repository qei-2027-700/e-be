import { and, eq, gt, isNull } from 'drizzle-orm';
import { db, dbWs } from './db';
import {
  users,
  organizationMembers,
  barHostPermissions,
  events,
  auditLogs,
} from '@e-be/db/schema';

export type WithdrawalBlocker =
  | { type: 'owner'; message: string }
  | { type: 'published_event'; message: string };

export async function checkWithdrawalBlockers(
  userId: string
): Promise<WithdrawalBlocker[]> {
  const blockers: WithdrawalBlocker[] = [];

  // owner チェック
  const ownerRows = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.role, 'owner'),
        isNull(organizationMembers.deletedAt)
      )
    )
    .limit(1);

  if (ownerRows.length > 0) {
    blockers.push({ type: 'owner', message: 'owner' });
  }

  // 公開中イベントチェック
  const now = new Date();
  const eventRows = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        eq(events.status, 'published'),
        gt(events.endAt, now)
      )
    )
    .limit(1);

  if (eventRows.length > 0) {
    blockers.push({ type: 'published_event', message: 'published_event' });
  }

  return blockers;
}

export async function withdrawUser(dbUserId: string): Promise<void> {
  const now = new Date();

  // HTTP ドライバーはトランザクション非対応のため WebSocket ドライバー (dbWs) を使用
  await dbWs.transaction(async (tx) => {
    // ブロック条件の最終チェック（競合対策）
    const [ownerCheck, eventCheck] = await Promise.all([
      tx
        .select({ id: organizationMembers.id })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, dbUserId),
            eq(organizationMembers.role, 'owner'),
            isNull(organizationMembers.deletedAt)
          )
        )
        .limit(1),
      tx
        .select({ id: events.id })
        .from(events)
        .where(
          and(
            eq(events.userId, dbUserId),
            eq(events.status, 'published'),
            gt(events.endAt, now)
          )
        )
        .limit(1),
    ]);

    if (ownerCheck.length > 0 || eventCheck.length > 0) {
      throw new Error('BLOCKED');
    }

    // audit_log を先に insert（users.deleted_at 設定前）
    await tx.insert(auditLogs).values({
      userId: dbUserId,
      action: 'user_withdrawn',
      entityType: 'user',
      entityId: dbUserId,
    });

    // organization_members の論理削除
    await tx
      .update(organizationMembers)
      .set({ deletedAt: now })
      .where(
        and(
          eq(organizationMembers.userId, dbUserId),
          isNull(organizationMembers.deletedAt)
        )
      );

    // bar_host_permissions の無効化
    await tx
      .update(barHostPermissions)
      .set({ revokedAt: now })
      .where(
        and(
          eq(barHostPermissions.userId, dbUserId),
          isNull(barHostPermissions.revokedAt)
        )
      );

    // users の論理削除
    await tx
      .update(users)
      .set({ deletedAt: now })
      .where(eq(users.id, dbUserId));
  });
}
