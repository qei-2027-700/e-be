import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getUser, getUserType } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { operatorApplications, organizations } from "@e-be/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import Link from "next/link";
import { ApplyForm } from "./apply-form";

export default async function ApplyPage() {
  const locale = await getLocale();

  const user = await getUser();
  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const userType = await getUserType(user.id);

  // venue_user はすでに組織を持っている
  if (userType === "venue_user") {
    redirect(`/${locale}/dashboard`);
  }

  // system_user は管理者画面から直接作成
  if (userType === "system_user") {
    redirect(`/${locale}/admin`);
  }

  // 申請中の場合はダッシュボードへ
  const pending = await db
    .select({ id: operatorApplications.id })
    .from(operatorApplications)
    .where(
      and(
        eq(operatorApplications.userId, user.id),
        eq(operatorApplications.status, "pending"),
        isNull(operatorApplications.deletedAt)
      )
    )
    .limit(1);

  if (pending.length > 0) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations("apply");
  const tDash = await getTranslations("dashboard");

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/dashboard`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {tDash("title")}
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </CardHeader>
          <CardContent>
            <ApplyForm locale={locale} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
