import { tool } from "ai";
import { z } from "zod";

export const suggestRepliesTool = tool({
  description:
    "ユーザーへのクイックリプライ候補を提示する。選択肢が明確な質問（日時・金額・はい/いいえ等）をするときに呼ぶ。",
  inputSchema: z.object({
    replies: z
      .array(z.string().max(30))
      .max(8)
      .describe("選択肢（最大8件、各30文字以内）"),
  }),
  execute: async ({ replies }) => ({ replies }),
});
