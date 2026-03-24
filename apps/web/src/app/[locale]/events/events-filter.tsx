"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { AREA_KEYS, AREA_REGIONS, type AreaKey } from "@/lib/area-regions";

type Props = {
  defaultArea?: string;
  defaultLine?: string;
  availableLines?: string[];
};

export function EventsFilter({ defaultArea, defaultLine, availableLines = [] }: Props) {
  const t = useTranslations("events");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [area, setArea] = useState(defaultArea ?? "");
  const [line, setLine] = useState(defaultLine ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (area) params.set("area", area);
    if (line) params.set("line", line);
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  function handleReset() {
    setArea("");
    setLine("");
    startTransition(() => {
      router.push("?");
    });
  }

  const hasFilters = searchParams.get("area") || searchParams.get("line");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("filter_area")}</label>
        <Select value={area} onValueChange={(val) => setArea(val ?? "")}>
          <SelectTrigger className="w-full sm:w-40" size="lg">
            <SelectValue>
              {area ? AREA_REGIONS[area as AreaKey]?.label : "—"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {AREA_KEYS.map((key) => (
              <SelectItem key={key} value={key}>{AREA_REGIONS[key].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {false && availableLines.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("filter_line")}</label>
          <Select value={line || undefined} onValueChange={(val) => setLine(val ?? "")}>
            <SelectTrigger className="w-full sm:w-48" size="lg">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {availableLines.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t("filter_searching")}
            </span>
          ) : (
            t("filter_search")
          )}
        </Button>
        {hasFilters && !isPending && (
          <Button type="button" variant="outline" onClick={handleReset}>
            {t("filter_reset")}
          </Button>
        )}
      </div>
    </form>
  );
}
