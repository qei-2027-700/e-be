import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@e-be/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";

export default async function NotificationsPage() {
  const [locale, dbUser, t] = await Promise.all([
    getLocale(),
    getDbUser(),
    getTranslations("dashboard.notifications"),
  ]);

  if (!dbUser) notFound();

  const rows = await db
    .select({
      id: notifications.id,
      createdAt: notifications.createdAt,
      title: notifications.title,
      body: notifications.body,
      readAt: notifications.readAt,
      payload: notifications.payload,
    })
    .from(notifications)
    .where(and(eq(notifications.userId, dbUser.id), isNull(notifications.deletedAt)))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return (
    <main className="px-4 py-6 md:px-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <form action={async () => {
            "use server";
            await markAllNotificationsRead(locale);
          }}>
            <Button type="submit" variant="outline" size="sm" className="cursor-pointer">
              {t("mark_all_read")}
            </Button>
          </form>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((n) => {
              const payload = (n.payload ?? {}) as Record<string, unknown>;
              const eventId = typeof payload.eventId === "string" ? payload.eventId : null;
              const href = eventId ? `/${locale}/events/${eventId}` : null;
              const isUnread = !n.readAt;

              return (
                <Card key={n.id} className={isUnread ? "border-feature/40 bg-feature/5" : undefined}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between gap-3 text-base">
                      <span className="line-clamp-1">{n.title}</span>
                      {isUnread && (
                        <span className="shrink-0 rounded-full bg-feature px-2 py-0.5 text-[11px] font-semibold text-white">
                          {t("unread")}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.body}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">
                        {n.createdAt.toLocaleString(locale)}
                      </span>
                      <div className="flex items-center gap-2">
                        {href && (
                          <Link href={href} className="text-sm font-medium hover:underline">
                            {t("open")}
                          </Link>
                        )}
                        {isUnread && (
                          <form action={async () => {
                            "use server";
                            await markNotificationRead(n.id, locale);
                          }}>
                            <Button type="submit" variant="outline" size="sm" className="cursor-pointer">
                              {t("mark_read")}
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

