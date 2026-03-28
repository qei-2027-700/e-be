"use client";

import { Send, ExternalLink, AlertCircle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

type Output =
  | { ok: true; eventId: string; message: string }
  | { error: string };
type Props = { output: Output };

export function SubmitEventResult({ output }: Props) {
  const t = useTranslations("aiChat.tool.submitEvent");
  const locale = useLocale();

  if ("error" in output) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>{t("error", { error: output.error })}</span>
      </div>
    );
  }
  return (
    <div className="w-full rounded-2xl rounded-tl-sm border border-violet-500/20 bg-violet-500/5 px-3 py-2.5 text-sm">
      <div className="mb-2 flex items-center gap-1.5 font-medium text-violet-700 dark:text-violet-400">
        <Send className="size-3.5" />
        <span>{t("success")}</span>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{t("pending")}</p>
      <a
        href={`/${locale}/dashboard/event/${output.eventId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <ExternalLink className="size-3" />
        {t("openDetail")}
      </a>
    </div>
  );
}
