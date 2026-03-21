import { getLocale, getTranslations } from "next-intl/server";
import { NavBar } from "@/components/lp/nav-bar";
import { AppFooter } from "@/components/layout/app-footer";
import { getUser } from "@/lib/auth";

export default async function TermsPage() {
  const [t, locale, user, homeT] = await Promise.all([
    getTranslations("terms_page"),
    getLocale(),
    getUser(),
    getTranslations("home"),
  ]);

  const sectionKeys = ["1", "2", "3"] as const;

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

      <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
        <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mb-10 text-sm text-muted-foreground">
          {t("updated_at")}
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="mb-8 leading-relaxed">
            {t("introduction")}
          </p>

          <div className="space-y-10">
            {sectionKeys.map((key) => (
              <section key={key}>
                <h2 className="mb-4 text-xl font-semibold">
                  {t(`sections.${key}.title`)}
                </h2>
                <p className="leading-relaxed text-muted-foreground">
                  {t(`sections.${key}.content`)}
                </p>
              </section>
            ))}
          </div>
        </div>
      </div>

      <AppFooter innerClassName="mx-auto max-w-5xl px-6 py-10" />
    </main>
  );
}
