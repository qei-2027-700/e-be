"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type ChatPageContext = {
  /** 現在表示中のイベント ID（イベント編集ページなど） */
  eventId?: string;
  /** 現在表示中のバー/組織 ID（組織ダッシュボードなど） */
  orgId?: string;
  /** ページの表示名（AI への追加情報） */
  pageName?: string;
};

type ChatPageContextValue = {
  pageContext: ChatPageContext | null;
  setPageContext: (ctx: ChatPageContext | null) => void;
};

const ChatPageContextCtx = createContext<ChatPageContextValue>({
  pageContext: null,
  setPageContext: () => {},
});

export function ChatPageContextProvider({ children }: { children: ReactNode }) {
  const [pageContext, setPageContext] = useState<ChatPageContext | null>(null);
  return (
    <ChatPageContextCtx.Provider value={{ pageContext, setPageContext }}>
      {children}
    </ChatPageContextCtx.Provider>
  );
}

export function useChatPageContext() {
  return useContext(ChatPageContextCtx);
}
