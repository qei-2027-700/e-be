import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export async function AppFooter({ innerClassName }: { innerClassName?: string } = {}) {
  const [t, locale] = await Promise.all([getTranslations("home"), getLocale()]);

  return (
    <footer className="border-t bg-muted/30">
      <div className={innerClassName ?? "mx-auto max-w-5xl px-4 py-6 md:px-6"}>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <span className="font-bold text-sm">{APP_NAME}</span>
          <p className="text-xs text-muted-foreground">{t("footer.copyright")}</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href={`/${locale}/terms`} className="transition-colors hover:text-foreground">
              {t("footer.terms")}
            </Link>
            <Link href={`/${locale}/privacy`} className="transition-colors hover:text-foreground">
              {t("footer.privacy")}
            </Link>
            <Link href={`/${locale}/contact`} className="transition-colors hover:text-foreground">
              {t("footer.contact")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
