import React from "react";
import { WritePlanResult } from "./write-plan-result";
import { GetCurrentDateTimeResult } from "./get-current-date-time-result";
import { CreateEventResult } from "./create-event-result";

// ツール名 → コンポーネント のレジストリ
// output の型は各コンポーネント側で管理するため unknown で受け取る
export const toolResultRegistry: Record<
  string,
  React.ComponentType<{ output: unknown }>
> = {
  "tool-writePlan": WritePlanResult as React.ComponentType<{ output: unknown }>,
  "tool-getCurrentDateTime": GetCurrentDateTimeResult as React.ComponentType<{
    output: unknown;
  }>,
  "tool-createEvent": CreateEventResult as React.ComponentType<{
    output: unknown;
  }>,
};
