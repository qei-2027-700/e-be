import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getUser, getDbUser, getUserType } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { db } from "@/lib/db";
import { notifications } from "@e-be/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, user, dbUser] = await Promise.all([getLocale(), getUser(), getDbUser()]);

  if (!user || !dbUser) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const [userType, unreadResult] = await Promise.all([
    getUserType(user.id),
    db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(notifications)
      .where(and(eq(notifications.userId, dbUser.id), isNull(notifications.readAt), isNull(notifications.deletedAt)))
      .then((r) => r[0]?.count ?? 0),
  ]);
  const unreadCount = unreadResult;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* 装飾グラデーション — glass エフェクトの背景として機能する */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[oklch(0.8_0.08_260/0.35)] blur-3xl dark:bg-[oklch(0.4_0.08_260/0.25)]" />
        <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-[oklch(0.85_0.06_300/0.30)] blur-3xl dark:bg-[oklch(0.35_0.06_300/0.20)]" />
      </div>
      <AppHeader
        userEmail={user.email ?? ""}
        userType={userType}
        locale={locale}
        unreadCount={unreadCount}
      />
      <div className="flex-1">{children}</div>
      <AppFooter />
    </div>
  );
}
