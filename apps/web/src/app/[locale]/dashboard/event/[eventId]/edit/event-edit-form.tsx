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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateEventDraft, submitEvent, publishEvent } from "@/lib/actions/event";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";

type EventData = {
  id: string;
  orgId: string;
  orgName: string;
  status: string;
  title: string | null;
  description: string | null;
  startAt: string | null;
  endAt: string | null;
  maxParticipants: number | null;
  chargeAmount: number | null;
  nearestStation: string | null;
};

type Props = {
  event: EventData;
  eventId: string;
  hasPermission: boolean;
  locale: string;
  bars: { id: string; name: string }[];
};

function formatDatetimeRange(startIso: string, endIso: string, locale: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);

  const dateOpts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  const startDateStr = start.toLocaleDateString(locale, dateOpts);
  const startTimeStr = start.toLocaleTimeString(locale, timeOpts);
  const endTimeStr = end.toLocaleTimeString(locale, timeOpts);

  const isSameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (isSameDay) {
    return `${startDateStr} ${startTimeStr} 〜 ${endTimeStr}`;
  }
  const endDateStr = end.toLocaleDateString(locale, dateOpts);
  return `${startDateStr} ${startTimeStr} 〜 ${endDateStr} ${endTimeStr}`;
}

export function EventEditForm({ event, eventId, hasPermission, locale, bars }: Props) {
  const t = useTranslations("event_edit");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [startAt, setStartAt] = useState(event.startAt ?? "");
  const [endAt, setEndAt] = useState(event.endAt ?? "");
  const [orgId, setOrgId] = useState(event.orgId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isDraft = event.status === "draft";

  function handleStartAtChange(value: string) {
    setStartAt(value);
    // endAt が未設定の場合は startAt と同じ値を自動セット
    if (!endAt && value) {
      setEndAt(value);
    }
  }

  const hasVenue = Boolean(orgId);
  const hasDatetime = startAt !== "" && endAt !== "";
  const isDatetimeInvalid =
    hasDatetime && new Date(startAt) >= new Date(endAt);
  const canSubmit = hasVenue && !isDatetimeInvalid;
  const canPublish = hasVenue && hasDatetime && !isDatetimeInvalid;

  const selectedBar = bars.find((b) => b.id === orgId);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("orgId", orgId);
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
    setConfirmOpen(false);
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

  const confirmDescription = (
    <span className="flex flex-col gap-1 text-sm">
      <span className="flex gap-2">
        <span className="text-muted-foreground shrink-0">{t("submit_confirm_venue")}:</span>
        <span>{selectedBar?.name ?? event.orgName}</span>
      </span>
      <span className="flex gap-2">
        <span className="text-muted-foreground shrink-0">{t("submit_confirm_datetime")}:</span>
        <span>
          {hasDatetime
            ? formatDatetimeRange(startAt, endAt, locale)
            : t("submit_confirm_not_set")}
        </span>
      </span>
    </span>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          {/* 会場 */}
          <div className="space-y-1">
            <Label>{t("field_venue")}</Label>
            {isDraft ? (
              <Select
                value={orgId}
                onValueChange={(val) => setOrgId(val ?? "")}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {orgId ? (bars.find((b) => b.id === orgId)?.name) : t("field_venue_placeholder")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {bars.map((bar) => (
                    <SelectItem key={bar.id} value={bar.id}>
                      {bar.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                {event.orgName}
              </p>
            )}
          </div>

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
            <DateTimePicker
              id="startAt"
              name="startAt"
              value={startAt}
              onChange={handleStartAtChange}
              disabled={isPending}
              locale={locale}
              placeholder={t("field_start_at")}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="endAt">{t("field_end_at")}</Label>
            <DateTimePicker
              id="endAt"
              name="endAt"
              value={endAt}
              onChange={setEndAt}
              disabled={isPending}
              locale={locale}
              placeholder={t("field_end_at")}
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

          <div className="space-y-1">
            <Label htmlFor="chargeAmount">{t("field_charge_amount")}</Label>
            <Input
              id="chargeAmount"
              name="chargeAmount"
              type="number"
              defaultValue={event.chargeAmount ?? ""}
              min={0}
              step={100}
              placeholder={t("field_charge_amount_placeholder")}
              disabled={isPending}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="nearestStation">{t("field_nearest_station")}</Label>
            <Input
              id="nearestStation"
              name="nearestStation"
              defaultValue={event.nearestStation ?? ""}
              placeholder={t("field_nearest_station_placeholder")}
              maxLength={50}
              disabled={isPending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {isDatetimeInvalid && (
            <p className="text-sm text-destructive">{t("error_invalid_range")}</p>
          )}
          {!hasPermission && !hasDatetime && !isDatetimeInvalid && (
            <p className="text-sm text-amber-600 dark:text-amber-400">{t("warning_no_datetime")}</p>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" variant="outline" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? t("submitting") : t("save_draft")}
            </Button>

            {hasPermission ? (
              <Button
                type="button"
                disabled={isPending || !canPublish}
                onClick={handlePublish}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? t("submitting") : t("publish")}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isPending || !canSubmit}
                onClick={() => setConfirmOpen(true)}
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

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t("submit_confirm_title")}
          description={confirmDescription}
          confirmLabel={t("submit_confirm_label")}
          onConfirm={handleSubmit}
          isPending={isPending}
        />
      </CardContent>
    </Card>
  );
}
