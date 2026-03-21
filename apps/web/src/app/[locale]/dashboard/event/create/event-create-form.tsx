"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { createEventDraft } from "@/lib/actions/event";
import Link from "next/link";

type Bar = { id: string; name: string };

type Props = {
  bars: Bar[];
  locale: string;
};

export function EventCreateForm({ bars, locale }: Props) {
  const t = useTranslations("event_create");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await createEventDraft(formData);
      if ("error" in result) {
        const key = `error_${result.error}` as
          | "error_unauthorized"
          | "error_forbidden"
          | "error_invalid"
          | "error_unknown";
        setError(t(key));
        toast.error(t("toast_error"));
        return;
      }
      toast.success(t("toast_success"));
      router.push(`/${locale}/dashboard/event/${result.eventId}`);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="orgId">{t("field_bar")}</Label>
            <Select id="orgId" name="orgId" required disabled={isPending}>
              <option value="">{t("field_bar_placeholder")}</option>
              {bars.map((bar) => (
                <option key={bar.id} value={bar.id}>
                  {bar.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="title">{t("field_title")}</Label>
            <Input
              id="title"
              name="title"
              placeholder={t("field_title_placeholder")}
              maxLength={100}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">{t("field_description")}</Label>
            <Textarea
              id="description"
              name="description"
              placeholder={t("field_description_placeholder")}
              maxLength={2000}
              rows={5}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="maxParticipants">{t("field_max_participants")}</Label>
            <Input
              id="maxParticipants"
              name="maxParticipants"
              type="number"
              placeholder={t("field_max_participants_placeholder")}
              min={1}
              max={500}
              disabled={isPending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? t("submitting") : t("submit")}
            </Button>
            <Link href={`/${locale}/dashboard`} className={buttonVariants({ variant: "outline" })}>
              {t("back")}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
