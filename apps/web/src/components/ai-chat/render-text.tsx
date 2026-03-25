import type { ReactNode } from "react";

// Markdown リンク [text](url) と 生URL を <a> タグに変換する
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)|(https?:\/\/[^\s]+)/g;

export function renderTextWithLinks(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = LINK_RE.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }

    if (match[1] && match[2]) {
      // Markdown リンク [text](url)
      nodes.push(
        <a
          key={match.index}
          href={match[2]}
          target={match[2].startsWith("http") ? "_blank" : undefined}
          rel={match[2].startsWith("http") ? "noopener noreferrer" : undefined}
          className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
        >
          {match[1]}
        </a>
      );
    } else if (match[3]) {
      // 生URL
      nodes.push(
        <a
          key={match.index}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
        >
          {match[3]}
        </a>
      );
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes;
}
