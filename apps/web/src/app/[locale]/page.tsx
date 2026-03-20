import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import { NavBar } from "@/components/lp/nav-bar";
import { LinkButton } from "@/components/lp/link-button";
import { AppFooter } from "@/components/layout/app-footer";

const venueItemKeys = [
  "pain.venue_item_1",
  "pain.venue_item_2",
  "pain.venue_item_3",
  "pain.venue_item_4",
] as const;

const eventerItemKeys = [
  "pain.eventer_item_1",
  "pain.eventer_item_2",
  "pain.eventer_item_3",
  "pain.eventer_item_4",
] as const;

const participantItemKeys = [
  "pain.participant_item_1",
  "pain.participant_item_2",
  "pain.participant_item_3",
  "pain.participant_item_4",
] as const;

const howSteps = [
  { titleKey: "how.step_1_title", descKey: "how.step_1_desc" },
  { titleKey: "how.step_2_title", descKey: "how.step_2_desc" },
  { titleKey: "how.step_3_title", descKey: "how.step_3_desc" },
] as const;

export default async function HomePage() {
  const [t, locale, user] = await Promise.all([
    getTranslations("home"),
    getLocale(),
    getUser(),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <NavBar
        locale={locale}
        isLoggedIn={!!user}
        labels={{
          signIn: t("nav.sign_in"),
          signUp: t("nav.sign_up"),
          dashboard: t("nav.dashboard"),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b pt-16">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center">
          <Badge variant="outline" className="mb-6 cursor-pointer font-mono text-xs">
            {t("hero.eyebrow")}
          </Badge>
          <h1 className="mb-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mb-10 max-w-lg text-base text-muted-foreground sm:text-lg">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton href="#" size="lg" className="w-full sm:w-auto">
              {t("hero.cta_primary")}
            </LinkButton>
            <LinkButton href="#" size="lg" variant="outline" className="w-full sm:w-auto">
              {t("hero.cta_secondary")}
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Pain — 課題提起 */}
      <section className="border-b bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="mb-12 text-center text-2xl font-semibold sm:text-3xl">
            {t("pain.title")}
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* バーオーナー */}
            <Card className="border-t-4 border-t-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-blue-700">
                  <span className="text-2xl">🏪</span>
                  {t("pain.venue_label")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {venueItemKeys.map((key) => (
                    <li key={key} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 shrink-0 text-blue-500">✕</span>
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* イベンター */}
            <Card className="border-t-4 border-t-indigo-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-indigo-700">
                  <span className="text-2xl">🎤</span>
                  {t("pain.eventer_label")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {eventerItemKeys.map((key) => (
                    <li key={key} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 shrink-0 text-indigo-500">✕</span>
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* 参加者 */}
            <Card className="border-t-4 border-t-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-orange-700">
                  <span className="text-2xl">👥</span>
                  {t("pain.participant_label")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {participantItemKeys.map((key) => (
                    <li key={key} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 shrink-0 text-orange-500">✕</span>
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="mb-14 text-center text-3xl font-bold">
            {t("features.title")}
          </h2>

          <div className="space-y-16">
            {/* 店舗管理者向け */}
            <div className="rounded-2xl bg-blue-50/50 p-8 ring-1 ring-blue-100">
              <h3 className="mb-8 flex items-center gap-2 text-xl font-bold text-blue-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm">1</span>
                {t("features.venue_title")}
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                  { key: "events", icon: "🎪" },
                  { key: "multitenant", icon: "🏪" },
                  { key: "ai", icon: "🤖" },
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

            {/* イベント主催者向け */}
            <div className="rounded-2xl bg-indigo-50/50 p-8 ring-1 ring-indigo-100">
              <h3 className="mb-8 flex items-center gap-2 text-xl font-bold text-indigo-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm">2</span>
                {t("features.eventer_title")}
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                  { key: "events", icon: "🎪" },
                  { key: "participants", icon: "👥" },
                  { key: "fc", icon: "🤝" },
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

            {/* イベント参加者向け */}
            <div className="rounded-2xl bg-orange-50/50 p-8 ring-1 ring-orange-100">
              <h3 className="mb-8 flex items-center gap-2 text-xl font-bold text-orange-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white text-sm">3</span>
                {t("features.participant_title")}
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                  { key: "participants", icon: "👥" },
                  { key: "coupons", icon: "🎫" },
                  { key: "ai", icon: "🤖" }, // おすすめ分析的な意味で
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
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b bg-muted/20">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="mb-14 text-center text-2xl font-semibold sm:text-3xl">
            {t("how.title")}
          </h2>
          <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-3">
            {/* Connecting line — desktop only */}
            <div className="absolute hidden sm:block top-7 left-[calc(16.667%+28px)] right-[calc(16.667%+28px)] h-px bg-border" />

            {howSteps.map(({ titleKey, descKey }, idx) => (
              <div key={titleKey} className="flex flex-col items-center text-center">
                <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-foreground font-bold text-background text-lg">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <h3 className="mb-2 font-semibold">{t(titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
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
            <LinkButton href="#" size="lg" className="min-w-40">
              {t("cta_section.button")}
            </LinkButton>
          </div>
        </div>
      </section>

      <AppFooter innerClassName="mx-auto max-w-5xl px-6 py-10" />
    </main>
  );
}
