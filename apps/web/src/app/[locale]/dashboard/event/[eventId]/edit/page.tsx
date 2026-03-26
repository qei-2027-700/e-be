import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getDbUser } from "@/lib/auth";
import { getDraftEventForOwner, hasBarHostPermission, getPublicBars } from "@/lib/events";
import { EventEditForm } from "./event-edit-form";
import { PageContextRegister } from "@/components/ai-chat/page-context-register";

type Props = {
  params: Promise<{ eventId: string }>;
};

export default async function EventEditPage({ params }: Props) {
  const { eventId } = await params;

  const dbUser = await getDbUser();
  if (!dbUser) notFound();

  const event = await getDraftEventForOwner(eventId, dbUser.id);
  if (!event) notFound();
  // draft のみ編集可能。pending 以降は 404
  if (event.status !== "draft") notFound();

  const [locale, t, hasPermission, bars] = await Promise.all([
    getLocale(),
    getTranslations("event_edit"),
    hasBarHostPermission(dbUser.id, event.orgId),
    getPublicBars(),
  ]);

  return (
    <main className="p-4 md:p-6">
      <PageContextRegister eventId={eventId} pageName="イベント編集" />
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <EventEditForm event={event} hasPermission={hasPermission} locale={locale} eventId={eventId} bars={bars} />
      </div>
    </main>
  );
}
