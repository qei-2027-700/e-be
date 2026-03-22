"use client";

import * as React from "react";
import { format, parse, isValid, type Locale } from "date-fns";
import { ja, enUS } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
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
  /** true にすると値が入っているときに X クリアボタンを表示する */
  clearable?: boolean;
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
  clearable = false,
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
    <div className="relative inline-flex">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-44 justify-start text-left font-normal",
                !selected && "text-muted-foreground",
                clearable && selected && "pr-8",
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

      {clearable && selected && (
        <button
          type="button"
          onClick={() => onChange?.("")}
          disabled={disabled}
          aria-label="日付をクリア"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
