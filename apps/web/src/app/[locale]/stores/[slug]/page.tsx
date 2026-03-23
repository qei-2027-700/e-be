import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { getPublicStoreBySlug } from "@/lib/stores";
import { getUser } from "@/lib/auth";
import { PublicHeader } from "@/components/layout/public-header";
import { AppFooter } from "@/components/layout/app-footer";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PublicStoreDetailPage({ params }: Props) {
  const [{ slug }, locale, t, user] = await Promise.all([
    params,
    getLocale(),
    getTranslations("stores"),
    getUser(),
  ]);

  const store = await getPublicStoreBySlug(slug);
  if (!store) notFound();

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <PublicHeader isLoggedIn={!!user} />
      <main className="flex-1">
        {/* カバー画像 */}
        {store.coverImageUrl && (
          <div className="relative h-48 w-full overflow-hidden bg-muted md:h-64">
            <Image
              src={store.coverImageUrl}
              alt={store.name}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
          {/* 店舗ヘッダー */}
          <div className="flex items-center gap-4">
            {store.iconUrl && (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                <Image
                  src={store.iconUrl}
                  alt={store.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{store.name}</h1>
              <div className="space-y-0.5 text-sm text-muted-foreground">
                {store.nearestLine && <p>{store.nearestLine}</p>}
                {store.address && <p>{store.address}</p>}
              </div>
            </div>
          </div>

          {/* 説明 */}
          {store.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{store.description}</p>
          )}

          {/* イベント一覧 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">{t("events_title")}</h2>
            {store.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("no_events")}</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {store.events.map((event) => {
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
                      <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        {event.thumbnailUrl ? (
                          <Image
                            src={event.thumbnailUrl}
                            alt={event.title ?? ""}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, 50vw"
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
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3h10.5A3.75 3.75 0 0 1 21 6.75v10.5A3.75 3.75 0 0 1 17.25 21H6.75A3.75 3.75 0 0 1 3 17.25V6.75A3.75 3.75 0 0 1 6.75 3Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="m3 16.5 4.5-4.5 3 3 3-3 4.5 4.5" />
                              <circle cx="8.25" cy="8.25" r="1.5" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <p className="line-clamp-2 font-medium leading-snug">{event.title ?? "—"}</p>
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
          </section>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
