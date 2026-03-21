"use client";

import * as React from "react";
import { format, parseISO, isValid, setHours, setMinutes, startOfMinute } from "date-fns";
import { ja, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select } from "@/components/ui/select";

interface DateTimePickerProps {
  id?: string;
  value?: string; // ISO string
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  locale?: string;
}

const locales: Record<string, any> = {
  ja: ja,
  en: enUS,
};

export function DateTimePicker({
  id,
  value,
  onChange,
  name,
  placeholder = "Pick a date",
  disabled,
  locale = "ja",
}: DateTimePickerProps) {
  const datePickerLocale = locales[locale] || ja;

  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(
    value ? parseISO(value) : undefined
  );

  // 初回レンダリング時や value 変更時に内部状態を同期
  React.useEffect(() => {
    if (value) {
      const parsed = parseISO(value);
      if (isValid(parsed)) {
        setDate(parsed);
      }
    } else {
      setDate(undefined);
    }
  }, [value]);

  const hour = date ? date.getHours() : 0;
  const minute = date ? date.getMinutes() : 0;

  const updateDateTime = (newDate: Date | undefined, newHour: number, newMinute: number) => {
    if (!newDate) {
      setDate(undefined);
      onChange?.("");
      return;
    }

    const updated = setHours(setMinutes(startOfMinute(newDate), newMinute), newHour);
    setDate(updated);
    onChange?.(updated.toISOString());
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    updateDateTime(selectedDate, hour, minute);
    setOpen(false);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = parseInt(e.target.value, 10);
    if (date) {
      updateDateTime(date, newHour, minute);
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = parseInt(e.target.value, 10);
    if (date) {
      updateDateTime(date, hour, newMinute);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                id={id}
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
                disabled={disabled}
              />
            }
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date && isValid(date) ? (
              format(date, "PPP", { locale: datePickerLocale })
            ) : (
              <span>{placeholder}</span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              locale={datePickerLocale}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1">
          <Select
            value={hour}
            onChange={handleHourChange}
            className="w-[64px]"
            disabled={disabled || !date}
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <option key={i} value={i}>
                {i.toString().padStart(2, "0")}
              </option>
            ))}
          </Select>
          <span className="text-muted-foreground">:</span>
          <Select
            value={minute}
            onChange={handleMinuteChange}
            className="w-[64px]"
            disabled={disabled || !date}
          >
            {[0, 15, 30, 45].map((m) => (
              <option key={m} value={m}>
                {m.toString().padStart(2, "0")}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {name && (
        <input
          type="hidden"
          name={name}
          value={date && isValid(date) ? date.toISOString() : ""}
        />
      )}
    </div>
  );
}
