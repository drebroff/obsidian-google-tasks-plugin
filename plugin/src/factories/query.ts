import type { TaskQuery } from "@/query/schema/tasks";

export function makeQuery(opts?: Partial<TaskQuery>): TaskQuery {
  return {
    name: opts?.name,
    list: opts?.list ?? "all",
    filter: opts?.filter ?? { status: "needsAction", due: "all" },
    autorefresh: opts?.autorefresh,
    sorting: opts?.sorting ?? "date",
    sortOrder: opts?.sortOrder ?? "asc",
    show: opts?.show ?? ["notes", "due"],
    groupBy: opts?.groupBy ?? "none",
    limit: opts?.limit,
    view: opts?.view,
  };
}
