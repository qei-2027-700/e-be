"use server";

import { searchPublicEvents, type PublicEventItem } from "@/lib/events";

export async function fetchPublicEventsAction(opts: {
  area?: string;
  line?: string;
  limit: number;
  offset: number;
}): Promise<PublicEventItem[]> {
  return searchPublicEvents(opts);
}
