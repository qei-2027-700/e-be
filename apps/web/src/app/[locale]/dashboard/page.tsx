import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getUser, getUserOrgs } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const locale = await getLocale();
  const t = await getTranslations("dashboard");

  const user = await getUser();
  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const userOrgs = await getUserOrgs(user.id);

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect(`/${locale}/auth/sign-in`);
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <form action={signOut}>
            <Button variant="outline" type="submit" className="min-h-11">
              {t("sign_out")}
            </Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("orgs_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {userOrgs.length === 0 ? (
              <div className="space-y-4 text-center py-4">
                <p className="text-sm text-muted-foreground">{t("no_orgs")}</p>
                {/* 組織作成フローは別Issueで実装予定 */}
                <Button variant="outline" disabled className="min-h-11">
                  {t("create_org")}
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {userOrgs.map(({ org, role }) => (
                  <li key={org.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{org.name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{org.slug}</p>
                      </div>
                      <Badge variant={role === "owner" ? "default" : "secondary"}>
                        {role === "owner" ? t("role_owner") : t("role_member")}
                      </Badge>
                    </div>
                    <Link
                      href={`/${locale}/dashboard/org/${org.id}`}
                      className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-all hover:bg-muted"
                    >
                      {t("go_to_org")}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
