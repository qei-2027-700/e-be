import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getUser } from "@/lib/auth";
import { getEventDetail } from "@/lib/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {t("back")}
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{event.title ?? "—"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-3">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="w-24 shrink-0 text-sm text-muted-foreground">{t("start_at")}</dt>
                <dd className="text-sm font-medium">{formatDate(event.startAt)}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="w-24 shrink-0 text-sm text-muted-foreground">{t("end_at")}</dt>
                <dd className="text-sm font-medium">{formatDate(event.endAt)}</dd>
              </div>
              {event.location && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                  <dt className="w-24 shrink-0 text-sm text-muted-foreground">{t("location")}</dt>
                  <dd className="text-sm font-medium">{event.location}</dd>
                </div>
              )}
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <dt className="w-24 shrink-0 text-sm text-muted-foreground">{t("organizer")}</dt>
                <dd className="text-sm font-medium">{event.orgName}</dd>
              </div>
              {event.myParticipationStatus && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                  <dt className="w-24 shrink-0 text-sm text-muted-foreground">{t("my_status")}</dt>
                  <dd>
                    <Badge
                      variant={
                        event.myParticipationStatus === "cancelled" ? "secondary" : "outline"
                      }
                    >
                      {event.myParticipationStatus === "cancelled"
                        ? t("status_cancelled")
                        : t("status_registered")}
                    </Badge>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
