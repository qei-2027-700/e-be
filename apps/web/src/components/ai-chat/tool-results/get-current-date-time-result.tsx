"use client";

import { Clock } from "lucide-react";

type Output = { datetime: string; timezone: string };
type Props = { output: Output };

export function GetCurrentDateTimeResult({ output }: Props) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
      <Clock className="size-3" />
      <span>{output.datetime}</span>
    </div>
  );
}
