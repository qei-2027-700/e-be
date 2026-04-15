"use client";

import { createContext, useContext } from "react";

type ChatSendContextValue = {
  sendMessage: (options: { text: string }) => void;
  isLoading: boolean;
};

const ChatSendContext = createContext<ChatSendContextValue | null>(null);

export const ChatSendProvider = ChatSendContext.Provider;

export function useChatSend() {
  const ctx = useContext(ChatSendContext);
  if (!ctx) throw new Error("useChatSend must be used within ChatSendProvider");
  return ctx;
}
