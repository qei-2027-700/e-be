import { tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import { organizations, barHostPermissions } from "@e-be/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import type { getDbUser } from "@/lib/auth";

type DbUser = Awaited<ReturnType<typeof getDbUser>>;

export const createListBarsTool = (dbUser: DbUser) =>
  tool({
    description:
      "ユーザーがイベントを主催できるバー（会場）の一覧を取得する。イベント作成前にバーを選んでもらうために使う。",
    inputSchema: z.object({}),
    execute: async () => {
      if (!dbUser) return { error: "unauthorized", bars: [] };

      const permitted = await db
        .select({ id: organizations.id, name: organizations.name })
        .from(barHostPermissions)
        .innerJoin(
          organizations,
          eq(barHostPermissions.barId, organizations.id)
        )
        .where(
          and(
            eq(barHostPermissions.userId, dbUser.id),
            isNull(barHostPermissions.revokedAt),
            isNull(barHostPermissions.deletedAt),
            isNull(organizations.deletedAt)
          )
        );

      if (permitted.length > 0) {
        return { bars: permitted };
      }

      // 許可済みバーがない場合は全バー一覧を返す（申請可能な候補として）
      const all = await db
        .select({ id: organizations.id, name: organizations.name })
        .from(organizations)
        .where(isNull(organizations.deletedAt))
        .limit(20);

      return { bars: all };
    },
  });
