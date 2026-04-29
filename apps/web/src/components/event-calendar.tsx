"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEventData } from "@/lib/events";

type Props = {
  events: CalendarEventData[];
  /** 初期表示年（省略時: 現在年） */
  initialYear?: number;
  /** 初期表示月 0〜11（省略時: 現在月） */
  initialMonth?: number;
  locale?: string;
};

const WEEKDAYS: Record<string, string[]> = {
  ja: ["日", "月", "火", "水", "木", "金", "土"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function EventCalendar({
  events,
  initialYear,
  initialMonth,
  locale = "ja",
}: Props) {
  const today = new Date();
  const [year, setYear] = useState(initialYear ?? today.getFullYear());
  const [month, setMonth] = useState(initialMonth ?? today.getMonth());

  const weekdays = WEEKDAYS[locale] ?? WEEKDAYS.ja;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);
  const todayKey = toDateKey(today);

  // イベントを日付 (YYYY-MM-DD) でグループ化
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventData[]>();
    for (const event of events) {
      if (!event.startAt) continue;
      const key = toDateKey(new Date(event.startAt));
      const existing = map.get(key);
      if (existing) {
        existing.push(event);
      } else {
        map.set(key, [event]);
      }
    }
    return map;
  }, [events]);

  const goToPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString(
    locale === "ja" ? "ja-JP" : "en-US",
    { year: "numeric", month: "long" }
  );

  // 先頭の空セル（月曜始まりでなく日曜始まり）＋日付セル
  const emptyCells = Array.from({ length: firstDayOfWeek });
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="w-full select-none">
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPrev}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={locale === "ja" ? "前の月" : "Previous month"}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <button
          onClick={goToNext}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={locale === "ja" ? "次の月" : "Next month"}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((day, i) => (
          <div
            key={day}
            className={cn(
              "py-1 text-center text-[11px] font-medium",
              i === 0 && "text-red-500",
              i === 6 && "text-blue-500",
              i > 0 && i < 6 && "text-muted-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-border">
        {/* 先頭の空白セル */}
        {emptyCells.map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="min-h-14 bg-background p-1 md:min-h-20"
          />
        ))}

        {/* 日付セル */}
        {dayCells.map((day) => {
          const dayOfWeek = (firstDayOfWeek + day - 1) % 7;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventsByDate.get(dateKey) ?? [];
          const isToday = dateKey === todayKey;

          return (
            <div
              key={day}
              className="flex min-h-14 flex-col gap-0.5 bg-background p-1 md:min-h-20"
            >
              {/* 日付番号 */}
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  isToday && "bg-primary text-primary-foreground",
                  !isToday && dayOfWeek === 0 && "text-red-500",
                  !isToday && dayOfWeek === 6 && "text-blue-500",
                  !isToday && dayOfWeek > 0 && dayOfWeek < 6 && "text-foreground"
                )}
              >
                {day}
              </span>

              {/* イベントチップ（最大2件表示） */}
              {dayEvents.slice(0, 2).map((event) => {
                const isPending = event.status === "pending";
                const isExternal = event.source === "external";
                return (
                  <div
                    key={event.id}
                    title={event.title ?? ""}
                    className={cn(
                      "truncate rounded px-1 py-px text-[10px] leading-tight",
                      isExternal
                        ? "bg-green-500/15 text-green-700 dark:text-green-400"
                        : isPending
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-primary/15 text-primary"
                    )}
                  >
                    {isExternal && "🌐 "}
                    {!isExternal && isPending && "⏳ "}
                    {event.title ?? (locale === "ja" ? "イベント" : "Event")}
                  </div>
                );
              })}

              {/* 3件以上の場合 */}
              {dayEvents.length > 2 && (
                <span className="px-1 text-[10px] text-muted-foreground">
                  +{dayEvents.length - 2}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
