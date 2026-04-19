import { getTranslations } from "next-intl/server";
import { searchPublicEvents, getAvailableLines } from "@/lib/events";
import { EventsFilter } from "./events-filter";
import { EventsList } from "./events-list";
import { AppFooter } from "@/components/layout/app-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { getUser, getDbUser } from "@/lib/auth";
import { getWatchedUserIds } from "@/lib/actions/watch";

const PAGE_SIZE = 12;

type SearchParams = Promise<{
  area?: string;
  line?: string;
}>;

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ area, line }, user, dbUser, availableLines] = await Promise.all([
    searchParams,
    getUser(),
    getDbUser(),
    getAvailableLines(),
  ]);
  const t = await getTranslations("events");

  const [items, watchedUserIds] = await Promise.all([
    searchPublicEvents({ area, line, limit: PAGE_SIZE + 1, offset: 0 }),
    dbUser ? getWatchedUserIds(dbUser.id) : Promise.resolve([]),
  ]);

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
            loggedInUserId={dbUser?.id ?? null}
            watchedUserIds={watchedUserIds}
          />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
