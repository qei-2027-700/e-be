import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getUser, getUserOrgs, getUserType } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { db } from "@/lib/db";
import { operatorApplications } from "@e-be/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { EventCalendar } from "@/components/event-calendar";
import { getEventsForCalendar, getOrganizerHistory } from "@/lib/events";

const USER_TYPE_VARIANT = {
  user: "secondary",
  venue_user: "default",
  system_user: "destructive",
} as const;

export default async function DashboardPage() {
  const locale = await getLocale();
  const t = await getTranslations("dashboard");

  const user = await getUser();
  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

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
  if (userType === "user") {
    const [pendingResult, historyResult] = await Promise.all([
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
    ]);
    hasPendingApplication = pendingResult.length > 0;
    organizerHistory = historyResult;
  }

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect(`/${locale}/auth/sign-in`);
  }

  const userTypeKey = `user_type_${userType}` as const;

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <Badge variant={USER_TYPE_VARIANT[userType]}>
              {t(userTypeKey)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {userType === "system_user" && (
              <Link
                href={`/${locale}/admin`}
                className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-all hover:bg-muted"
              >
                {t("admin_link")}
              </Link>
            )}
            <form action={signOut}>
              <Button variant="outline" type="submit" className="min-h-11">
                {t("sign_out")}
              </Button>
            </form>
          </div>
        </div>

        <Card>
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
