import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const featureKeys = [
  { key: "events", icon: "🎪" },
  { key: "multitenant", icon: "🏪" },
  { key: "participants", icon: "👥" },
  { key: "ai", icon: "🤖" },
  { key: "coupons", icon: "🎫" },
  { key: "fc", icon: "🤝" },
] as const;

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <Badge variant="outline" className="mb-6 font-mono text-xs cursor-pointer">
            {t("badge")}
          </Badge>
          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            {t("title")}{" "}
            <span className="text-muted-foreground font-light">E-be</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            {t("tagline")}
            <br />
            {t("description")}
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" className="transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer">
              {t("cta_search")}
            </Button>
            <Button size="lg" variant="outline" className="transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer">
              {t("cta_request")}
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-10 text-center text-2xl font-semibold">
          {t("features_title")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map(({ key, icon }) => (
            <Card key={key} className="transition-all duration-200 hover:bg-muted/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
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
      </section>

      {/* Stack */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-12 text-center">
          <p className="mb-4 text-sm text-muted-foreground">{t("stack_title")}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Turborepo", "Next.js 16", "Expo", "Supabase", "Drizzle ORM", "Tailwind CSS", "shadcn/ui"].map(
              (tech) => (
                <Badge key={tech} variant="secondary" className="font-mono text-xs">
                  {tech}
                </Badge>
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
