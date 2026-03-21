"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateEventDraft, submitEvent, publishEvent } from "@/lib/actions/event";
import Link from "next/link";

type EventData = {
  id: string;
  title: string | null;
  description: string | null;
  startAt: string | null;
  endAt: string | null;
  maxParticipants: number | null;
};

type Props = {
  event: EventData;
  eventId: string;
  hasPermission: boolean;
  locale: string;
};

// ISO文字列を datetime-local input 用のフォーマットに変換
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

export function EventEditForm({ event, eventId, hasPermission, locale }: Props) {
  const t = useTranslations("event_edit");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [startAt, setStartAt] = useState(toDatetimeLocal(event.startAt));
  const [endAt, setEndAt] = useState(toDatetimeLocal(event.endAt));

  const hasDatetime = startAt !== "" && endAt !== "";

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await updateEventDraft(eventId, formData);
      if ("error" in result) {
        setError(t(`error_${result.error}` as Parameters<typeof t>[0]));
        toast.error(t("toast_error"));
        return;
      }
      toast.success(t("toast_draft_saved"));
      router.refresh();
    });
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await submitEvent(eventId);
      if ("error" in result) {
        setError(t(`error_${result.error}` as Parameters<typeof t>[0]));
        toast.error(t("toast_error"));
        return;
      }
      toast.success(t("toast_submitted"));
      router.push(`/${locale}/dashboard`);
    });
  }

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      const result = await publishEvent(eventId);
      if ("error" in result) {
        setError(t(`error_${result.error}` as Parameters<typeof t>[0]));
        toast.error(t("toast_error"));
        return;
      }
      toast.success(t("toast_published"));
      router.push(`/${locale}/dashboard/event/${eventId}`);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">{t("field_title")}</Label>
            <Input
              id="title"
              name="title"
              defaultValue={event.title ?? ""}
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
              defaultValue={event.description ?? ""}
              maxLength={2000}
              rows={5}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="startAt">{t("field_start_at")}</Label>
            <Input
              id="startAt"
              name="startAt"
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="endAt">{t("field_end_at")}</Label>
            <Input
              id="endAt"
              name="endAt"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="maxParticipants">{t("field_max_participants")}</Label>
            <Input
              id="maxParticipants"
              name="maxParticipants"
              type="number"
              defaultValue={event.maxParticipants ?? ""}
              min={1}
              max={500}
              disabled={isPending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" variant="outline" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? t("submitting") : t("save_draft")}
            </Button>

            {hasPermission ? (
              <Button
                type="button"
                disabled={isPending || !hasDatetime}
                onClick={handlePublish}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? t("submitting") : t("publish")}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isPending || !hasDatetime}
                onClick={handleSubmit}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? t("submitting") : t("submit")}
              </Button>
            )}

            <Link href={`/${locale}/dashboard`} className={buttonVariants({ variant: "outline" })}>
              {t("back")}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
