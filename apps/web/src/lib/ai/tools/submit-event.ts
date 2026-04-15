import { tool } from "ai";
import { z } from "zod";
import { submitEvent } from "@/lib/actions/event";
import type { getDbUser } from "@/lib/auth";

type DbUser = Awaited<ReturnType<typeof getDbUser>>;

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "ログインが必要です",
  not_found: "イベントが見つかりません",
  forbidden: "下書き状態のイベントのみ申請できます",
  venue_required: "会場（バー）が設定されていません",
  past_date: "開始日時が過去の日時になっています",
  invalid_range: "終了日時が開始日時より前になっています",
  conflict: "指定の日時に会場の予約が重複しています",
};

export const createSubmitEventTool = (dbUser: DbUser) =>
  tool({
    description:
      "イベントをバーへ申請する（ステータスを draft → pending に変更）。" +
      "実行前に必ずイベント内容（会場・日時・料金）をユーザーに提示して確認を取ること。" +
      "「申請して」など明示的な許可を得た上で呼び出すこと。",
    inputSchema: z.object({
      eventId: z.string().describe("申請するイベントの ID（listEvents で確認する）"),
    }),
    execute: async ({ eventId }) => {
      if (!dbUser) return { error: "ログインが必要です" };
      const result = await submitEvent(eventId);
      if ('error' in result) {
        return { error: ERROR_MESSAGES[result.error] ?? result.error };
      }
      return { ok: true, eventId, message: "申請が完了しました。バーからの承認をお待ちください。" };
    },
  });
