import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { searchPublicEvents } from "@/lib/events";
import { EventsFilter } from "./events-filter";
import { AppFooter } from "@/components/layout/app-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { getUser } from "@/lib/auth";

const PAGE_SIZE = 20;

type SearchParams = Promise<{
  date?: string;
  prefecture?: string;
  line?: string;
  page?: string;
}>;

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ date, prefecture, line, page }, user] = await Promise.all([
    searchParams,
    getUser(),
  ]);
  const locale = await getLocale();
  const t = await getTranslations("events");

  const currentPage = Math.max(1, Number(page ?? 1));
  const offset = (currentPage - 1) * PAGE_SIZE;

  // 1件多く取得してページ送りの有無を判断する
  const items = await searchPublicEvents({
    date,
    prefecture,
    line,
    limit: PAGE_SIZE + 1,
    offset,
  });

  const hasNext = items.length > PAGE_SIZE;
  const events = hasNext ? items.slice(0, PAGE_SIZE) : items;

  function buildPageUrl(p: number) {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
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
            defaultDate={date}
            defaultPrefecture={prefecture}
            defaultLine={line}
          />

          {events.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
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

                const seatsLabel =
                  event.maxParticipants == null
                    ? null
                    : event.participantCount >= event.maxParticipants
                      ? t("seats_full")
                      : t("seats_remaining", { count: event.maxParticipants - event.participantCount });

                return (
                  <li key={event.id}>
                    <Link
                      href={`/${locale}/events/${event.id}`}
                      className="flex flex-col gap-1 px-4 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="truncate font-medium">{event.title ?? "—"}</p>
                        <p className="truncate text-sm text-muted-foreground">{event.orgName}</p>
                        {event.orgPrefecture && (
                          <p className="text-xs text-muted-foreground">{event.orgPrefecture}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-muted-foreground sm:flex-col sm:items-end sm:gap-0.5">
                        <span>{startDate}</span>
                        <span className="font-medium text-foreground">{chargeLabel}</span>
                        {seatsLabel && (
                          <span className={event.maxParticipants != null && event.participantCount >= event.maxParticipants ? "text-destructive" : ""}>
                            {seatsLabel}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
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
