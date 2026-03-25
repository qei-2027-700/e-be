"use client";

import { CalendarPlus, ExternalLink, AlertCircle } from "lucide-react";

type Output =
  | { ok: true; eventId: string; title: string; status: string }
  | { error: string };
type Props = { output: Output };

export function CreateEventResult({ output }: Props) {
  if ("error" in output) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>イベントの作成に失敗しました（{output.error}）</span>
      </div>
    );
  }
  return (
    <div className="w-full rounded-2xl rounded-tl-sm border border-green-500/20 bg-green-500/5 px-3 py-2.5 text-sm">
      <div className="mb-2 flex items-center gap-1.5 font-medium text-green-700 dark:text-green-400">
        <CalendarPlus className="size-3.5" />
        <span>下書きを作成しました</span>
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
