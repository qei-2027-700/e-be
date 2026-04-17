"use client";

import { AlertCircle, Building, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useChatSend } from "@/contexts/chat-send-context";
import { cn } from "@/lib/utils";

type Output =
  | { bars: Array<{ id: string; name: string }> }
  | { error: string; bars: [] };

type Props = { output: Output };

export function ListBarsResult({ output }: Props) {
  const t = useTranslations("aiChat.tool.listBars");
  const { sendMessage, isLoading } = useChatSend();

  if ("error" in output) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        <span>{t("error", { error: output.error })}</span>
      </div>
    );
  }

  if (!output.bars || output.bars.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
        <AlertCircle className="size-4 shrink-0" />
        <span>{t("noBars")}</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
        <Building className="size-3.5" />
        <span>{t("title")}</span>
      </div>
      <div className="space-y-1.5">
        {output.bars.map((bar) => (
          <button
            key={bar.id}
            onClick={() => sendMessage({ text: `「${bar.name}」（ID: ${bar.id}）を使います` })}
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
            <span className="flex items-center gap-2">
              <Building className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-medium">{bar.name}</span>
            </span>
            <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/60 px-1 mt-2">
        {t("selectBar")}
      </p>
    </div>
  );
}
