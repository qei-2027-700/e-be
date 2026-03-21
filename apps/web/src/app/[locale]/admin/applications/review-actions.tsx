"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { approveApplication, rejectApplication } from "./actions";

type Props = {
  applicationId: string;
  applicantUserId: string;
  orgName: string;
  orgSlug: string;
  companyName: string;
  address: string | null;
  description: string | null;
  reviewerUserId: string;
  locale: string;
};

export function ReviewActions({
  applicationId,
  applicantUserId,
  orgName,
  orgSlug,
  companyName,
  address,
  description,
  reviewerUserId,
  locale,
}: Props) {
  const t = useTranslations("admin");
  const [approveState, approveAction, isApproving] = useActionState(approveApplication, null);
  const [rejectState, rejectAction, isRejecting] = useActionState(rejectApplication, null);

  useEffect(() => {
    if (!approveState) return;
    if ((approveState as { error?: string }).error) {
      toast.error(t("toast_error"));
    } else if ((approveState as { ok?: boolean }).ok) {
      toast.success(t("toast_approve_success"));
    }
  }, [approveState, t]);

  useEffect(() => {
    if (!rejectState) return;
    if ((rejectState as { error?: string }).error) {
      toast.error(t("toast_error"));
    } else if ((rejectState as { ok?: boolean }).ok) {
      toast.success(t("toast_reject_success"));
    }
  }, [rejectState, t]);

  return (
    <div className="space-y-3 border-t pt-3">
      <form action={approveAction} className="inline-block mr-2">
        <input type="hidden" name="applicationId" value={applicationId} />
        <input type="hidden" name="applicantUserId" value={applicantUserId} />
        <input type="hidden" name="orgName" value={orgName} />
        <input type="hidden" name="orgSlug" value={orgSlug} />
        <input type="hidden" name="companyName" value={companyName} />
        <input type="hidden" name="address" value={address ?? ""} />
        <input type="hidden" name="description" value={description ?? ""} />
        <input type="hidden" name="reviewerUserId" value={reviewerUserId} />
        <input type="hidden" name="locale" value={locale} />
        <Button
          type="submit"
          variant="default"
          size="sm"
          disabled={isApproving || isRejecting}
          className="min-h-9"
        >
          {t("approve")}
        </Button>
      </form>

      <form action={rejectAction} className="space-y-2">
        <input type="hidden" name="applicationId" value={applicationId} />
        <input type="hidden" name="reviewerUserId" value={reviewerUserId} />
        <input type="hidden" name="locale" value={locale} />
        <div className="space-y-1.5">
          <Label htmlFor={`note-${applicationId}`} className="text-xs">
            {t("reject_note")}
          </Label>
          <textarea
            id={`note-${applicationId}`}
            name="reviewNote"
            placeholder={t("reject_note_placeholder")}
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={isApproving || isRejecting}
          className="min-h-9"
        >
          {t("reject")}
        </Button>
      </form>
    </div>
  );
}
