import { db } from "@/lib/db";
import { events } from "@e-be/db/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";

export type CalendarEventData = {
  id: string;
  title: string | null;
  startAt: string | null; // ISO 8601 文字列（Server→Client 境界でシリアライズ済み）
};

type GetEventsForCalendarOptions = {
  /** 組織 ID を指定するとその組織のイベントのみ取得 */
  orgId?: string;
  from: Date;
  to: Date;
};

/**
 * カレンダー表示用に公開済みイベントを取得する。
 * startAt が from〜to の範囲内かつ status が 'published' のイベントを返す。
 */
export async function getEventsForCalendar({
  orgId,
  from,
  to,
}: GetEventsForCalendarOptions): Promise<CalendarEventData[]> {
  const conditions = [
    eq(events.status, "published"),
    isNull(events.deletedAt),
    gte(events.startAt, from),
    lte(events.startAt, to),
  ];

  if (orgId) {
    conditions.push(eq(events.orgId, orgId));
  }

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      startAt: events.startAt,
    })
    .from(events)
    .where(and(...conditions));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    startAt: row.startAt?.toISOString() ?? null,
  }));
}
