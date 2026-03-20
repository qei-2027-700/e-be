import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getUser, getUserType } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const user = await getUser();

  if (!user) {
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
