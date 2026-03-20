import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { operatorApplications, users } from "@e-be/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ReviewActions } from "./review-actions";

export default async function AdminApplicationsPage() {
  const locale = await getLocale();

  const user = await getUser();
  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const admin = await isAdmin(user.id);
  if (!admin) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations("admin");

  const applications = await db
    .select({
      app: operatorApplications,
      applicant: {
        email: users.email,
        name: users.name,
      },
    })
    .from(operatorApplications)
    .innerJoin(users, eq(operatorApplications.userId, users.id))
    .where(isNull(operatorApplications.deletedAt))
    .orderBy(desc(operatorApplications.createdAt));

  const statusBadge = (status: string) => {
    if (status === "pending") return <Badge variant="secondary">{t("status_pending")}</Badge>;
    if (status === "approved") return <Badge variant="default">{t("status_approved")}</Badge>;
    return <Badge variant="destructive">{t("status_rejected")}</Badge>;
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("applications_title")}</h1>
          <Link
            href={`/${locale}/dashboard`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">{t("applications_empty")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map(({ app, applicant }) => (
              <Card key={app.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{app.companyName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {applicant.name ?? applicant.email} · {applicant.email}
                      </p>
                    </div>
                    {statusBadge(app.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("org_name")}</p>
                      <p className="font-medium">{app.orgName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("org_slug")}</p>
                      <p className="font-mono">{app.orgSlug}</p>
                    </div>
                    {app.address && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">住所</p>
                        <p>{app.address}</p>
                      </div>
                    )}
                    {app.description && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">説明</p>
                        <p className="text-muted-foreground">{app.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">{t("applied_at")}</p>
                      <p>{app.createdAt.toLocaleDateString("ja-JP")}</p>
                    </div>
                  </div>

                  {app.reviewNote && (
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs text-muted-foreground mb-1">{t("reject_note")}</p>
                      <p>{app.reviewNote}</p>
                    </div>
                  )}

                  {app.status === "pending" && (
                    <ReviewActions
                      applicationId={app.id}
                      applicantUserId={app.userId}
                      orgName={app.orgName}
                      orgSlug={app.orgSlug}
                      companyName={app.companyName}
                      address={app.address}
                      description={app.description}
                      reviewerUserId={user.id}
                      locale={locale}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
