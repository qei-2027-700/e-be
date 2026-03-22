import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { searchPublicEvents, getAvailableLines } from "@/lib/events";
import { EventsFilter } from "./events-filter";
import { AppFooter } from "@/components/layout/app-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { getUser } from "@/lib/auth";

const PAGE_SIZE = 20;

type SearchParams = Promise<{
  prefecture?: string;
  line?: string;
  page?: string;
}>;

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ prefecture, line, page }, user, availableLines] = await Promise.all([
    searchParams,
    getUser(),
    getAvailableLines(),
  ]);
  const locale = await getLocale();
  const t = await getTranslations("events");

  const currentPage = Math.max(1, Number(page ?? 1));
  const offset = (currentPage - 1) * PAGE_SIZE;

  // 1件多く取得してページ送りの有無を判断する
  const items = await searchPublicEvents({
    prefecture,
    line,
    limit: PAGE_SIZE + 1,
    offset,
  });

  const hasNext = items.length > PAGE_SIZE;
  const events = hasNext ? items.slice(0, PAGE_SIZE) : items;

  function buildPageUrl(p: number) {
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (line) params.set("line", line);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `?${qs}` : "?";
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <PublicHeader isLoggedIn={!!user} />
      <main className="flex-1 px-4 py-8 md:px-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <h1 className="text-2xl font-bold">{t("title")}</h1>

          <EventsFilter
            defaultPrefecture={prefecture}
            defaultLine={line}
            availableLines={availableLines}
          />

          {events.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
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
                  <Link
                    key={event.id}
                    href={`/${locale}/events/${event.id}`}
                    className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted/50"
                  >
                    {/* サムネイル */}
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
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
                    </div>

                    {/* カード本文 */}
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <p className="line-clamp-2 font-medium leading-snug">
                        {event.title ?? "—"}
                      </p>

                      {/* 店舗名・最寄り駅 */}
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        <p className="truncate">{event.orgName}</p>
                        {event.nearestStation && (
                          <p className="truncate">{event.nearestStation}</p>
                        )}
                      </div>

                      {/* 日時・料金・残席 */}
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
                  </Link>
                );
              })}
            </div>
          )}

          {(currentPage > 1 || hasNext) && (
            <div className="flex justify-between">
              {currentPage > 1 ? (
                <Link
                  href={buildPageUrl(currentPage - 1)}
                  className="inline-flex min-h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {t("page_prev")}
                </Link>
              ) : (
                <div />
              )}
              {hasNext && (
                <Link
                  href={buildPageUrl(currentPage + 1)}
                  className="inline-flex min-h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {t("page_next")}
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
