import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { events } from "@e-be/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import type { getDbUser } from "@/lib/auth";

type DbUser = Awaited<ReturnType<typeof getDbUser>>;

export const createUpdateEventTool = (dbUser: DbUser) =>
  tool({
    description:
      "既存の下書きイベントを修正する。変更したいフィールドだけ渡せばよい。draft ステータスのみ修正可能。eventId は listEvents で確認する。",
    inputSchema: z.object({
      eventId: z.string().describe("修正するイベントの ID"),
      title: z
        .string()
        .max(100)
        .optional()
        .describe("新しいタイトル（変更しない場合は省略）"),
      description: z
        .string()
        .max(2000)
        .optional()
        .describe("新しい説明（変更しない場合は省略）"),
      startAt: z
        .string()
        .optional()
        .describe("新しい開始日時（ISO 8601、変更しない場合は省略）"),
      endAt: z
        .string()
        .optional()
        .describe("新しい終了日時（ISO 8601、変更しない場合は省略）"),
      maxParticipants: z
        .number()
        .int()
        .min(1)
        .max(500)
        .nullable()
        .optional()
        .describe("新しい定員（null=定員なし、変更しない場合は省略）"),
      chargeAmount: z
        .number()
        .int()
        .min(0)
        .nullable()
        .optional()
        .describe("新しいチャージ料（null=未設定、変更しない場合は省略）"),
    }),
    execute: async ({
      eventId,
      title,
      description,
      startAt,
      endAt,
      maxParticipants,
      chargeAmount,
    }) => {
      if (!dbUser) return { error: "unauthorized" };
      if (!/^[0-9a-f-]{36}$/.test(eventId)) return { error: "invalid_event_id" };

      const [existing] = await db
        .select({
          id: events.id,
          status: events.status,
          userId: events.userId,
        })
        .from(events)
        .where(and(eq(events.id, eventId), isNull(events.deletedAt)))
        .limit(1);

      if (!existing) return { error: "not_found" };
      if (existing.userId !== dbUser.id) return { error: "forbidden" };
      if (existing.status !== "draft") return { error: "not_draft" };

      if (title !== undefined && (!title.trim() || title.length > 100))
        return { error: "invalid_title" };
      if (
        description !== undefined &&
        (!description.trim() || description.length > 2000)
      )
        return { error: "invalid_description" };

      const startAtDate = startAt ? new Date(startAt) : undefined;
      const endAtDate = endAt ? new Date(endAt) : undefined;
      if (startAtDate && isNaN(startAtDate.getTime()))
        return { error: "invalid_start_at" };
      if (endAtDate && isNaN(endAtDate.getTime()))
        return { error: "invalid_end_at" };
      if (startAtDate && endAtDate && endAtDate <= startAtDate)
        return { error: "invalid_date_range" };

      // 変更するフィールドだけ更新
      const updateValues: Record<string, unknown> = { updatedAt: new Date() };
      if (title !== undefined) updateValues.title = title.trim();
      if (description !== undefined) updateValues.description = description.trim();
      if (startAt !== undefined) updateValues.startAt = startAtDate ?? null;
      if (endAt !== undefined) updateValues.endAt = endAtDate ?? null;
      if (maxParticipants !== undefined)
        updateValues.maxParticipants = maxParticipants;
      if (chargeAmount !== undefined) updateValues.chargeAmount = chargeAmount;

      const [updated] = await db
        .update(events)
        .set(updateValues)
        .where(eq(events.id, eventId))
        .returning({ id: events.id, title: events.title });

      return {
        ok: true,
        eventId: updated.id,
        title: updated.title,
        status: "draft",
      };
    },
  });
