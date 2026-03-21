import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getUser, getOrgRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string; orgId: string }>;
};

export default async function OrgSettingsPage({ params }: Props) {
  const [{ orgId }, locale, t, user] = await Promise.all([
    params,
    getLocale(),
    getTranslations("dashboard"),
    getUser(),
  ]);
  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const role = await getOrgRole(user.id, orgId);
  if (role !== "owner") {
    redirect(`/${locale}/dashboard/org/${orgId}`);
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/dashboard/org/${orgId}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2.5 text-[0.8rem] font-medium transition-all hover:bg-muted"
          >
            ← {t("settings.back")}
          </Link>
          <h1 className="text-xl font-bold">{t("settings.title")}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 設定項目は今後のIssueで追加 */}
            <p className="text-sm text-muted-foreground">
              {t("settings.owner_only")}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
