import { getLocale, getTranslations } from "next-intl/server";
import { NavBar } from "@/components/lp/nav-bar";
import { AppFooter } from "@/components/layout/app-footer";
import { getUser } from "@/lib/auth";
import { Construction } from "lucide-react";

export default async function ContactPage() {
  const [t, locale, user, homeT] = await Promise.all([
    getTranslations("contact_page"),
    getLocale(),
    getUser(),
    getTranslations("home"),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <NavBar
        locale={locale}
        isLoggedIn={!!user}
        labels={{
          signIn: homeT("nav.sign_in"),
          signUp: homeT("nav.sign_up"),
          dashboard: homeT("nav.dashboard"),
        }}
      />

      <div className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
        <h1 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>

        <div className="rounded-lg border border-dashed bg-muted/30 px-8 py-12 text-center">
          <Construction className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-base font-medium">
            {t("unavailable_heading")}
          </p>
          <p className="text-sm text-muted-foreground">{t("unavailable_body")}</p>
        </div>

        <div className="mt-8 space-y-4 opacity-50">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">
              お名前
            </label>
            <input
              disabled
              className="w-full cursor-not-allowed rounded-md border bg-muted px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">
              メールアドレス
            </label>
            <input
              disabled
              className="w-full cursor-not-allowed rounded-md border bg-muted px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">
              お問い合わせ内容
            </label>
            <textarea
              disabled
              rows={5}
              className="w-full cursor-not-allowed rounded-md border bg-muted px-3 py-2 text-sm"
            />
          </div>
          <button
            disabled
            className="w-full cursor-not-allowed rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50"
          >
            {t("submit")}
          </button>
        </div>
      </div>

      <AppFooter />
    </main>
  );
}
