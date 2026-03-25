import { tool } from "ai";
import { z } from "zod";

export const writePlanTool = tool({
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
});
