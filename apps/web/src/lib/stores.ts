import { db } from "@/lib/db";
import { organizations, events, eventParticipations } from "@e-be/db/schema";
import { eq, and, isNull, desc, count, sql } from "drizzle-orm";

export type PublicStoreDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  nearestLine: string | null;
  iconUrl: string | null;
  coverImageUrl: string | null;
  events: {
    id: string;
    title: string | null;
    startAt: string | null;
    chargeAmount: number | null;
    maxParticipants: number | null;
    participantCount: number;
    thumbnailUrl: string | null;
  }[];
};

export async function getPublicStoreBySlug(slug: string): Promise<PublicStoreDetail | null> {
  const [org] = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
      name: organizations.name,
      description: organizations.description,
      address: organizations.address,
      nearestLine: organizations.nearestLine,
      iconUrl: organizations.iconUrl,
      coverImageUrl: organizations.coverImageUrl,
    })
    .from(organizations)
    .where(and(eq(organizations.slug, slug), isNull(organizations.deletedAt)))
    .limit(1);

  if (!org) return null;

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

  const eventRows = await db
    .select({
      id: events.id,
      title: events.title,
      startAt: events.startAt,
      chargeAmount: events.chargeAmount,
      maxParticipants: events.maxParticipants,
      thumbnailUrl: events.thumbnailUrl,
      participantCount: sql<number>`(${participantCountSq})`,
    })
    .from(events)
    .where(
      and(
        eq(events.orgId, org.id),
        eq(events.status, "published"),
        isNull(events.deletedAt)
      )
    )
    .orderBy(desc(events.startAt))
    .limit(10);

  return {
    ...org,
    events: eventRows.map((e) => ({
      id: e.id as string,
      title: e.title as string | null,
      startAt: e.startAt ? (e.startAt as Date).toISOString() : null,
      chargeAmount: e.chargeAmount as number | null,
      maxParticipants: e.maxParticipants as number | null,
      participantCount: Number(e.participantCount),
      thumbnailUrl: e.thumbnailUrl as string | null,
    })),
  };
}
