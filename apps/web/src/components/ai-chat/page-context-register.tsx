"use client";

import { useEffect } from "react";
import {
  useChatPageContext,
  type ChatPageContext,
} from "@/contexts/chat-page-context";

/**
 * ページが AI チャットにコンテキストを渡すためのコンポーネント。
 * Server Component のページから props として eventId / orgId を受け取り、
 * ChatWidget が読める context に登録する。アンマウント時に自動クリア。
 *
 * 使い方:
 *   <PageContextRegister eventId={eventId} pageName="イベント編集" />
 */
export function PageContextRegister(props: ChatPageContext) {
  const { setPageContext } = useChatPageContext();

  useEffect(() => {
    setPageContext(props);
    return () => setPageContext(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.eventId, props.orgId, props.pageName]);

  return null;
}
