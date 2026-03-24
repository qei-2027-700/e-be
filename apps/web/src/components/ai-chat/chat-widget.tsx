"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  CheckSquare,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToolWritePlanOutput = {
  title: string;
  todos: string[];
  createdAt: string;
};

type ToolGetCurrentDateTimeOutput = {
  datetime: string;
  timezone: string;
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat();
  const isLoading = status === "streaming" || status === "submitted";

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
                <p className="text-sm font-medium leading-none">e-be AI</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isLoading ? "考え中..." : "オンライン"}
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

                    // writePlan ツール（DeepAgents の write_todos 相当）
                    if (
                      part.type === "tool-writePlan" &&
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (part as any).state === "output-available"
                    ) {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const output = (part as any).output as ToolWritePlanOutput;
                      return (
                        <div
                          key={i}
                          className="w-full rounded-2xl rounded-tl-sm border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm"
                        >
                          <div className="mb-2 flex items-center gap-1.5 font-medium text-primary">
                            <CheckSquare className="size-3.5" />
                            <span>{output.title}</span>
                          </div>
                          <ol className="list-none space-y-1">
                            {output.todos.map((todo, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-1.5 text-xs text-muted-foreground"
                              >
                                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30 text-[10px]">
                                  {j + 1}
                                </span>
                                {todo}
                              </li>
                            ))}
                          </ol>
                        </div>
                      );
                    }

                    // getCurrentDateTime ツール
                    if (
                      part.type === "tool-getCurrentDateTime" &&
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (part as any).state === "output-available"
                    ) {
                      const output =
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (part as any).output as ToolGetCurrentDateTimeOutput;
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 rounded-xl bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground"
                        >
                          <Clock className="size-3" />
                          <span>{output.datetime}</span>
                        </div>
                      );
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
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
              Gemini 1.5 Flash · 無料枠
            </p>
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
