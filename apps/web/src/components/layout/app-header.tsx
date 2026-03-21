import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { HamburgerMenu } from "@/components/layout/hamburger-menu";

interface AppHeaderProps {
  userEmail: string;
  userType: "user" | "venue_user" | "system_user";
  locale: string;
}

export async function AppHeader({ userEmail, userType, locale }: AppHeaderProps) {
  const t = await getTranslations("dashboard");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 h-14 md:px-6">
        <Link href={`/${locale}`} className="text-base font-bold tracking-tight">
          E-be
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:block">
            {userEmail}
          </span>
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
          <HamburgerMenu locale={locale} userType={userType} />
        </div>
      </div>
    </header>
  );
}
