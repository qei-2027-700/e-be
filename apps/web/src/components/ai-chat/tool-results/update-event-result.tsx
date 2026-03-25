"use client";

import { Pencil, ExternalLink, AlertCircle } from "lucide-react";

type Output =
  | { ok: true; eventId: string; title: string; status: string }
  | { error: string };
type Props = { output: Output };

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "ログインが必要です",
  forbidden: "このイベントを修正する権限がありません",
  not_found: "イベントが見つかりません",
  not_draft: "下書き以外のイベントは修正できません",
  invalid_title: "タイトルが無効です（最大100文字）",
  invalid_description: "説明が無効です（最大2000文字）",
  invalid_start_at: "開始日時の形式が無効です",
  invalid_end_at: "終了日時の形式が無効です",
  invalid_date_range: "終了日時は開始日時より後に設定してください",
};

export function UpdateEventResult({ output }: Props) {
  if ("error" in output) {
    const msg = ERROR_MESSAGES[output.error] ?? output.error;
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>修正に失敗しました（{msg}）</span>
      </div>
    );
  }
  return (
    <div className="w-full rounded-2xl rounded-tl-sm border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-sm">
      <div className="mb-2 flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-400">
        <Pencil className="size-3.5" />
        <span>下書きを修正しました</span>
      </div>
      <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
        {output.title}
      </p>
      <a
        href={`/ja/dashboard/event/${output.eventId}/edit`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <ExternalLink className="size-3" />
        イベント編集画面を開く
      </a>
    </div>
  );
}
