"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitApplication } from "./actions";

type Props = {
  userId: string;
  locale: string;
};

export function ApplyForm({ userId, locale }: Props) {
  const t = useTranslations("apply");
  const [state, action, isPending] = useActionState(submitApplication, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(t("toast_success"));
    } else {
      toast.error(t("toast_error"));
    }
  }, [state, t]);

  if (state?.success) {
    return (
      <div className="py-8 text-center space-y-2">
        <p className="font-medium">{t("success_title")}</p>
        <p className="text-sm text-muted-foreground">{t("success_description")}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-1.5">
        <Label htmlFor="companyName">{t("company_name")} *</Label>
        <Input
          id="companyName"
          name="companyName"
          placeholder={t("company_name_placeholder")}
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="orgName">{t("org_name")} *</Label>
        <Input
          id="orgName"
          name="orgName"
          placeholder={t("org_name_placeholder")}
          required
          maxLength={50}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="orgSlug">{t("org_slug")} *</Label>
        <Input
          id="orgSlug"
          name="orgSlug"
          placeholder={t("org_slug_placeholder")}
          required
          maxLength={50}
          pattern="[a-z0-9-]+"
        />
        <p className="text-xs text-muted-foreground">{t("org_slug_hint")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="orgDescription">{t("description")}</Label>
        <textarea
          id="orgDescription"
          name="orgDescription"
          placeholder={t("description_placeholder")}
          maxLength={1000}
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">{t("address")} *</Label>
        <Input
          id="address"
          name="address"
          placeholder={t("address_placeholder")}
          required
          maxLength={200}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full min-h-11">
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
