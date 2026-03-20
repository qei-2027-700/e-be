import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser } from "@/lib/auth";
import { getEventDetail } from "@/lib/events";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Props = {
  params: Promise<{ eventId: string }>;
};

export default async function EventDetailPage({ params }: Props) {
  const { eventId } = await params;
  const locale = await getLocale();
  const t = await getTranslations("event_detail");

  const user = await getUser();
  if (!user) notFound();

  const event = await getEventDetail(eventId, user.id);
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

  const startDate = formatDate(event.startAt);
  const startTime = formatTime(event.startAt);
  const endDate = formatDate(event.endAt);
  const endTime = formatTime(event.endAt);
  const isSameDay = startDate && endDate && startDate === endDate;

  return (
    <main className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-5">

        {/* 戻るリンク */}
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden>←</span>
          {t("back")}
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

        {/* 参加ステータスカード */}
        {event.myParticipationStatus && (
          <Card
            className={
              isRegistered
                ? "border-green-500/40 bg-green-500/5"
                : "border-border"
            }
          >
            <CardContent className="pt-4 pb-4">
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
            </CardContent>
          </Card>
        )}

      </div>
    </main>
  );
}
