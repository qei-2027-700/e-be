import { db } from "@/lib/db";
import { events, eventParticipations, organizations, barHostPermissions, barBlocks, users } from "@e-be/db/schema";
import { eq, and, gte, lte, isNull, or, lt, gt, asc, desc, ne, inArray, count, sql, isNotNull } from "drizzle-orm";
import { getLinesByStation, getStationsByLine } from "@e-be/db/station-lines";
import { areaKeyToPrefectures } from "@/lib/area-regions";

/**
 * イベント作成フォームのバー選択用に公開バー一覧を取得する。
 * deletedAt IS NULL の全組織を返す。
 */
export type MyDraftEventItem = {
  id: string;
  title: string | null;
  status: 'draft' | 'pending';
  orgName: string;
  createdAt: string;
  startAt: string | null;
};

/** ユーザーが作成した draft / pending イベントを新しい順で返す */
export async function getMyDraftEvents(userId: string): Promise<MyDraftEventItem[]> {
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
      orgName: organizations.name,
      createdAt: events.createdAt,
      startAt: events.startAt,
    })
    .from(events)
    .innerJoin(organizations, eq(events.orgId, organizations.id))
    .where(
      and(
        eq(events.userId, userId),
        inArray(events.status, ['draft', 'pending']),
        isNull(events.deletedAt)
      )
    )
    .orderBy(desc(events.createdAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status as 'draft' | 'pending',
    orgName: row.orgName,
    createdAt: row.createdAt.toISOString(),
    startAt: row.startAt?.toISOString() ?? null,
  }));
}

export async function getPublicBars(): Promise<{ id: string; name: string }[]> {
  return db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(isNull(organizations.deletedAt))
    .orderBy(asc(organizations.name));
}

/** ユーザーが指定バーへの公開許可を持つか確認する */
export async function hasBarHostPermission(userId: string, barId: string): Promise<boolean> {
  const rows = await db
    .select({ id: barHostPermissions.id })
    .from(barHostPermissions)
    .where(
      and(
        eq(barHostPermissions.userId, userId),
        eq(barHostPermissions.barId, barId),
        isNull(barHostPermissions.revokedAt),
        isNull(barHostPermissions.deletedAt)
      )
    )
    .limit(1);
  return rows.length > 0;
}

/**
 * 指定バー・時間帯に既存のイベント/ブロックが重複するか確認する。
 * published / pending イベントおよび bar_blocks を対象とする。
 * excludeEventId を指定した場合は自己競合を除外する。
 */
export async function checkEventConflict(
  barId: string,
  startAt: Date,
  endAt: Date,
  excludeEventId?: string
): Promise<boolean> {
  // イベント重複チェック（時間帯が重なる = startAt < endAt2 AND endAt > startAt2）
  const eventConditions = and(
    eq(events.orgId, barId),
    inArray(events.status, ["published", "pending"]),
    isNull(events.deletedAt),
    lt(events.startAt, endAt),
    gt(events.endAt, startAt),
    ...(excludeEventId ? [ne(events.id, excludeEventId)] : [])
  );

  const conflictingEvents = await db
    .select({ id: events.id })
    .from(events)
    .where(eventConditions)
    .limit(1);

  if (conflictingEvents.length > 0) return true;

  // barBlocks 重複チェック
  const blockConflicts = await db
    .select({ id: barBlocks.id })
    .from(barBlocks)
    .where(
      and(
        eq(barBlocks.barId, barId),
        isNull(barBlocks.deletedAt),
        lt(barBlocks.startAt, endAt),
        gt(barBlocks.endAt, startAt)
      )
    )
    .limit(1);

  return blockConflicts.length > 0;
}

/** オーナー用 draft/pending イベントを取得する（編集ページ用） */
export async function getDraftEventForOwner(
  eventId: string,
  userId: string
): Promise<{
  id: string;
  orgId: string;
  orgName: string;
  status: string;
  title: string | null;
  description: string | null;
  startAt: string | null;
  endAt: string | null;
  maxParticipants: number | null;
  chargeAmount: number | null;
  nearestStation: string | null;
} | null> {
  const rows = await db
    .select({
      id: events.id,
      orgId: events.orgId,
      orgName: organizations.name,
      status: events.status,
      title: events.title,
      description: events.description,
      startAt: events.startAt,
      endAt: events.endAt,
      maxParticipants: events.maxParticipants,
      chargeAmount: events.chargeAmount,
      nearestStation: events.nearestStation,
    })
    .from(events)
    .innerJoin(organizations, eq(events.orgId, organizations.id))
    .where(
      and(
        eq(events.id, eventId),
        eq(events.userId, userId),
        isNull(events.deletedAt)
      )
    )
    .limit(1);

  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    startAt: row.startAt?.toISOString() ?? null,
    endAt: row.endAt?.toISOString() ?? null,
  };
}

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
  orgName: string;
  isPublic: boolean;
  chargeAmount: number | null;
  participantCount: number;
};

/**
 * ユーザーが主催したイベントの履歴を取得する。
 * - completed 相当: published かつ endAt が過去（completed ステータスはスキーマに存在しない）
 * - 自分のダッシュボード用に cancelled / rejected も含める
 * - 新しい順（startAt DESC）で返す
 */
export async function getOrganizerHistory(userId: string): Promise<OrganizerHistoryItem[]> {
  const now = new Date();

  const participantCountSq = db
    .select({ count: count() })
    .from(eventParticipations)
    .where(
      and(
        eq(eventParticipations.eventId, events.id),
        eq(eventParticipations.status, "registered"),
        isNull(eventParticipations.deletedAt)
      )
    );

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      startAt: events.startAt,
      endAt: events.endAt,
      status: events.status,
      orgId: events.orgId,
      orgName: organizations.name,
      isPublic: events.isPublic,
      chargeAmount: events.chargeAmount,
      participantCount: sql<number>`(${participantCountSq})`,
    })
    .from(events)
    .innerJoin(organizations, eq(events.orgId, organizations.id))
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
    orgName: row.orgName,
    isPublic: row.isPublic,
    chargeAmount: row.chargeAmount,
    participantCount: Number(row.participantCount),
  }));
}

export type PublicOrganizerHistoryItem = {
  id: string;
  title: string | null;
  startAt: string | null;
};

/**
 * プロフィールページ用に公開設定の主催履歴を取得する。
 * - is_public = true かつ published かつ終了済み（completed 相当）のみ
 * - 未ログインでも閲覧可能
 * - 新しい順（startAt DESC）で返す
 */
export async function getPublicOrganizerHistory(userId: string): Promise<PublicOrganizerHistoryItem[]> {
  const now = new Date();

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      startAt: events.startAt,
    })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        eq(events.isPublic, true),
        eq(events.status, "published"),
        lt(events.endAt, now),
        isNull(events.deletedAt)
      )
    )
    .orderBy(desc(events.startAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    startAt: row.startAt?.toISOString() ?? null,
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

export type UpcomingParticipationItem = {
  participationId: string;
  eventId: string;
  title: string | null;
  startAt: string | null;
  endAt: string | null;
};

/**
 * 参加予定のイベントを取得する。
 * - registered かつ events.endAt が未来のもの
 * - events.status = 'published' のみ（cancelled/rejected イベントは表示しない）
 * - 近い順（events.startAt ASC）で返す
 */
export async function getUpcomingParticipations(userId: string): Promise<UpcomingParticipationItem[]> {
  const now = new Date();

  const rows = await db
    .select({
      participationId: eventParticipations.id,
      eventId: events.id,
      title: events.title,
      startAt: events.startAt,
      endAt: events.endAt,
    })
    .from(eventParticipations)
    .innerJoin(events, eq(eventParticipations.eventId, events.id))
    .where(
      and(
        eq(eventParticipations.userId, userId),
        eq(eventParticipations.status, "registered"),
        isNull(eventParticipations.deletedAt),
        isNull(events.deletedAt),
        gt(events.endAt, now),
        eq(events.status, "published")
      )
    )
    .orderBy(asc(events.startAt));

  return rows.map((row) => ({
    participationId: row.participationId,
    eventId: row.eventId,
    title: row.title,
    startAt: row.startAt?.toISOString() ?? null,
    endAt: row.endAt?.toISOString() ?? null,
  }));
}

/**
 * ユーザーが参加表明したイベントの履歴を取得する。
 * - registered かつ endAt が過去、または cancelled
 * - 論理削除されていない参加レコードのみ
 * - 新しい順（events.startAt DESC）で返す
 * - events.status はフィルタしない。キャンセル済みイベントも履歴として表示する設計のため
 *   （docs/features/event-participation.md: 参加表明済み・参加済み・キャンセル済みを一覧表示）
 */
export async function getParticipationHistory(userId: string): Promise<ParticipationHistoryItem[]> {
  const now = new Date();

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
        isNull(events.deletedAt),
        or(
          and(eq(eventParticipations.status, "registered"), lt(events.endAt, now)),
          eq(eventParticipations.status, "cancelled")
        )
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

export type EventDetail = {
  id: string;
  title: string | null;
  description: string | null;
  startAt: string | null;
  endAt: string | null;
  location: string | null;
  chargeAmount: number | null;
  orgName: string;
  orgSlug: string | null;
  orgAddress: string | null;
  myParticipationStatus: "registered" | "cancelled" | null;
  participantCount: number;
  maxParticipants: number | null;
  organizerUserId: string;
  organizerName: string | null;
  organizerXUrl: string | null;
};

/**
 * 指定イベントの現在の参加者数を返す。
 * - status = 'registered' かつ deletedAt IS NULL の件数
 */
export async function getEventParticipantCount(eventId: string): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(eventParticipations)
    .where(
      and(
        eq(eventParticipations.eventId, eventId),
        eq(eventParticipations.status, "registered"),
        isNull(eventParticipations.deletedAt)
      )
    );
  return total;
}

/**
 * イベント詳細を取得する。
 * - published かつ deleted_at IS NULL のイベントのみ
 * - userId が一致する参加レコードがあれば参加ステータスも返す
 */
export async function getEventDetail(
  eventId: string,
  userId?: string
): Promise<EventDetail | null> {
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      startAt: events.startAt,
      endAt: events.endAt,
      location: events.location,
      chargeAmount: events.chargeAmount,
      maxParticipants: events.maxParticipants,
      orgName: organizations.name,
      orgSlug: organizations.slug,
      orgAddress: organizations.address,
      participationStatus: eventParticipations.status,
      organizerUserId: events.userId,
      organizerName: users.name,
      organizerXUrl: users.xUrl,
    })
    .from(events)
    .innerJoin(organizations, eq(events.orgId, organizations.id))
    .innerJoin(users, eq(events.userId, users.id))
    .leftJoin(
      eventParticipations,
      userId
        ? and(
            eq(eventParticipations.eventId, events.id),
            eq(eventParticipations.userId, userId),
            isNull(eventParticipations.deletedAt)
          )
        : sql`false`
    )
    .where(
      and(
        eq(events.id, eventId),
        eq(events.status, "published"),
        isNull(events.deletedAt)
      )
    )
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  const participantCount = await getEventParticipantCount(eventId);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startAt: row.startAt?.toISOString() ?? null,
    endAt: row.endAt?.toISOString() ?? null,
    location: row.location,
    chargeAmount: row.chargeAmount ?? null,
    maxParticipants: row.maxParticipants ?? null,
    orgName: row.orgName,
    orgSlug: row.orgSlug ?? null,
    orgAddress: row.orgAddress,
    myParticipationStatus: row.participationStatus ?? null,
    participantCount,
    organizerUserId: row.organizerUserId,
    organizerName: row.organizerName ?? null,
    organizerXUrl: row.organizerXUrl ?? null,
  };
}

export type PublicEventItem = {
  id: string;
  title: string | null;
  startAt: string | null;
  endAt: string | null;
  orgId: string;
  orgName: string;
  orgSlug: string | null;
  orgAddress: string | null;
  orgPrefecture: string | null;
  nearestStation: string | null;
  chargeAmount: number | null;
  maxParticipants: number | null;
  participantCount: number;
  thumbnailUrl: string | null;
};

export type SearchEventsOptions = {
  date?: string;    // YYYY-MM-DD（この日に開催）
  area?: string;    // 広域エリアキー
  line?: string;    // 路線名（マスタ完全一致）
  limit?: number;
  offset?: number;
};

/**
 * 公開イベントを検索する。未ログインでもアクセス可。
 * - published かつ start_at が未来のイベントのみ
 * - 日付・都道府県・路線でフィルタリング可能
 */
export async function searchPublicEvents(opts: SearchEventsOptions = {}): Promise<PublicEventItem[]> {
  const { date, area, line, limit = 20, offset = 0 } = opts;

  // 本日 00:00:00 UTC 以降のイベントを対象とする
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const participantCountSq = db
    .select({ count: count() })
    .from(eventParticipations)
    .where(
      and(
        eq(eventParticipations.eventId, events.id),
        eq(eventParticipations.status, "registered"),
        isNull(eventParticipations.deletedAt)
      )
    );

  const conditions: ReturnType<typeof and>[] = [
    eq(events.status, "published"),
    isNull(events.deletedAt),
    gte(events.startAt, startOfToday),
    isNull(organizations.deletedAt),
  ];

  if (date) {
    // start_at の日付部分が一致するもの (UTC日付で比較)
    conditions.push(sql`DATE(${events.startAt}) = ${date}`);
  }

  if (area) {
    const prefectures = areaKeyToPrefectures(area);
    if (prefectures.length > 0) {
      conditions.push(inArray(organizations.prefecture, prefectures));
    } else {
      conditions.push(sql`FALSE`);
    }
  }

  if (line) {
    const stations = getStationsByLine(line);
    if (stations.length > 0) {
      conditions.push(inArray(events.nearestStation, stations));
    } else {
      // 該当駅なし → 結果ゼロになるよう FALSE 条件を追加
      conditions.push(sql`FALSE`);
    }
  }

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      startAt: events.startAt,
      endAt: events.endAt,
      orgId: events.orgId,
      orgName: organizations.name,
      orgSlug: organizations.slug,
      orgAddress: organizations.address,
      orgPrefecture: organizations.prefecture,
      nearestStation: events.nearestStation,
      chargeAmount: events.chargeAmount,
      maxParticipants: events.maxParticipants,
      participantCount: sql<number>`(${participantCountSq})`,
      thumbnailUrl: events.thumbnailUrl,
    })
    .from(events)
    .innerJoin(organizations, eq(events.orgId, organizations.id))
    .where(and(...conditions))
    .orderBy(asc(events.startAt))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    startAt: row.startAt?.toISOString() ?? null,
    endAt: row.endAt?.toISOString() ?? null,
    orgId: row.orgId,
    orgName: row.orgName,
    orgSlug: row.orgSlug ?? null,
    orgAddress: row.orgAddress,
    orgPrefecture: row.orgPrefecture,
    nearestStation: row.nearestStation,
    chargeAmount: row.chargeAmount,
    maxParticipants: row.maxParticipants,
    participantCount: Number(row.participantCount),
    thumbnailUrl: row.thumbnailUrl,
  }));
}

/**
 * DB に登録済みの nearest_station から算出した路線名一覧を返す。
 * セレクトボックスに表示する路線を動的に絞り込むために使用する。
 */
export async function getAvailableLines(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ nearestStation: events.nearestStation })
    .from(events)
    .where(
      and(
        eq(events.status, "published"),
        isNull(events.deletedAt),
        isNotNull(events.nearestStation)
      )
    );

  const lineSet = new Set<string>();
  for (const row of rows) {
    if (row.nearestStation) {
      for (const line of getLinesByStation(row.nearestStation)) {
        lineSet.add(line);
      }
    }
  }
  return Array.from(lineSet).sort();
}
