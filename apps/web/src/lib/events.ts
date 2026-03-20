import { db } from "@/lib/db";
import { events, eventParticipations } from "@e-be/db/schema";
import { eq, and, gte, lte, isNull, or, lt, desc } from "drizzle-orm";

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

export type OrganizerHistoryItem = {
  id: string;
  title: string | null;
  startAt: string | null;
  endAt: string | null;
  status: string;
  orgId: string;
};

/**
 * ユーザーが主催したイベントの履歴を取得する。
 * - completed 相当: published かつ endAt が過去（completed ステータスはスキーマに存在しない）
 * - 自分のダッシュボード用に cancelled / rejected も含める
 * - 新しい順（startAt DESC）で返す
 */
export async function getOrganizerHistory(userId: string): Promise<OrganizerHistoryItem[]> {
  const now = new Date();

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      startAt: events.startAt,
      endAt: events.endAt,
      status: events.status,
      orgId: events.orgId,
    })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        isNull(events.deletedAt),
        or(
          // completed 相当: published かつ終了済み
          and(eq(events.status, "published"), lt(events.endAt, now)),
          // 自分のダッシュボードのみ表示
          eq(events.status, "cancelled"),
          eq(events.status, "rejected")
        )
      )
    )
    .orderBy(desc(events.startAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    startAt: row.startAt?.toISOString() ?? null,
    endAt: row.endAt?.toISOString() ?? null,
    status: row.status,
    orgId: row.orgId,
  }));
}

export type ParticipationHistoryItem = {
  participationId: string;
  participationStatus: string;
  eventId: string;
  title: string | null;
  startAt: string | null;
  endAt: string | null;
  eventStatus: string;
};

/**
 * ユーザーが参加表明したイベントの履歴を取得する。
 * - 論理削除されていない参加レコードのみ
 * - 新しい順（events.startAt DESC）で返す
 */
export async function getParticipationHistory(userId: string): Promise<ParticipationHistoryItem[]> {
  const rows = await db
    .select({
      participationId: eventParticipations.id,
      participationStatus: eventParticipations.status,
      eventId: events.id,
      title: events.title,
      startAt: events.startAt,
      endAt: events.endAt,
      eventStatus: events.status,
    })
    .from(eventParticipations)
    .innerJoin(events, eq(eventParticipations.eventId, events.id))
    .where(
      and(
        eq(eventParticipations.userId, userId),
        isNull(eventParticipations.deletedAt),
        isNull(events.deletedAt)
      )
    )
    .orderBy(desc(events.startAt));

  return rows.map((row) => ({
    participationId: row.participationId,
    participationStatus: row.participationStatus,
    eventId: row.eventId,
    title: row.title,
    startAt: row.startAt?.toISOString() ?? null,
    endAt: row.endAt?.toISOString() ?? null,
    eventStatus: row.eventStatus,
  }));
}
