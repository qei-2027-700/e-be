"use client";

import { Pencil, ExternalLink, AlertCircle } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

type Output =
  | { ok: true; eventId: string; title: string; status: string }
  | { error: string };
type Props = { output: Output };

const KNOWN_ERROR_KEYS = [
  "unauthorized", "forbidden", "not_found", "not_draft",
  "invalid_title", "invalid_description", "invalid_start_at",
  "invalid_end_at", "invalid_date_range",
] as const;
type KnownErrorKey = typeof KNOWN_ERROR_KEYS[number];

export function UpdateEventResult({ output }: Props) {
  const t = useTranslations("aiChat.tool.updateEvent");
  const locale = useLocale();

  if ("error" in output) {
    const isKnown = (KNOWN_ERROR_KEYS as readonly string[]).includes(output.error);
    const msg = isKnown
      ? t(`errors.${output.error as KnownErrorKey}`)
      : output.error;
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>{t("error", { msg })}</span>
      </div>
    );
  }
  return (
    <div className="w-full rounded-2xl rounded-tl-sm border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-sm">
      <div className="mb-2 flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-400">
        <Pencil className="size-3.5" />
        <span>{t("success")}</span>
      </div>
      <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
        {output.title}
      </p>
      <a
        href={`/${locale}/dashboard/event/${output.eventId}/edit`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <ExternalLink className="size-3" />
        {t("openEdit")}
      </a>
    </div>
  );
}
