import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { events } from "@e-be/db/schema";
import { getUserType } from "@/lib/auth";
import type { getDbUser } from "@/lib/auth";

type DbUser = Awaited<ReturnType<typeof getDbUser>>;

export const createCreateEventTool = (dbUser: DbUser) =>
  tool({
    description:
      "イベントの下書きを作成する。バー・タイトル・説明が揃った段階で呼び出す。",
    inputSchema: z.object({
      orgId: z.string().describe("バーのID（listBars で取得した id）"),
      title: z.string().max(100).describe("イベントタイトル（最大100文字）"),
      description: z
        .string()
        .max(2000)
        .describe("イベント説明（最大2000文字）"),
      startAt: z
        .string()
        .optional()
        .describe("開催開始日時（ISO 8601形式、任意）"),
      endAt: z
        .string()
        .optional()
        .describe("開催終了日時（ISO 8601形式、任意）"),
      maxParticipants: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe("定員（1〜500、任意）"),
      chargeAmount: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("チャージ料（円、0=無料、任意）"),
    }),
    execute: async ({
      orgId,
      title,
      description,
      startAt,
      endAt,
      maxParticipants,
      chargeAmount,
    }) => {
      if (!dbUser) return { error: "unauthorized" };

      const userType = await getUserType(dbUser.id);
      if (userType !== "user") return { error: "forbidden" };

      if (!/^[0-9a-f-]{36}$/.test(orgId)) return { error: "invalid_org" };
      if (!title.trim() || title.length > 100)
        return { error: "invalid_title" };
      if (!description.trim() || description.length > 2000)
        return { error: "invalid_description" };

      const startAtDate = startAt ? new Date(startAt) : undefined;
      const endAtDate = endAt ? new Date(endAt) : undefined;

      if (startAtDate && isNaN(startAtDate.getTime()))
        return { error: "invalid_start_at" };
      if (endAtDate && isNaN(endAtDate.getTime()))
        return { error: "invalid_end_at" };
      if (startAtDate && endAtDate && endAtDate <= startAtDate)
        return { error: "invalid_date_range" };

      const [event] = await db
        .insert(events)
        .values({
          orgId,
          userId: dbUser.id,
          status: "draft",
          title: title.trim(),
          description: description.trim(),
          startAt: startAtDate ?? null,
          endAt: endAtDate ?? null,
          maxParticipants: maxParticipants ?? null,
          chargeAmount: chargeAmount ?? null,
        })
        .returning({ id: events.id, title: events.title });

      return { ok: true, eventId: event.id, title: event.title, status: "draft" };
    },
  });
