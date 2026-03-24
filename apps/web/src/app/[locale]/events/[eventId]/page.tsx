import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser } from "@/lib/auth";
import { getEventDetail } from "@/lib/events";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { AppFooter } from "@/components/layout/app-footer";
import { ParticipationButton } from "@/app/[locale]/dashboard/event/[eventId]/participation-button";

type Props = {
  params: Promise<{ eventId: string }>;
};

export default async function PublicEventDetailPage({ params }: Props) {
  const [{ eventId }, locale, t, user] = await Promise.all([
    params,
    getLocale(),
    getTranslations("event_detail"),
    getUser(),
  ]);

  const event = await getEventDetail(eventId, user?.id);
  if (!event) notFound();

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
        })
      : null;

  const formatTime = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const isRegistered = event.myParticipationStatus === "registered";
  const isCancelled = event.myParticipationStatus === "cancelled";
  const isBeforeEvent = !!(event.startAt && new Date(event.startAt) > new Date());
  const isFull = event.maxParticipants !== null && event.participantCount >= event.maxParticipants;

  const startDate = formatDate(event.startAt);
  const startTime = formatTime(event.startAt);
  const endDate = formatDate(event.endAt);
  const endTime = formatTime(event.endAt);
  const isSameDay = startDate && endDate && startDate === endDate;

  const signInUrl = `/${locale}/auth/sign-in?next=/${locale}/events/${eventId}`;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <PublicHeader isLoggedIn={!!user} />
      <main className="flex-1 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl space-y-5">

          {/* 戻るリンク */}
          <Link
            href={`/${locale}/events`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span aria-hidden>←</span>
            {t("back_to_events")}
          </Link>

          {/* タイトル + ステータス */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold leading-tight">{event.title ?? "—"}</h1>
              {event.myParticipationStatus && (
                <Badge
                  variant={isCancelled ? "secondary" : "default"}
                  className="shrink-0 mt-1"
                >
                  {isCancelled ? t("status_cancelled") : t("status_registered")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{event.orgName}</p>
          </div>

          {/* 日時カード */}
          <Card>
            <CardContent className="pt-5 pb-5 space-y-4">
              <div className={isSameDay ? "space-y-3" : "grid grid-cols-2 gap-4"}>
                {/* 開始 */}
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("start_at")}
                  </p>
                  <p className="text-sm text-muted-foreground">{startDate ?? "—"}</p>
                  {startTime && (
                    <p className="text-3xl font-bold tabular-nums">{startTime}</p>
                  )}
                </div>

                {/* 終了 */}
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("end_at")}
                  </p>
                  {!isSameDay && (
                    <p className="text-sm text-muted-foreground">{endDate ?? "—"}</p>
                  )}
                  {endTime && (
                    <p className="text-3xl font-bold tabular-nums">{endTime}</p>
                  )}
                </div>
              </div>

              {/* 場所 */}
              {event.location && (
                <>
                  <div className="border-t border-border" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {t("location")}
                    </p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* イベント詳細・会場情報 */}
          <Card>
            <CardContent className="pt-5 pb-5 space-y-4">
              {/* 開催店舗 */}
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("venue")}
                </p>
                {event.orgSlug ? (
                  <Link
                    href={`/${locale}/stores/${event.orgSlug}`}
                    className="font-medium hover:underline"
                  >
                    {event.orgName}
                  </Link>
                ) : (
                  <p className="font-medium">{event.orgName}</p>
                )}
                {event.orgAddress && (
                  <p className="text-sm text-muted-foreground">{event.orgAddress}</p>
                )}
              </div>

              {/* チャージ料 */}
              {event.chargeAmount != null && (
                <>
                  <div className="border-t border-border" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {t("charge_amount")}
                    </p>
                    <p className="text-2xl font-bold tabular-nums">
                      ¥{event.chargeAmount.toLocaleString()}
                    </p>
                  </div>
                </>
              )}

              {/* イベント説明 */}
              {event.description && (
                <>
                  <div className="border-t border-border" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {t("description")}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
                  </div>
                </>
              )}

              {/* 主催者 X リンク */}
              {event.organizerXUrl && (
                <>
                  <div className="border-t border-border" />
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {t("organizer_x")}
                    </p>
                    <a
                      href={event.organizerXUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {event.organizerXUrl}
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 参加ボタンカード */}
          <Card
            className={
              isRegistered
                ? "border-green-500/40 bg-green-500/5"
                : "border-border"
            }
          >
            <CardContent className="pt-4 pb-4 space-y-3">
              {event.myParticipationStatus && (
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {t("my_status")}
                    </p>
                    <p className="font-semibold">
                      {isRegistered ? t("status_registered") : t("status_cancelled")}
                    </p>
                  </div>
                  <span
                    className={`text-2xl ${isRegistered ? "text-green-500" : "text-muted-foreground"}`}
                    aria-hidden
                  >
                    {isRegistered ? "✓" : "✕"}
                  </span>
                </div>
              )}
              {user ? (
                <ParticipationButton
                  eventId={event.id}
                  myStatus={event.myParticipationStatus}
                  isFull={isFull}
                  isBeforeEvent={isBeforeEvent}
                  joinLabel={t("join_button")}
                  cancelLabel={t("cancel_button")}
                  fullLabel={t("full_capacity")}
                  endedLabel={t("event_ended")}
                  joiningLabel={t("joining")}
                  cancellingLabel={t("cancelling")}
                />
              ) : (
                <Link
                  href={signInUrl}
                  className="inline-flex w-full sm:w-64 sm:mx-auto items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {t("sign_in_to_join")}
                </Link>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
      <AppFooter />
    </div>
  );
}
