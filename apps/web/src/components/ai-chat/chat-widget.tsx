"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toolResultRegistry } from "./tool-results";
import { renderTextWithLinks } from "./render-text";
import { useTranslations } from "next-intl";
import { useChatPageContext } from "@/contexts/chat-page-context";
import { toast } from "sonner";
import { MessageResponse } from "@/components/ai-elements/message";

type ChatApiResponse = {
  tokens: number;
  tokenLimit: number;
  messages: UIMessage[];
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [usage, setUsage] = useState<{ tokens: number; tokenLimit: number } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const t = useTranslations("aiChat");
  const { pageContext } = useChatPageContext();
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: pageContext ?? {},
    }),
  });
  const isLoading = status === "streaming" || status === "submitted";

  const isLimitReached = usage !== null && usage.tokens >= usage.tokenLimit;

  // ウィジェットを開いたときに使用状況と履歴を取得
  useEffect(() => {
    if (!isOpen) return;
    setHistoryLoading(true);
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data: ChatApiResponse) => {
        setUsage({ tokens: data.tokens, tokenLimit: data.tokenLimit });
        if (data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch chat history:", error);
        toast.error(t("fetchError"));
      })
      .finally(() => setHistoryLoading(false));
  // setMessages は安定参照なので依存に含めない
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading || isLimitReached) return;
    sendMessage({ text: input });
    setInput("");
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
            "w-[340px] sm:w-[440px]",
            "flex flex-col overflow-hidden",
            "rounded-2xl border border-white/20",
            "bg-white/80 backdrop-blur-xl dark:bg-zinc-900/80",
            "shadow-2xl shadow-black/10",
            "animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
          )}
          style={{ height: "580px" }}
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
                  {isLoading ? t("thinking") : t("beta")}
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
            {historyLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className={cn(
                      "flex gap-2",
                      n % 2 === 0 ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className="mt-1 size-6 shrink-0 rounded-full bg-muted/50 animate-pulse" />
                    <div
                      className={cn(
                        "h-8 rounded-2xl bg-muted/40 animate-pulse",
                        n % 2 === 0 ? "w-2/5" : "w-3/5"
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
            {!historyLoading && messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Bot className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t("assistantName")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("welcomeMessage").split("\n").map((line, i) => (
                      <span key={i}>{i > 0 && <br />}{line}</span>
                    ))}
                  </p>
                </div>
                {usage && (
                  <p className="text-[11px] text-muted-foreground/60">
                    {t("remainingTokens", {
                      remaining: Math.max(0, usage.tokenLimit - usage.tokens).toLocaleString(),
                      limit: usage.tokenLimit.toLocaleString(),
                    })}
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
                      const copyKey = `${message.id}-${i}`;
                      const isCopied = copiedId === copyKey;
                      return (
                        <div key={i} className="group relative">
                          <div
                            className={cn(
                              "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                              message.role === "user"
                                ? "rounded-tr-sm bg-primary text-primary-foreground"
                                : "rounded-tl-sm bg-muted/60 dark:bg-white/10"
                            )}
                          >
                            {message.role === "user" ? (
                              <p className="whitespace-pre-wrap">
                                {renderTextWithLinks(part.text)}
                              </p>
                            ) : (
                              <MessageResponse>{part.text}</MessageResponse>
                            )}
                          </div>
                          {message.role === "assistant" && (
                            <button
                              onClick={() => handleCopy(part.text, copyKey)}
                              className={cn(
                                "absolute -bottom-1 -right-1",
                                "flex size-6 items-center justify-center rounded-full",
                                "border border-white/20 bg-white/80 shadow-sm backdrop-blur-sm dark:bg-zinc-800/80",
                                "text-muted-foreground transition-all duration-150",
                                "opacity-0 group-hover:opacity-100",
                                isCopied && "opacity-100 text-green-600 dark:text-green-400"
                              )}
                              aria-label={t("copy")}
                            >
                              {isCopied ? (
                                <Check className="size-3" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          )}
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
                <span>{t("limitReached", { limit: usage.tokenLimit.toLocaleString() })}</span>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("inputPlaceholder")}
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
                {t("footer")}
              </p>
              {usage && (
                <p className={cn(
                  "text-[10px]",
                  isLimitReached ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/50"
                )}>
                  {t("remainingTokens", {
                    remaining: Math.max(0, usage.tokenLimit - usage.tokens).toLocaleString(),
                    limit: usage.tokenLimit.toLocaleString(),
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* トグルボタン（液体ガラス風） */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? t("close") : t("open")}
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
