"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { TermsLink } from "./terms-link";

interface TermsAgreementProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function TermsAgreement({ checked, onCheckedChange, className }: TermsAgreementProps) {
  const id = useId();
  const t = useTranslations("terms");

  return (
    <div className={`flex items-start gap-2${className ? ` ${className}` : ""}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border border-input accent-primary"
      />
      <label htmlFor={id} className="cursor-pointer text-sm leading-snug text-muted-foreground">
        {t.rich("agreement", {
          link: (chunks) => <TermsLink>{chunks}</TermsLink>,
        })}
      </label>
    </div>
  );
}
