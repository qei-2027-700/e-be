import { streamText, convertToModelMessages, stepCountIs, tool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import type { UIMessage } from "ai";
import { getDbUser, getUserType } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, organizations, barHostPermissions } from "@e-be/db/schema";
import { eq, and, isNull } from "drizzle-orm";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const dbUser = await getDbUser();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: `あなたは e-be のAIアシスタントです。
e-be はイベント主催者・店舗向けのイベント運営・分析プラットフォームです。
ユーザーのイベント企画・集客・運営に関する質問に日本語で丁寧に答えてください。
必要に応じてツールを使い、ステップバイステップで考えて回答してください。

イベント作成機能について:
- createEvent ツールを使ってイベントの下書きを作成できます
- 作成前に必ず以下の情報を会話で確認してください: バー（listBars で一覧取得）、タイトル（最大100文字）、説明（最大2000文字）
- 日時（startAt・endAt）が分かれば設定してください（なくても下書き作成は可能です）
- 作成されるのは「下書き」状態です。申請・公開は管理画面から行う必要があります
- 未ログインの場合はイベントを作成できません`,
    messages: modelMessages,
    tools: {
      writePlan: tool({
        description:
          "タスクや計画をリストアップして整理する（DeepAgents の write_todos に相当）",
        inputSchema: z.object({
          title: z.string().describe("計画のタイトル"),
          todos: z.array(z.string()).describe("タスクリスト"),
        }),
        execute: async ({ title, todos }) => ({
          title,
          todos,
          createdAt: new Date().toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo",
          }),
        }),
      }),
      getCurrentDateTime: tool({
        description: "現在の日時を取得する",
        inputSchema: z.object({}),
        execute: async () => ({
          datetime: new Date().toLocaleString("ja-JP", {
            timeZone: "Asia/Tokyo",
          }),
          timezone: "Asia/Tokyo",
        }),
      }),
      listBars: tool({
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
      }),
      createEvent: tool({
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
      }),
    },
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
