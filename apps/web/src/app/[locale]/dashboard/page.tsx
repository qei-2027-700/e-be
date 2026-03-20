import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getLocale();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect(`/${locale}/auth/sign-in`);
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
          <form action={signOut}>
            <Button variant="outline" type="submit">サインアウト</Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ログイン中のユーザー</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">メール: </span>
              <span className="font-mono">{user.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ID: </span>
              <span className="font-mono text-xs">{user.id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">認証方法: </span>
              <span>{user.app_metadata.provider}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
