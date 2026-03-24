import { streamText, convertToModelMessages, stepCountIs, tool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import type { UIMessage } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: google("gemini-1.5-flash"),
    system: `あなたは e-be のAIアシスタントです。
e-be はイベント主催者・店舗向けのイベント運営・分析プラットフォームです。
ユーザーのイベント企画・集客・運営に関する質問に日本語で丁寧に答えてください。
必要に応じてツールを使い、ステップバイステップで考えて回答してください。`,
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
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
