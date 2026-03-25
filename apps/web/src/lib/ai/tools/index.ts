import { writePlanTool } from "./write-plan";
import { getCurrentDateTimeTool } from "./get-current-date-time";
import { createListBarsTool } from "./list-bars";
import { createCreateEventTool } from "./create-event";
import type { getDbUser } from "@/lib/auth";

type DbUser = Awaited<ReturnType<typeof getDbUser>>;

export const createTools = (dbUser: DbUser) => ({
  writePlan: writePlanTool,
  getCurrentDateTime: getCurrentDateTimeTool,
  listBars: createListBarsTool(dbUser),
  createEvent: createCreateEventTool(dbUser),
});
