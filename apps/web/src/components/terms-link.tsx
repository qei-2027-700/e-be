"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface TermsLinkProps {
  className?: string;
  children?: React.ReactNode;
}

export function TermsLink({ className, children }: TermsLinkProps) {
  const locale = useLocale();
  const t = useTranslations("terms");

  return (
    <Link
      href={`/${locale}/terms`}
      target="_blank"
      rel="noopener noreferrer"
      className={`underline underline-offset-4 hover:text-foreground transition-colors${className ? ` ${className}` : ""}`}
    >
      {children ?? t("link_text")}
    </Link>
  );
}
