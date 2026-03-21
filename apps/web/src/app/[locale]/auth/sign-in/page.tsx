"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

// --- BYPASS START ---
const BYPASS_ENABLED =
  process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" ||
  !!process.env.NEXT_PUBLIC_VERCEL_ENV;

const TEST_ACCOUNTS = [
  {
    label: "一般ユーザー",
    email: "test-user@e-be.internal",
    password: "testpass2026",
  },
  {
    label: "事業者",
    email: "test-venue@e-be.internal",
    password: "testpass2026",
  },
] as const;
// --- BYPASS END ---

export default function SignInPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? `/${locale}/dashboard`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(targetEmail: string, targetPassword: string) {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn(email, password);
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/${locale}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("sign_in.title")}</CardTitle>
            <CardDescription>{t("sign_in.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
              {t("sign_in.google")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t("sign_in.or")}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email">{t("sign_in.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">{t("sign_in.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("sign_in.loading") : t("sign_in.submit")}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {t("sign_in.no_account")}{" "}
              <Link href={`/${locale}/auth/sign-up`} className="underline underline-offset-4">
                {t("sign_in.sign_up_link")}
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* --- BYPASS START --- */}
        {BYPASS_ENABLED && (
          <Card className="border-dashed border-muted-foreground/40">
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-3">
                🔧 テスト用アカウント
              </p>
              {TEST_ACCOUNTS.map((account) => (
                <div
                  key={account.email}
                  className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{account.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{account.email}</p>
                    <p className="text-[11px] text-muted-foreground">{account.password}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 h-8 text-xs px-3"
                    disabled={loading}
                    onClick={() => signIn(account.email, account.password)}
                  >
                    ログイン
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {/* --- BYPASS END --- */}
      </div>
    </main>
  );
}
