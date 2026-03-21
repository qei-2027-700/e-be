import { NextResponse } from 'next/server';
import { getUser, getDbUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { events, organizations, eventParticipations } from '@e-be/db/schema';
import { eq, and, isNull, or, lt, count } from 'drizzle-orm';

export async function GET() {
  const [, dbUser] = await Promise.all([getUser(), getDbUser()]);
  if (!dbUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = new Date();

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      startAt: events.startAt,
      orgName: organizations.name,
      status: events.status,
      endAt: events.endAt,
    })
    .from(events)
    .innerJoin(organizations, eq(events.orgId, organizations.id))
    .where(
      and(
        eq(events.userId, dbUser.id),
        isNull(events.deletedAt),
        or(
          and(eq(events.status, 'published'), lt(events.endAt, now)),
          eq(events.status, 'cancelled'),
          eq(events.status, 'rejected')
        )
      )
    )
    .orderBy(events.startAt);

  // 参加者数を一括取得
  const eventIds = rows.map((r) => r.id);
  const participantCounts: Record<string, number> = {};
  if (eventIds.length > 0) {
    const counts = await db
      .select({
        eventId: eventParticipations.eventId,
        total: count(),
      })
      .from(eventParticipations)
      .where(
        and(
          eq(eventParticipations.status, 'registered'),
          isNull(eventParticipations.deletedAt)
        )
      )
      .groupBy(eventParticipations.eventId);
    for (const c of counts) {
      participantCounts[c.eventId] = c.total;
    }
  }

  const header = 'イベント名,開催日,バー名,参加者数,ステータス\n';
  const csvRows = rows.map((row) => {
    const title = `"${(row.title ?? '').replace(/"/g, '""')}"`;
    const date = row.startAt ? row.startAt.toLocaleDateString('ja-JP') : '';
    const bar = `"${row.orgName.replace(/"/g, '""')}"`;
    const participants = participantCounts[row.id] ?? 0;
    const resolvedStatus =
      row.status === 'published' && row.endAt && row.endAt < now
        ? '完了'
        : row.status === 'cancelled'
          ? 'キャンセル'
          : row.status === 'rejected'
            ? '却下'
            : row.status;
    return `${title},${date},${bar},${participants},${resolvedStatus}`;
  });

  const csv = '\uFEFF' + header + csvRows.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="organizer-history.csv"',
    },
  });
}
