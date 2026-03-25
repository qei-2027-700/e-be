import { tool } from "ai";
import { z } from "zod";

export const getCurrentDateTimeTool = tool({
  description: "現在の日時を取得する",
  inputSchema: z.object({}),
  execute: async () => ({
    datetime: new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    }),
    timezone: "Asia/Tokyo",
  }),
});
