import { getLocale, getTranslations } from "next-intl/server";
import { getPendingApplication, getUser, getUserOrgs, getUserType } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { EventCalendar } from "@/components/event-calendar";
import { getEventsForCalendar, getMyDraftEvents, getOrganizerHistory, getParticipationHistory, getUpcomingParticipations } from "@/lib/events";
import { OrganizerHistoryItem } from "./organizer-history-item";

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
  let organizerHistory: Awaited<ReturnType<typeof getOrganizerHistory>> = [];
  let participationHistory: Awaited<ReturnType<typeof getParticipationHistory>> = [];
  let upcomingParticipations: Awaited<ReturnType<typeof getUpcomingParticipations>> = [];
  let myDraftEvents: Awaited<ReturnType<typeof getMyDraftEvents>> = [];
  let hasPendingApplication = false;
  if (userType === "user") {
    const [historyResult, participationResult, upcomingResult, draftResult, pendingResult] = await Promise.all([
      getOrganizerHistory(user.id),
      getParticipationHistory(user.id),
      getUpcomingParticipations(user.id),
      getMyDraftEvents(user.id),
      getPendingApplication(user.id),
    ]);
    organizerHistory = historyResult;
    participationHistory = participationResult;
    upcomingParticipations = upcomingResult;
    myDraftEvents = draftResult;
    hasPendingApplication = pendingResult;
  }

  const userTypeKey = `user_type_${userType}` as const;

  return (
    <main className="p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* タイトル行（全幅） */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <Badge variant={USER_TYPE_VARIANT[userType]}>
            {t(userTypeKey)}
          </Badge>
        </div>

        {/* SP: 1カラム / PC(lg以上): 2カラムグリッド */}
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          {/* 左カラム: カレンダー・履歴系 */}
          <div className="space-y-6">
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
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t("organizer_history_title")}</CardTitle>
                    {organizerHistory.length > 0 && (
                      <a
                        href={`/${locale}/dashboard/organizer-history/csv`}
                        download
                        className="inline-flex min-h-9 items-center rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
                      >
                        {t("organizer_history_csv")}
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {organizerHistory.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {t("organizer_history_empty")}
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {organizerHistory.map((event) => (
                        <OrganizerHistoryItem key={event.id} event={event} locale={locale} />
                      ))}
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
          </div>

          {/* 右カラム: アクション・リスト系 */}
          <div className="space-y-6">
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
                  <CardTitle>{t("my_events_title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {myDraftEvents.length === 0 ? (
                    <div className="space-y-3 py-4 text-center">
                      <p className="text-sm text-muted-foreground">{t("my_events_empty")}</p>
                      <Link
                        href={`/${locale}/dashboard/event/create`}
                        className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-4 text-[0.8rem] font-medium transition-all hover:bg-muted"
                      >
                        {t("create_event")}
                      </Link>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {myDraftEvents.map((event) => {
                        const href =
                          event.status === "draft"
                            ? `/${locale}/dashboard/event/${event.id}/edit`
                            : `/${locale}/dashboard/event/${event.id}`;
                        const statusKey =
                          event.status === "draft"
                            ? "event_status_draft"
                            : "event_status_pending";
                        return (
                          <li key={event.id}>
                            <Link
                              href={href}
                              className="flex items-center justify-between gap-3 py-3 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium">{event.title ?? "—"}</p>
                                <p className="text-xs text-muted-foreground">{event.orgName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(event.createdAt).toLocaleDateString(locale, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                              <Badge
                                variant={event.status === "draft" ? "secondary" : "outline"}
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

            {userOrgs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("orgs_title")}</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}

            {userType === "user" && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("apply_operator_title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {hasPendingApplication ? (
                    <div className="space-y-2 py-2">
                      <Badge variant="secondary">{t("application_pending")}</Badge>
                      <p className="text-sm text-muted-foreground">
                        {t("application_pending_description")}
                      </p>
                    </div>
                  ) : (
                    <Link
                      href={`/${locale}/dashboard/apply`}
                      className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-4 text-[0.8rem] font-medium transition-all hover:bg-muted"
                    >
                      {t("apply_operator")}
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
