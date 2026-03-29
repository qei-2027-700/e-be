import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { UIMessage } from "ai";
import { after } from "next/server";
import { getDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  aiChatDailyUsage,
  chatSessions,
  chatMessages,
} from "@e-be/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { createTools } from "@/lib/ai/tools";
import { buildSystemPrompt, type ChatPageContext } from "@/lib/ai/system-prompt";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

const TOKEN_LIMIT = parseInt(process.env.AI_CHAT_TOKEN_LIMIT ?? "15000", 10);
const HISTORY_LIMIT = 20;

const getTodayJST = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });

/** 今日の消費トークン数を返す（レコードがなければ 0） */
async function getDailyTokens(userId: string): Promise<{ tokens: number; count: number }> {
  const today = getTodayJST();
  const [row] = await db
    .select({
      tokens: aiChatDailyUsage.tokens,
      count: aiChatDailyUsage.count,
    })
    .from(aiChatDailyUsage)
    .where(and(eq(aiChatDailyUsage.userId, userId), eq(aiChatDailyUsage.date, today)));

  if (!row) return { tokens: 0, count: 0 };
  return { tokens: row.tokens, count: row.count };
}

export async function GET() {
  const dbUser = await getDbUser();
  if (!dbUser) {
    return Response.json({ tokens: 0, tokenLimit: TOKEN_LIMIT, messages: [] });
  }

  const { tokens } = await getDailyTokens(dbUser.id);

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
    return Response.json({ tokens, tokenLimit: TOKEN_LIMIT, messages: [] });
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

  const messages = rows.reverse().map((r) => ({
    id: r.id,
    role: r.role as "user" | "assistant",
    parts: r.parts as UIMessage["parts"],
    content: "",
  }));

  return Response.json({ tokens, tokenLimit: TOKEN_LIMIT, messages });
}

export async function POST(req: Request) {
  const { messages, ...pageContext }: { messages: UIMessage[] } & ChatPageContext =
    await req.json();

  // ツール呼び出し関連パーツ（tool-call / tool-result 等）は DB 保存時に除外しているため、
  // 不完全なペアが履歴に残っていると Gemini がエラーになる。安全のため text/reasoning のみ残す。
  const safeMessages: UIMessage[] = messages
    .map((msg) => ({
      ...msg,
      parts: msg.parts.filter(
        (p): p is Extract<UIMessage["parts"][number], { type: "text" | "reasoning" }> =>
          p.type === "text" || p.type === "reasoning"
      ),
    }))
    .filter((msg) => msg.parts.length > 0);

  const modelMessages = await convertToModelMessages(safeMessages);

  const dbUser = await getDbUser();

  // 認証済みユーザー: トークン制限チェック＋履歴保存
  if (dbUser) {
    const today = getTodayJST();
    const { tokens } = await getDailyTokens(dbUser.id);

    if (tokens >= TOKEN_LIMIT) {
      return Response.json(
        { error: "rate_limit_exceeded", tokens, tokenLimit: TOKEN_LIMIT },
        { status: 429 }
      );
    }

    // セッションを upsert
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
      onFinish: ({ response, usage }) => {
        after(async () => {
          const totalTokens = usage?.totalTokens ?? 0;

          // トークン累計を upsert（1ユーザー = 1日 = 1レコード）
          await db
            .insert(aiChatDailyUsage)
            .values({ userId: dbUser.id, date: today, count: 1, tokens: totalTokens })
            .onConflictDoUpdate({
              target: [aiChatDailyUsage.userId, aiChatDailyUsage.date],
              set: {
                count: sql`${aiChatDailyUsage.count} + 1`,
                tokens: sql`${aiChatDailyUsage.tokens} + ${totalTokens}`,
                updatedAt: sql`now()`,
              },
            });

          // AIレスポンスメッセージを UIMessage の parts 形式で保存
          // response.messages は ModelMessage 形式（content が string | ContentPart[]）
          // GET で読み出す際は UIMessage の parts として扱うため、テキスト部分のみ抽出する
          const assistantMsgs = response.messages.filter(
            (m) => m.role === "assistant"
          );
          for (const msg of assistantMsgs) {
            const parts: { type: string; text: string }[] = [];
            if (Array.isArray(msg.content)) {
              for (const contentPart of msg.content) {
                if (contentPart.type === "text" && contentPart.text) {
                  parts.push({ type: "text", text: contentPart.text });
                }
              }
            } else if (typeof msg.content === "string" && msg.content) {
              parts.push({ type: "text", text: msg.content });
            }
            if (parts.length > 0) {
              await db.insert(chatMessages).values({
                sessionId,
                role: "assistant",
                parts: parts as unknown as Record<string, unknown>[],
              });
            }
          }
        });
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
