"use client";

import { createContext, useContext } from "react";
import type { UseChatHelpers } from "@ai-sdk/react";

type ChatSendContextValue = {
  sendMessage: UseChatHelpers["sendMessage"];
  isLoading: boolean;
};

const ChatSendContext = createContext<ChatSendContextValue | null>(null);

export const ChatSendProvider = ChatSendContext.Provider;

export function useChatSend() {
  const ctx = useContext(ChatSendContext);
  if (!ctx) throw new Error("useChatSend must be used within ChatSendProvider");
  return ctx;
}
