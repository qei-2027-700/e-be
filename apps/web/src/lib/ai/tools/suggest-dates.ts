import { tool } from "ai";
import { z } from "zod";

export const suggestDatesTool = tool({
  description:
    "今後の週末（土曜・日曜）の日程候補を取得する。イベント日時が未確定のときに呼び出し、ユーザーに候補を提示する。",
  inputSchema: z.object({
    weeks: z
      .number()
      .optional()
      .default(4)
      .describe("何週間分の候補を返すか（デフォルト4週）"),
  }),
  execute: async ({ weeks }) => {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
    );
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dates: Array<{ label: string; isoDate: string }> = [];
    const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

    for (let i = 0; i <= weeks * 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dow = d.getDay();
      if (dow === 0 || dow === 6) {
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const label = `${month}/${day}（${dayLabels[dow]}）`;
        const isoDate = `${d.getFullYear()}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        dates.push({ label, isoDate });
      }
    }

    return { dates };
  },
});
