import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { events } from "@e-be/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import type { getDbUser } from "@/lib/auth";

type DbUser = Awaited<ReturnType<typeof getDbUser>>;

export const createListEventsTool = (dbUser: DbUser) =>
  tool({
    description:
      "ユーザーが作成した下書きイベントの一覧を取得する。既存イベントを修正する前に eventId を確認するために使う。",
    inputSchema: z.object({}),
    execute: async () => {
      if (!dbUser) return { error: "unauthorized", events: [] };

      const rows = await db
        .select({
          id: events.id,
          title: events.title,
          status: events.status,
          startAt: events.startAt,
        })
        .from(events)
        .where(
          and(
            eq(events.userId, dbUser.id),
            eq(events.status, "draft"),
            isNull(events.deletedAt)
          )
        )
        .limit(10);

      return { events: rows };
    },
  });
