import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { UIMessage } from "ai";
import { getDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiChatDailyUsage } from "@e-be/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createTools } from "@/lib/ai/tools";
import { systemPrompt } from "@/lib/ai/system-prompt";

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
    .select({ count: aiChatDailyUsage.count })
    .from(aiChatDailyUsage)
    .where(
      and(
        eq(aiChatDailyUsage.userId, dbUser.id),
        eq(aiChatDailyUsage.date, today)
      )
    )
    .limit(1);

  return Response.json({ used: row?.count ?? 0, limit: DAILY_LIMIT });
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const dbUser = await getDbUser();

  // レート制限チェック（認証済みユーザーのみ）
  if (dbUser) {
    const today = getTodayJST();
    const [row] = await db
      .select({ count: aiChatDailyUsage.count })
      .from(aiChatDailyUsage)
      .where(
        and(
          eq(aiChatDailyUsage.userId, dbUser.id),
          eq(aiChatDailyUsage.date, today)
        )
      )
      .limit(1);

    const used = row?.count ?? 0;
    if (used >= DAILY_LIMIT) {
      return Response.json(
        { error: "rate_limit_exceeded", used, limit: DAILY_LIMIT },
        { status: 429 }
      );
    }

    // 使用回数をインクリメント
    await db
      .insert(aiChatDailyUsage)
      .values({ userId: dbUser.id, date: today, count: 1 })
      .onConflictDoUpdate({
        target: [aiChatDailyUsage.userId, aiChatDailyUsage.date],
        set: {
          count: sql`${aiChatDailyUsage.count} + 1`,
          updatedAt: sql`now()`,
        },
      });
  }

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: modelMessages,
    tools: createTools(dbUser),
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
