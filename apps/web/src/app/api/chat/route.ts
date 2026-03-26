import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { UIMessage } from "ai";
import { getDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiChatDailyUsage } from "@e-be/db/schema";
import { eq, sql } from "drizzle-orm";
import { createTools } from "@/lib/ai/tools";
import { buildSystemPrompt, type ChatPageContext } from "@/lib/ai/system-prompt";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

const DAILY_LIMIT = parseInt(process.env.AI_CHAT_DAILY_LIMIT ?? "10", 10);

const getTodayJST = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });

export async function GET() {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return Response.json({ used: 0, limit: DAILY_LIMIT });
  }

  const today = getTodayJST();
  const [row] = await db
    .select({ count: aiChatDailyUsage.count, date: aiChatDailyUsage.date })
    .from(aiChatDailyUsage)
    .where(eq(aiChatDailyUsage.userId, dbUser.id))
    .limit(1);

  // レコードが今日付でなければ残回数は満タン
  const used = row?.date === today ? (row?.count ?? 0) : 0;
  return Response.json({ used, limit: DAILY_LIMIT });
}

export async function POST(req: Request) {
  const { messages, ...pageContext }: { messages: UIMessage[] } & ChatPageContext =
    await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const dbUser = await getDbUser();

  // レート制限チェック（認証済みユーザーのみ）
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
  }

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: buildSystemPrompt(pageContext),
    messages: modelMessages,
    tools: createTools(dbUser),
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
