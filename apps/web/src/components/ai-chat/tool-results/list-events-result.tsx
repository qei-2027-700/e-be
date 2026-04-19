"use client";

import { AlertCircle, Calendar, ChevronRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useChatSend } from "@/contexts/chat-send-context";
import { cn } from "@/lib/utils";

type Output =
  | { events: Array<{ id: string; title: string; status: string; startAt: string | null }> }
  | { error: string; events: [] };

type Props = { output: Output };

export function ListEventsResult({ output }: Props) {
  const t = useTranslations("aiChat.tool.listEvents");
  const locale = useLocale();
  const { sendMessage, isLoading } = useChatSend();

  if ("error" in output) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>{t("error", { error: output.error })}</span>
      </div>
    );
  }

  if (!output.events || output.events.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
        <AlertCircle className="size-4 shrink-0" />
        <span>{t("noEvents")}</span>
      </div>
    );
  }

  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return null;
    const date = new Date(isoDate);
    return date.toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
        <Calendar className="size-3.5" />
        <span>{t("title")}</span>
      </div>
      <div className="space-y-1.5">
        {output.events.map((event) => (
          <button
            key={event.id}
            onClick={() => sendMessage({ text: `「${event.title}」を選択します` })}
            disabled={isLoading}
            className={cn(
              "group w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5",
              "flex items-center justify-between gap-2",
              "text-sm text-foreground transition-all duration-200",
              "hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10",
              "hover:-translate-y-0.5 hover:shadow-md",
              "active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/20 disabled:hover:bg-white/10 disabled:hover:shadow-none"
            )}
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="font-medium">{event.title}</span>
              {event.startAt && (
                <span className="text-xs text-muted-foreground">{formatDate(event.startAt)}</span>
              )}
            </div>
            <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/60 px-1">
        {t("selectEvent")}
      </p>
    </div>
  );
}
