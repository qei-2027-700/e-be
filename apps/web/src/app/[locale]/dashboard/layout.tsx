import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getUser, getDbUser, getUserType } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, user, dbUser] = await Promise.all([getLocale(), getUser(), getDbUser()]);

  if (!user || !dbUser) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const userType = await getUserType(user.id);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        userEmail={user.email ?? ""}
        userType={userType}
        locale={locale}
      />
      <div className="flex-1">{children}</div>
      <AppFooter />
    </div>
  );
}
