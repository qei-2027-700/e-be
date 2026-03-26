import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getUser, getOrgRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@e-be/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { EventCalendar } from "@/components/event-calendar";
import { getEventsForCalendar } from "@/lib/events";
import { PageContextRegister } from "@/components/ai-chat/page-context-register";

type Props = {
  params: Promise<{ locale: string; orgId: string }>;
};

export default async function OrgDashboardPage({ params }: Props) {
  const { orgId } = await params;
  const locale = await getLocale();
  const t = await getTranslations("dashboard");

  const user = await getUser();
  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const role = await getOrgRole(user.id, orgId);
  if (!role) {
    redirect(`/${locale}/dashboard`);
  }

  const now = new Date();
  const calendarFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const calendarTo = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  const [[org], calendarEvents] = await Promise.all([
    db
      .select()
      .from(organizations)
      .where(and(eq(organizations.id, orgId), isNull(organizations.deletedAt)))
      .limit(1),
    getEventsForCalendar({ orgId, from: calendarFrom, to: calendarTo }),
  ]);

  if (!org) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <PageContextRegister orgId={orgId} pageName={`バーダッシュボード: ${org.name}`} />
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2.5 text-[0.8rem] font-medium transition-all hover:bg-muted"
            >
              ← {t("org.back")}
            </Link>
            <h1 className="text-xl font-bold truncate">{org.name}</h1>
          </div>
          {role === "owner" && (
            <Link
              href={`/${locale}/dashboard/org/${orgId}/settings`}
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-all hover:bg-muted"
            >
              {t("org.settings")}
            </Link>
          )}
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

        <Card>
          <CardHeader>
            <CardTitle>@{org.slug}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t("org.your_role")}:</span>
              <Badge variant={role === "owner" ? "default" : "secondary"}>
                {role === "owner" ? t("role_owner") : t("role_member")}
              </Badge>
            </div>
            {org.description && (
              <p className="text-muted-foreground">{org.description}</p>
            )}
            {org.address && (
              <p className="text-muted-foreground">{org.address}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
