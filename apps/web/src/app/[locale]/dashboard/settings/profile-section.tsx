"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateXUrl } from "@/lib/actions/user";

type Props = {
  currentXUrl: string | null;
};

export function ProfileSection({ currentXUrl }: Props) {
  const t = useTranslations("dashboard.account_settings");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await updateXUrl(formData);
      if ("error" in result) {
        const key =
          result.error === "invalid_url"
            ? "x_url_error_invalid"
            : "x_url_error_unknown";
        setError(t(key as Parameters<typeof t>[0]));
        return;
      }
      toast.success(t("x_url_saved"));
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("x_url_label")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="xUrl">{t("x_url_label")}</Label>
            <Input
              id="xUrl"
              name="xUrl"
              type="url"
              defaultValue={currentXUrl ?? ""}
              placeholder={t("x_url_placeholder")}
              disabled={isPending}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isPending} variant="outline">
            {t("x_url_save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
