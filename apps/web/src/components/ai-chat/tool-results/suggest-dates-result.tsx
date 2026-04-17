"use client";

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { useChatSend } from "@/contexts/chat-send-context";
import { cn } from "@/lib/utils";

type Output = { dates: Array<{ label: string; isoDate: string }> };
type Props = { output: Output };

export function SuggestDatesResult({ output }: Props) {
  const t = useTranslations("aiChat.tool.suggestDates");
  const { sendMessage, isLoading } = useChatSend();

  if (!output.dates || output.dates.length === 0) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
        {t("noDates")}
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
        <CalendarDays className="size-3.5" />
        <span>{t("title")}</span>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1.5">
          {output.dates.map(({ label, isoDate }) => (
            <button
              key={isoDate}
              onClick={() => sendMessage({ text: `${label} に開催したいです` })}
              disabled={isLoading}
              className={cn(
                "shrink-0 rounded-full border border-border/60 bg-background/60",
                "px-3 py-1.5 text-xs text-foreground/80",
                "transition-all duration-200 cursor-pointer",
                "hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:scale-105",
                "active:scale-95",
                "disabled:cursor-not-allowed disabled:opacity-40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/60 px-1">
        {t("hint")}
      </p>
    </div>
  );
}
