import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";

/**
 * 未ログインでもアクセス可能なページ（/events 等）向けのシンプルなヘッダー。
 * ログイン済みユーザーにはダッシュボードへのリンクを、
 * 未ログインにはサインインリンクを表示する。
 */
export async function PublicHeader({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [locale, tDashboard, tHome] = await Promise.all([
    getLocale(),
    getTranslations("dashboard.nav"),
    getTranslations("home.nav"),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b glass">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 h-14 md:px-6">
        <Link href={`/${locale}`} className="text-base font-bold tracking-tight">
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex min-h-9 items-center rounded-lg border border-border bg-background px-3 text-[0.8rem] font-medium transition-colors hover:bg-muted"
            >
              {tDashboard("dashboard")}
            </Link>
          ) : (
            <Link
              href={`/${locale}/auth/sign-in`}
              className="inline-flex min-h-9 items-center rounded-lg bg-primary px-3 text-[0.8rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {tHome("sign_in")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
