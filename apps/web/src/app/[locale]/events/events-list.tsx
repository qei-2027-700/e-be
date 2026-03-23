"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import type { PublicEventItem } from "@/lib/events";
import { fetchPublicEventsAction } from "./actions";

const PAGE_SIZE = 12;

type Props = {
  initialEvents: PublicEventItem[];
  initialHasNext: boolean;
  area?: string;
  line?: string;
};

export function EventsList({ initialEvents, initialHasNext, area, line }: Props) {
  const t = useTranslations("events");
  const locale = useLocale();
  const [items, setItems] = useState<PublicEventItem[]>(initialEvents);
  const [hasMore, setHasMore] = useState(initialHasNext);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(initialEvents.length);

  // フィルタが変更されたらリセット（サーバーサイドでページが再レンダリングされるが、
  // クライアントサイドの状態も同期させる必要がある）
  useEffect(() => {
    setItems(initialEvents);
    setHasMore(initialHasNext);
    setOffset(initialEvents.length);
  }, [initialEvents, initialHasNext]);

  async function handleLoadMore() {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextItems = await fetchPublicEventsAction({
        area,
        line,
        limit: PAGE_SIZE + 1,
        offset,
      });

      const moreItems = nextItems.slice(0, PAGE_SIZE);
      const nextHasMore = nextItems.length > PAGE_SIZE;

      setItems((prev) => [...prev, ...moreItems]);
      setHasMore(nextHasMore);
      setOffset((prev) => prev + moreItems.length);
    } catch (error) {
      console.error("Failed to load more events:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((event) => {
          const startDate = event.startAt
            ? new Date(event.startAt).toLocaleDateString(locale, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—";

          const chargeLabel =
            event.chargeAmount == null || event.chargeAmount === 0
              ? t("charge_free")
              : `¥${event.chargeAmount.toLocaleString()}`;

          const isFull =
            event.maxParticipants != null &&
            event.participantCount >= event.maxParticipants;

          const seatsLabel =
            event.maxParticipants == null
              ? null
              : isFull
                ? t("seats_full")
                : t("seats_remaining", { count: event.maxParticipants - event.participantCount });

          return (
            <div
              key={event.id}
              className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted/50"
            >
              {/* サムネイル */}
              <Link href={`/${locale}/events/${event.id}`} className="relative aspect-video w-full overflow-hidden bg-muted block">
                {event.thumbnailUrl ? (
                  <Image
                    src={event.thumbnailUrl}
                    alt={event.title ?? ""}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-10 w-10 text-muted-foreground/30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3h10.5A3.75 3.75 0 0 1 21 6.75v10.5A3.75 3.75 0 0 1 17.25 21H6.75A3.75 3.75 0 0 1 3 17.25V6.75A3.75 3.75 0 0 1 6.75 3Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m3 16.5 4.5-4.5 3 3 3-3 4.5 4.5"
                      />
                      <circle cx="8.25" cy="8.25" r="1.5" />
                    </svg>
                  </div>
                )}
              </Link>

              {/* カード本文 */}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <Link
                  href={`/${locale}/events/${event.id}`}
                  className="line-clamp-2 font-medium leading-snug hover:underline"
                >
                  {event.title ?? "—"}
                </Link>

                <div className="space-y-0.5 text-xs text-muted-foreground">
                  {event.orgSlug ? (
                    <Link
                      href={`/${locale}/stores/${event.orgSlug}`}
                      className="truncate block hover:underline hover:text-foreground"
                    >
                      {event.orgName}
                    </Link>
                  ) : (
                    <p className="truncate">{event.orgName}</p>
                  )}
                  {event.nearestStation && (
                    <p className="truncate">{event.nearestStation}</p>
                  )}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs">
                  <span className="text-muted-foreground">{startDate}</span>
                  <span className="font-medium">{chargeLabel}</span>
                  {seatsLabel && (
                    <span className={isFull ? "text-destructive" : "text-muted-foreground"}>
                      {seatsLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full max-w-xs"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t("filter_searching")}
              </span>
            ) : (
              t("load_more")
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
