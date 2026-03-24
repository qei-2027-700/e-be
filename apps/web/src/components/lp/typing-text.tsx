"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingTextProps {
  text: string;
  className?: string;
  startDelayMs?: number;
  charIntervalMs?: number;
  showCursor?: boolean;
  cursorClassName?: string;
  respectReducedMotion?: boolean;
}

export function TypingText({
  text,
  className,
  startDelayMs = 0,
  charIntervalMs = 28,
  showCursor = true,
  cursorClassName,
  respectReducedMotion = true,
}: TypingTextProps) {
  const [rendered, setRendered] = useState("");
  const isDone = rendered.length >= text.length;
  const latestTextRef = useRef(text);

  useEffect(() => {
    latestTextRef.current = text;

    const mediaQuery =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    let cancelled = false;
    const resetTimer = setTimeout(() => {
      if (cancelled) return;
      setRendered("");
    }, 0);

    let tickTimer: ReturnType<typeof setTimeout> | null = null;
    let doneTimer: ReturnType<typeof setTimeout> | null = null;

    if (respectReducedMotion && mediaQuery?.matches) {
      doneTimer = setTimeout(() => {
        if (cancelled) return;
        setRendered(text);
      }, 0);

      return () => {
        cancelled = true;
        clearTimeout(resetTimer);
        if (doneTimer) clearTimeout(doneTimer);
      };
    }

    const startTimer = setTimeout(() => {
      let index = 0;
      const tick = () => {
        if (cancelled) return;

        const latestText = latestTextRef.current;
        index = Math.min(index + 1, latestText.length);
        setRendered(latestText.slice(0, index));

        if (index >= latestText.length) return;
        tickTimer = setTimeout(tick, charIntervalMs);
      };

      tick();
    }, startDelayMs);

    return () => {
      cancelled = true;
      clearTimeout(resetTimer);
      clearTimeout(startTimer);
      if (tickTimer) clearTimeout(tickTimer);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [text, startDelayMs, charIntervalMs, respectReducedMotion]);

  return (
    <span aria-hidden className={cn("inline-flex items-baseline", className)}>
      <span>{rendered}</span>
      {showCursor && !isDone ? (
        <span
          className={cn(
            "ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-current opacity-80 animate-pulse",
            cursorClassName
          )}
        />
      ) : null}
    </span>
  );
}
