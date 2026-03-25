"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toolResultRegistry } from "./tool-results";

type UsageInfo = {
  used: number;
  limit: number;
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat();
  const isLoading = status === "streaming" || status === "submitted";

  const isLimitReached = usage !== null && usage.used >= usage.limit;

  // ウィジェットを開いたときに使用状況を取得
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data: UsageInfo) => setUsage(data))
      .catch(() => {});
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading || isLimitReached) return;
    sendMessage({ text: input });
    setInput("");
    // 送信後にローカルカウンターを楽観的に更新
    setUsage((prev) => (prev ? { ...prev, used: prev.used + 1 } : prev));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            "absolute bottom-16 right-0",
            "w-80 sm:w-96",
            "flex flex-col overflow-hidden",
            "rounded-2xl border border-white/20",
            "bg-white/80 backdrop-blur-xl dark:bg-zinc-900/80",
            "shadow-2xl shadow-black/10",
            "animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
          )}
          style={{ height: "480px" }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/20 bg-white/10 px-4 py-3 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
                <Bot className="size-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium leading-none">e-be AI</p>
                  <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium leading-none text-amber-600 dark:text-amber-400">
                    β
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isLoading ? "考え中..." : "試験運用中"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsOpen(false)}
              className="transition-transform hover:scale-110"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Bot className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">e-be AIアシスタント</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    イベント企画・集客・運営について
                    <br />
                    なんでも聞いてください
                  </p>
                </div>
                {usage && (
                  <p className="text-[11px] text-muted-foreground/60">
                    本日の残り利用回数: {Math.max(0, usage.limit - usage.used)}/{usage.limit} 回
                  </p>
                )}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "mt-1 flex size-6 shrink-0 items-center justify-center rounded-full",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="size-3" />
                  ) : (
                    <Bot className="size-3" />
                  )}
                </div>

                <div
                  className={cn(
                    "flex max-w-[75%] flex-col gap-1.5",
                    message.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  {message.parts?.map((part, i) => {
                    // テキストパート
                    if (part.type === "text") {
                      return (
                        <div
                          key={i}
                          className={cn(
                            "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                            message.role === "user"
                              ? "rounded-tr-sm bg-primary text-primary-foreground"
                              : "rounded-tl-sm bg-muted/60 dark:bg-white/10"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{part.text}</p>
                        </div>
                      );
                    }

                    // ツール結果パート
                    if (part.type.startsWith("tool-")) {
                      const ToolResult = toolResultRegistry[part.type];
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      if (ToolResult && (part as any).state === "output-available") {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        return <ToolResult key={i} output={(part as any).output} />;
                      }
                      return null;
                    }

                    return null;
                  })}
                </div>
              </div>
            ))}

            {/* ローディングインジケーター */}
            {isLoading && (
              <div className="flex gap-2">
                <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="size-3" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-3 py-2 dark:bg-white/10">
                  <div className="flex h-4 items-center gap-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-white/20 bg-white/5 p-3">
            {isLimitReached ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>本日の利用上限（{usage.limit}回）に達しました。明日またご利用ください。</span>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="メッセージを入力... (Enter で送信)"
                  rows={1}
                  disabled={isLoading}
                  className={cn(
                    "max-h-24 flex-1 resize-none overflow-y-auto",
                    "rounded-xl border border-white/20 bg-white/10 dark:bg-white/5",
                    "px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground",
                    "transition-all focus:outline-none focus:ring-2 focus:ring-ring/30",
                    "disabled:opacity-50"
                  )}
                />
                <Button
                  size="icon-sm"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="shrink-0 rounded-xl transition-transform hover:scale-105"
                >
                  <Send className="size-3.5" />
                </Button>
              </div>
            )}
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground/50">
                試験的機能 · Gemini 2.5 Flash
              </p>
              {usage && !isLimitReached && (
                <p className="text-[10px] text-muted-foreground/50">
                  本日 {usage.used}/{usage.limit} 回
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* トグルボタン（液体ガラス風） */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "チャットを閉じる" : "AIチャットを開く"}
        className={cn(
          "flex size-12 items-center justify-center rounded-2xl",
          "shadow-lg backdrop-blur-xl",
          "transition-all duration-300 ease-out",
          "hover:scale-110 hover:shadow-xl active:scale-95",
          isOpen
            ? "bg-muted text-muted-foreground shadow-md shadow-black/10"
            : "bg-primary text-primary-foreground shadow-primary/30 hover:shadow-primary/40"
        )}
      >
        {isOpen ? (
          <X className="size-5 transition-transform duration-200" />
        ) : (
          <MessageSquare className="size-5 transition-transform duration-200" />
        )}
      </button>
    </div>
  );
}
