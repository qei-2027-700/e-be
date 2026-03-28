import React from "react";
import { WritePlanResult } from "./write-plan-result";
import { GetCurrentDateTimeResult } from "./get-current-date-time-result";
import { CreateEventResult } from "./create-event-result";
import { UpdateEventResult } from "./update-event-result";
import { SubmitEventResult } from "./submit-event-result";

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
  "tool-updateEvent": UpdateEventResult as React.ComponentType<{
    output: unknown;
  }>,
  "tool-submitEvent": SubmitEventResult as React.ComponentType<{
    output: unknown;
  }>,
  // tool-listEvents と tool-listBars は中間ツールなので UI 表示なし
};
