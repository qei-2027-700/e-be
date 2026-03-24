import { getLocale, getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavBar } from "@/components/lp/nav-bar";
import { LinkButton } from "@/components/lp/link-button";
import { AppFooter } from "@/components/layout/app-footer";
import { getUser } from "@/lib/auth";

export default async function ForVenuesPage() {
  const [t, locale, user, homeT] = await Promise.all([
    getTranslations("venue_lp"),
    getLocale(),
    getUser(),
    getTranslations("home"),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <NavBar
        locale={locale}
        isLoggedIn={!!user}
        extraLinks={[
          { href: `/${locale}`, label: t("nav.back_to_home") },
        ]}
        labels={{
          signIn: homeT("nav.sign_in"),
          signUp: homeT("nav.sign_up"),
          dashboard: homeT("nav.dashboard"),
        }}
      />

      <section className="relative overflow-hidden border-b pt-16">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-feature/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
          <p className="mb-4 text-sm font-medium text-feature">
            {t("hero.eyebrow")}
          </p>
          <h1 className="mb-5 text-4xl font-bold tracking-tight sm:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton
              href={user ? `/${locale}/dashboard` : `/${locale}/auth/sign-up`}
              size="lg"
              className="w-full sm:w-auto"
            >
              {t("hero.cta_primary")}
            </LinkButton>
            <LinkButton
              href={`/${locale}`}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              {t("hero.cta_secondary")}
            </LinkButton>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {t("hero.note")}
          </p>
        </div>
      </section>

      <section className="border-b bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="mb-14 text-center text-3xl font-bold">
            {t("features.title")}
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { key: "store", icon: "🏪" },
              { key: "approval", icon: "✅" },
              { key: "analytics", icon: "📈" },
            ].map(({ key, icon }) => (
              <Card key={key} className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-2xl">{icon}</span>
                    {t(`features.${key}.title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t(`features.${key}.description`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-muted/40 via-background to-muted/40" />
          <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl lg:text-4xl">
              {t("cta_section.title")}
            </h2>
            <p className="mb-8 text-muted-foreground">
              {t("cta_section.subtitle")}
            </p>
            <LinkButton
              href={user ? `/${locale}/dashboard` : `/${locale}/auth/sign-up`}
              size="lg"
              className="min-w-40"
            >
              {t("cta_section.button")}
            </LinkButton>
          </div>
        </div>
      </section>

      <AppFooter innerClassName="mx-auto max-w-5xl px-6 py-10" />
    </main>
  );
}
