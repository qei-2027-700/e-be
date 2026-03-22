"use client";

import * as React from "react";
import { format, parse, isValid, type Locale } from "date-fns";
import { ja, enUS } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DATE_FNS_LOCALES: Record<string, Locale> = { ja, en: enUS };

interface DatePickerProps {
  /** YYYY-MM-DD 形式の文字列 */
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  locale?: string;
  className?: string;
}

/**
 * 日付のみ（時刻なし）を選択するピッカー。
 * 値は YYYY-MM-DD 形式の文字列で受け渡す。
 * フィルター・検索フォームなど日付だけ必要な箇所で使用する。
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "日付を選択",
  disabled,
  locale = "ja",
  className,
}: DatePickerProps) {
  const dateFnsLocale = DATE_FNS_LOCALES[locale] ?? ja;
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  function handleSelect(date: Date | undefined) {
    onChange?.(date ? format(date, "yyyy-MM-dd") : "");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-44 justify-start text-left font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
        {selected ? (
          format(selected, "PPP", { locale: dateFnsLocale })
        ) : (
          <span>{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          initialFocus
          locale={dateFnsLocale}
        />
      </PopoverContent>
    </Popover>
  );
}
