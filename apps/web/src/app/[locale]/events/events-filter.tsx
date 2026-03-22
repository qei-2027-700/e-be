"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useTranslations } from "next-intl";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

type Props = {
  defaultDate?: string;
  defaultPrefecture?: string;
  defaultLine?: string;
};

export function EventsFilter({ defaultDate, defaultPrefecture, defaultLine }: Props) {
  const t = useTranslations("events");
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateRef = useRef<HTMLInputElement>(null);
  const lineRef = useRef<HTMLInputElement>(null);
  const prefectureRef = useRef<HTMLSelectElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    const date = dateRef.current?.value;
    const line = lineRef.current?.value;
    const prefecture = prefectureRef.current?.value;
    if (date) params.set("date", date);
    if (prefecture) params.set("prefecture", prefecture);
    if (line) params.set("line", line);
    router.push(`?${params.toString()}`);
  }

  function handleReset() {
    router.push("?");
  }

  const hasFilters = searchParams.get("date") || searchParams.get("prefecture") || searchParams.get("line");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("filter_date")}</label>
        <Input
          ref={dateRef}
          type="date"
          defaultValue={defaultDate}
          className="w-full sm:w-44"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("filter_prefecture")}</label>
        <Select
          ref={prefectureRef}
          defaultValue={defaultPrefecture ?? ""}
          className="w-full sm:w-40"
        >
          <option value="">—</option>
          {PREFECTURES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("filter_line")}</label>
        <Input
          ref={lineRef}
          type="text"
          placeholder="例: 山手線"
          defaultValue={defaultLine}
          className="w-full sm:w-44"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">{t("filter_search")}</Button>
        {hasFilters && (
          <Button type="button" variant="outline" onClick={handleReset}>
            {t("filter_reset")}
          </Button>
        )}
      </div>
    </form>
  );
}
