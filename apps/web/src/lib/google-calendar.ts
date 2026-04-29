import type { CalendarEventData } from "@/lib/events";

const CALENDAR_ID =
  "jjl7dmes381n9kt27u225g6lr0@group.calendar.google.com";

type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
};

type GoogleCalendarResponse = {
  items?: GoogleCalendarEvent[];
};

export async function getGoogleCalendarEvents(
  from: Date,
  to: Date
): Promise<CalendarEventData[]> {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    key: apiKey,
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];

    const data: GoogleCalendarResponse = await res.json();
    const items = data.items ?? [];

    return items
      .map((item) => ({
        id: `gcal-${item.id}`,
        title: item.summary ?? null,
        startAt: item.start?.dateTime ?? item.start?.date ?? null,
        status: "published" as const,
        source: "external" as const,
      }))
      .filter((e) => e.startAt !== null);
  } catch {
    return [];
  }
}
