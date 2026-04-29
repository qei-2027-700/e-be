"use server";

import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { getEventDetail } from "@/lib/events";
import { getUser } from "@/lib/auth";

const snsSchema = z.object({
  xPost: z.string().describe("X（Twitter）投稿文言（140文字以内、ハッシュタグ含む、日本語）"),
  imagePrompt: z.string().describe("SNS画像生成用英語プロンプト（Midjourney/DALL-E向け、英語）"),
});

type Result =
  | { ok: true; data: z.infer<typeof snsSchema> }
  | { ok: false; error: string };

export async function generateSnsContent(eventId: string): Promise<Result> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const event = await getEventDetail(eventId, user.id);
  if (!event) return { ok: false, error: "Event not found" };
  if (event.organizerUserId !== user.id) return { ok: false, error: "Forbidden" };

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });

  const prompt = `以下のイベント情報を元に、SNSコンテンツを生成してください。

イベント情報:
- タイトル: ${event.title ?? "未設定"}
- 日時: ${event.startAt ? new Date(event.startAt).toLocaleString("ja-JP") : "未設定"}
- 場所: ${event.location ?? "未設定"}
- 説明: ${event.description ?? "なし"}`;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: snsSchema,
      prompt,
    });

    return { ok: true, data: object };
  } catch (e) {
    console.error("SNS content generation error:", e);
    return { ok: false, error: "Generation failed. Please try again." };
  }
}
