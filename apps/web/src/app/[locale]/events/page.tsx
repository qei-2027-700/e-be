import { getTranslations } from "next-intl/server";
import { searchPublicEvents, getAvailableLines } from "@/lib/events";
import { EventsFilter } from "./events-filter";
import { EventsList } from "./events-list";
import { AppFooter } from "@/components/layout/app-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { getUser } from "@/lib/auth";

const PAGE_SIZE = 12;

type SearchParams = Promise<{
  area?: string;
  line?: string;
}>;

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ area, line }, user, availableLines] = await Promise.all([
    searchParams,
    getUser(),
    getAvailableLines(),
  ]);
  const t = await getTranslations("events");

  // 初回表示分を取得（1件多く取得して hasNext を判定）
  const items = await searchPublicEvents({
    area,
    line,
    limit: PAGE_SIZE + 1,
    offset: 0,
  });

  const hasNext = items.length > PAGE_SIZE;
  const initialEvents = hasNext ? items.slice(0, PAGE_SIZE) : items;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <PublicHeader isLoggedIn={!!user} />
      <main className="flex-1 px-4 py-8 md:px-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <h1 className="text-2xl font-bold">{t("title")}</h1>

          <EventsFilter
            defaultArea={area}
            defaultLine={line}
            availableLines={availableLines}
          />

          <EventsList
            initialEvents={initialEvents}
            initialHasNext={hasNext}
            area={area}
            line={line}
          />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
