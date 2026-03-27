import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { UIMessage } from "ai";
import { getDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  aiChatDailyUsage,
  chatSessions,
  chatMessages,
} from "@e-be/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { createTools } from "@/lib/ai/tools";
import { buildSystemPrompt, type ChatPageContext } from "@/lib/ai/system-prompt";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

const DAILY_LIMIT = parseInt(process.env.AI_CHAT_DAILY_LIMIT ?? "10", 10);
const HISTORY_LIMIT = 20;

const getTodayJST = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });

export async function GET() {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return Response.json({ used: 0, limit: DAILY_LIMIT, messages: [] });
  }

  const today = getTodayJST();
  const [row] = await db
    .select({ count: aiChatDailyUsage.count, date: aiChatDailyUsage.date })
    .from(aiChatDailyUsage)
    .where(eq(aiChatDailyUsage.userId, dbUser.id))
    .limit(1);

  // レコードが今日付でなければ残回数は満タン
  const used = row?.date === today ? (row?.count ?? 0) : 0;

  // セッションと履歴を取得
  const session = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(
      sql`${chatSessions.userId} = ${dbUser.id} AND ${chatSessions.deletedAt} IS NULL`
    )
    .limit(1)
    .then((r) => r[0]);

  if (!session) {
    return Response.json({ used, limit: DAILY_LIMIT, messages: [] });
  }

  const rows = await db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      parts: chatMessages.parts,
    })
    .from(chatMessages)
    .where(
      sql`${chatMessages.sessionId} = ${session.id} AND ${chatMessages.deletedAt} IS NULL`
    )
    .orderBy(desc(chatMessages.createdAt))
    .limit(HISTORY_LIMIT);

  // 古い順に並び直してUIMessage形式に変換
  const messages = rows.reverse().map((r) => ({
    id: r.id,
    role: r.role as "user" | "assistant",
    parts: r.parts as UIMessage["parts"],
    content: "",
  }));

  return Response.json({ used, limit: DAILY_LIMIT, messages });
}

export async function POST(req: Request) {
  const { messages, ...pageContext }: { messages: UIMessage[] } & ChatPageContext =
    await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const dbUser = await getDbUser();

  // 認証済みユーザー: レート制限チェック＋履歴保存
  if (dbUser) {
    const today = getTodayJST();
    const [row] = await db
      .select({ count: aiChatDailyUsage.count, date: aiChatDailyUsage.date })
      .from(aiChatDailyUsage)
      .where(eq(aiChatDailyUsage.userId, dbUser.id))
      .limit(1);

    // 過去日付のレコードがあれば 0 扱い
    const used = row?.date === today ? (row?.count ?? 0) : 0;
    if (used >= DAILY_LIMIT) {
      return Response.json(
        { error: "rate_limit_exceeded", used, limit: DAILY_LIMIT },
        { status: 429 }
      );
    }

    // upsert: userId で競合したら日付が今日なら+1、違う日なら1にリセット
    await db
      .insert(aiChatDailyUsage)
      .values({ userId: dbUser.id, date: today, count: 1 })
      .onConflictDoUpdate({
        target: [aiChatDailyUsage.userId],
        set: {
          count: sql`CASE WHEN ${aiChatDailyUsage.date} = ${today} THEN ${aiChatDailyUsage.count} + 1 ELSE 1 END`,
          date: today,
          updatedAt: sql`now()`,
        },
      });

    // セッションを upsert（userId で競合したら updatedAt だけ更新）
    const [session] = await db
      .insert(chatSessions)
      .values({ userId: dbUser.id })
      .onConflictDoUpdate({
        target: [chatSessions.userId],
        set: { updatedAt: sql`now()` },
      })
      .returning({ id: chatSessions.id });

    // 最後のユーザーメッセージを保存
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user") {
      await db.insert(chatMessages).values({
        sessionId: session.id,
        role: "user",
        parts: lastUserMsg.parts as unknown as Record<string, unknown>[],
      });
    }

    const sessionId = session.id;
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: buildSystemPrompt(pageContext),
      messages: modelMessages.slice(-HISTORY_LIMIT),
      tools: createTools(dbUser),
      stopWhen: stepCountIs(10),
      onFinish: async ({ response }) => {
        const assistantMsgs = response.messages.filter(
          (m) => m.role === "assistant"
        );
        for (const msg of assistantMsgs) {
          const parts = Array.isArray(msg.content)
            ? msg.content
            : [{ type: "text", text: String(msg.content) }];
          await db.insert(chatMessages).values({
            sessionId,
            role: "assistant",
            parts: parts as unknown as Record<string, unknown>[],
          });
        }
      },
    });

    return result.toUIMessageStreamResponse();
  }

  // 未認証ユーザー: 保存なしで通常ストリーム
  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: buildSystemPrompt(pageContext),
    messages: modelMessages,
    tools: createTools(dbUser),
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
