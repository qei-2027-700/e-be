"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { approveEvent } from "@/lib/actions/event";
import { PendingEventItem } from "@/lib/events";
import { Calendar, User } from "lucide-react";

type Props = {
  initialEvents: PendingEventItem[];
};

export function PendingEventList({ initialEvents }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const t = useTranslations("dashboard.org");

  const handleApprove = async (eventId: string) => {
    setLoadingId(eventId);
    try {
      const result = await approveEvent(eventId);
      if ("error" in result) {
        toast.error(t("approve_error"));
      } else {
        toast.success(t("approve_success"));
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("approve_error"));
    } finally {
      setLoadingId(null);
    }
  };

  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {t("pending_events_title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-amber-600 border-amber-500/50 bg-amber-500/5">
                  Pending
                </Badge>
                <span className="font-semibold">{event.title || "Untitled Event"}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {event.userName || "Unknown"}
                </div>
                {event.startAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(event.startAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleApprove(event.id)}
              disabled={loadingId === event.id}
            >
              {loadingId === event.id ? t("approving") : t("approve_button")}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
