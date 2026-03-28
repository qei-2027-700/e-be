import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { HamburgerMenu } from "@/components/layout/hamburger-menu";
import { APP_NAME } from "@/lib/config";
import { Bell } from "lucide-react";

interface AppHeaderProps {
  userEmail: string;
  userType: "user" | "venue_user" | "system_user";
  locale: string;
  unreadCount?: number;
}

export async function AppHeader({ userEmail, userType, locale, unreadCount = 0 }: AppHeaderProps) {
  const [t, tNav] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("dashboard.nav"),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b glass">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 h-14 md:px-6">
        <Link href={`/${locale}`} className="text-base font-bold tracking-tight">
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:block">
            {userEmail}
          </span>
          <Link
            href={`/${locale}/dashboard/notifications`}
            className="relative hidden md:inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted cursor-pointer"
            aria-label={tNav("notifications")}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          {userType === "system_user" && (
            <Link
              href={`/${locale}/admin`}
              className="hidden md:inline-flex min-h-9 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
            >
              {t("admin_link")}
            </Link>
          )}
          {/* PC のみサインアウトボタン */}
          <form action={signOutAction} className="hidden md:block">
            <Button variant="outline" type="submit" size="sm" className="min-h-9 cursor-pointer">
              {t("sign_out")}
            </Button>
          </form>
          {/* SP のみハンバーガーメニュー */}
          <HamburgerMenu locale={locale} userType={userType} unreadCount={unreadCount} />
        </div>
      </div>
    </header>
  );
}
