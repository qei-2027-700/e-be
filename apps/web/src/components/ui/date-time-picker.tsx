"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select } from "@/components/ui/select";

type Props = {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

const MINUTES = [0, 15, 30, 45];

function parseValue(iso: string | undefined): {
  date: Date | undefined;
  hour: string;
  minute: string;
} {
  if (!iso) return { date: undefined, hour: "", minute: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: undefined, hour: "", minute: "" };
  const snappedMinute = Math.floor(d.getMinutes() / 15) * 15;
  return {
    date: d,
    hour: String(d.getHours()),
    minute: String(snappedMinute),
  };
}

function buildValue(
  date: Date | undefined,
  hour: string,
  minute: string
): string {
  if (!date || hour === "" || minute === "") return "";
  const d = new Date(date);
  d.setHours(Number(hour), Number(minute), 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DateTimePicker({ name, value, onChange, disabled }: Props) {
  const t = useTranslations("date_time_picker");

  const parsed = React.useMemo(() => parseValue(value), [value]);
  const [date, setDate] = React.useState<Date | undefined>(parsed.date);
  const [hour, setHour] = React.useState(parsed.hour);
  const [minute, setMinute] = React.useState(parsed.minute);

  React.useEffect(() => {
    const p = parseValue(value);
    setDate(p.date);
    setHour(p.hour);
    setMinute(p.minute);
  }, [value]);

  const hiddenValue = buildValue(date, hour, minute);

  function handleDateSelect(d: Date | undefined) {
    setDate(d);
    onChange?.(buildValue(d, hour, minute));
  }

  function handleHourChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const h = e.target.value;
    setHour(h);
    onChange?.(buildValue(date, h, minute));
  }

  function handleMinuteChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const m = e.target.value;
    setMinute(m);
    onChange?.(buildValue(date, hour, m));
  }

  const displayText = date
    ? hour && minute
      ? `${format(date, "yyyy/MM/dd")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      : format(date, "yyyy/MM/dd")
    : t("placeholder");

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={hiddenValue} />
      <Popover>
        <PopoverTrigger
          type="button"
          disabled={disabled}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span>{displayText}</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
          />
          <div className="flex gap-2 border-t p-2">
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("hour")}</span>
              <Select
                value={hour}
                onChange={handleHourChange}
                disabled={!date || disabled}
              >
                <option value="">{t("select_placeholder")}</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={String(i)}>
                    {String(i).padStart(2, "0")}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {t("minute")}
              </span>
              <Select
                value={minute}
                onChange={handleMinuteChange}
                disabled={!date || disabled}
              >
                <option value="">{t("select_placeholder")}</option>
                {MINUTES.map((m) => (
                  <option key={m} value={String(m)}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
