import { getLocale, getTranslations } from "next-intl/server";
import { getUser, getUserOrgs, getUserType } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { db } from "@/lib/db";
import { operatorApplications } from "@e-be/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { EventCalendar } from "@/components/event-calendar";
import { getEventsForCalendar, getOrganizerHistory, getParticipationHistory, getUpcomingParticipations } from "@/lib/events";

const USER_TYPE_VARIANT = {
  user: "secondary",
  venue_user: "default",
  system_user: "destructive",
} as const;

export default async function DashboardPage() {
  const locale = await getLocale();
  const t = await getTranslations("dashboard");

  const user = await getUser();
  // layout.tsx で認証チェック済みだが、型ガードのため残す
  if (!user) return null;

  const now = new Date();
  const calendarFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const calendarTo = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  const [userOrgs, userType, calendarEvents] = await Promise.all([
    getUserOrgs(user.id),
    getUserType(user.id),
    getEventsForCalendar({ from: calendarFrom, to: calendarTo }),
  ]);

  // userType === 'user' のみ必要なデータを並行取得
  let hasPendingApplication = false;
  let organizerHistory: Awaited<ReturnType<typeof getOrganizerHistory>> = [];
  let participationHistory: Awaited<ReturnType<typeof getParticipationHistory>> = [];
  let upcomingParticipations: Awaited<ReturnType<typeof getUpcomingParticipations>> = [];
  if (userType === "user") {
    const [pendingResult, historyResult, participationResult, upcomingResult] = await Promise.all([
      db
        .select({ id: operatorApplications.id })
        .from(operatorApplications)
        .where(
          and(
            eq(operatorApplications.userId, user.id),
            eq(operatorApplications.status, "pending"),
            isNull(operatorApplications.deletedAt)
          )
        )
        .limit(1),
      getOrganizerHistory(user.id),
      getParticipationHistory(user.id),
      getUpcomingParticipations(user.id),
    ]);
    hasPendingApplication = pendingResult.length > 0;
    organizerHistory = historyResult;
    participationHistory = participationResult;
    upcomingParticipations = upcomingResult;
  }

  const userTypeKey = `user_type_${userType}` as const;

  return (
    <main className="p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <Badge variant={USER_TYPE_VARIANT[userType]}>
            {t(userTypeKey)}
          </Badge>
        </div>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>{t("calendar_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <EventCalendar
              events={calendarEvents}
              initialYear={now.getFullYear()}
              initialMonth={now.getMonth()}
              locale={locale}
            />
          </CardContent>
        </Card>

        {userType === "user" && (
          <div className="flex justify-end">
            <Link
              href={`/${locale}/dashboard/event/create`}
              className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-[0.8rem] font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              {t("create_event")}
            </Link>
          </div>
        )}

        {userType === "user" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("upcoming_participations_title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingParticipations.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("upcoming_participations_empty")}
                </p>
              ) : (
                <ul className="divide-y">
                  {upcomingParticipations.map((item) => (
                    <li key={item.participationId}>
                      <Link
                        href={`/${locale}/dashboard/event/${item.eventId}`}
                        className="flex items-center justify-between gap-3 py-3 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.title ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.startAt
                              ? new Date(item.startAt).toLocaleDateString(locale, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {t("participation_status_registered")}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {userType === "user" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("organizer_history_title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {organizerHistory.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("organizer_history_empty")}
                </p>
              ) : (
                <ul className="divide-y">
                  {organizerHistory.map((event) => {
                    const statusKey =
                      event.status === "cancelled"
                        ? "event_status_cancelled"
                        : event.status === "rejected"
                          ? "event_status_rejected"
                          : "event_status_published_ended";
                    return (
                      <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {event.title ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {event.startAt
                              ? new Date(event.startAt).toLocaleDateString(locale, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            event.status === "cancelled" || event.status === "rejected"
                              ? "secondary"
                              : "outline"
                          }
                          className="shrink-0"
                        >
                          {t(statusKey)}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {userType === "user" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("participation_history_title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {participationHistory.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("participation_history_empty")}
                </p>
              ) : (
                <ul className="divide-y">
                  {participationHistory.map((item) => {
                    const statusKey =
                      item.participationStatus === "cancelled"
                        ? "participation_status_cancelled"
                        : "participation_status_registered";
                    return (
                      <li key={item.participationId}>
                        <Link
                          href={`/${locale}/dashboard/event/${item.eventId}`}
                          className="flex items-center justify-between gap-3 py-3 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {item.title ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.startAt
                                ? new Date(item.startAt).toLocaleDateString(locale, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "—"}
                            </p>
                          </div>
                          <Badge
                            variant={item.participationStatus === "cancelled" ? "secondary" : "outline"}
                            className="shrink-0"
                          >
                            {t(statusKey)}
                          </Badge>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("orgs_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {userOrgs.length === 0 ? (
              <div className="space-y-4 text-center py-4">
                <p className="text-sm text-muted-foreground">{t("no_orgs")}</p>
                {userType === "user" && (
                  hasPendingApplication ? (
                    <Badge variant="secondary" className="text-sm px-4 py-2">
                      {t("application_pending")}
                    </Badge>
                  ) : (
                    <Link
                      href={`/${locale}/dashboard/apply`}
                      className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-4 text-[0.8rem] font-medium transition-all hover:bg-muted"
                    >
                      {t("apply_operator")}
                    </Link>
                  )
                )}
              </div>
            ) : (
              <ul className="divide-y">
                {userOrgs.map(({ org, role }) => (
                  <li key={org.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{org.name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{org.slug}</p>
                      </div>
                      <Badge variant={role === "owner" ? "default" : "secondary"}>
                        {role === "owner" ? t("role_owner") : t("role_member")}
                      </Badge>
                    </div>
                    <Link
                      href={`/${locale}/dashboard/org/${org.id}`}
                      className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-all hover:bg-muted"
                    >
                      {t("go_to_org")}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
