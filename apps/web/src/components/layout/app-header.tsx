import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

interface AppHeaderProps {
  userEmail: string;
  userType: "user" | "venue_user" | "system_user";
  locale: string;
}

export async function AppHeader({ userEmail, userType, locale }: AppHeaderProps) {
  const t = await getTranslations("dashboard");

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect(`/${locale}/auth/sign-in`);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 h-14 md:px-6">
        <Link href={`/${locale}`} className="text-base font-bold tracking-tight">
          E-be
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:block">
            {userEmail}
          </span>
          {userType === "system_user" && (
            <Link
              href={`/${locale}/admin`}
              className="inline-flex min-h-9 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
            >
              {t("admin_link")}
            </Link>
          )}
          <form action={signOut}>
            <Button variant="outline" type="submit" size="sm" className="min-h-9">
              {t("sign_out")}
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
