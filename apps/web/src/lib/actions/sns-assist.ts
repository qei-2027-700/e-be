"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEventDetail } from "@/lib/events";
import { getUser } from "@/lib/auth";

type SnsContent = {
  xPost: string;
  imagePrompt: string;
};

type Result = { ok: true; data: SnsContent } | { ok: false; error: string };

export async function generateSnsContent(eventId: string): Promise<Result> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: "API key not configured" };

  const user = await getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const event = await getEventDetail(eventId, user.id);
  if (!event) return { ok: false, error: "Event not found" };
  if (event.organizerUserId !== user.id) return { ok: false, error: "Forbidden" };

  const prompt = `以下のイベント情報を元に、2つのコンテンツをJSON形式で生成してください。

イベント情報:
- タイトル: ${event.title ?? "未設定"}
- 日時: ${event.startAt ? new Date(event.startAt).toLocaleString("ja-JP") : "未設定"}
- 場所: ${event.location ?? "未設定"}
- 説明: ${event.description ?? "なし"}

出力形式（JSONのみ、説明文不要）:
{
  "xPost": "X（Twitter）投稿文言（140文字以内、ハッシュタグ含む、日本語）",
  "imagePrompt": "SNS画像生成用英語プロンプト（Midjourney/DALL-E向け、英語）"
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // ```json ... ``` のコードブロックを除去
    const jsonText = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(jsonText) as SnsContent;

    if (!parsed.xPost || !parsed.imagePrompt) {
      return { ok: false, error: "Invalid response format" };
    }

    return { ok: true, data: parsed };
  } catch (e) {
    console.error("Gemini API error:", e);
    return { ok: false, error: "Generation failed. Please try again." };
  }
}
