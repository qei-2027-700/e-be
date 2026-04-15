"use client";

import { cn } from "@/lib/utils";
import { useChatSend } from "@/contexts/chat-send-context";

type Output = { replies: string[] };
type Props = { output: Output };

export function SuggestRepliesResult({ output }: Props) {
  const { sendMessage, isLoading } = useChatSend();

  return (
    <div className="flex flex-wrap gap-1.5 py-0.5">
      {output.replies.map((reply) => (
        <button
          key={reply}
          onClick={() => sendMessage({ text: reply })}
          disabled={isLoading}
          className={cn(
            "rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-foreground/80",
            "transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
            "disabled:cursor-not-allowed disabled:opacity-40",
            "cursor-pointer"
          )}
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
