import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getDbUser, getUserType } from "@/lib/auth";
import { getPublicBars } from "@/lib/events";
import { EventCreateForm } from "./event-create-form";

export default async function EventCreatePage() {
  const dbUser = await getDbUser();
  if (!dbUser) notFound();

  const userType = await getUserType(dbUser.id);
  if (userType !== "user") notFound();

  const [locale, t, bars] = await Promise.all([
    getLocale(),
    getTranslations("event_create"),
    getPublicBars(),
  ]);

  return (
    <main className="p-4 md:p-6">
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <EventCreateForm bars={bars} locale={locale} />
      </div>
    </main>
  );
}
