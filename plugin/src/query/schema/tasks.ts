import { z } from "zod/v4";

import type { QueryDefinition } from "@/query/schema/query";

export const taskQuerySchema = z.object({
  name: z.string().optional(),
  list: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .default("all"),
  filter: z
    .object({
      status: z.enum(["needsAction", "completed", "all"]).optional().default("needsAction"),
      due: z
        .enum(["today", "overdue", "today-and-overdue", "upcoming", "no-date", "all"])
        .optional()
        .default("all"),
      search: z.string().optional(),
    })
    .optional()
    .default({ status: "needsAction", due: "all" }),
  sorting: z.enum(["date", "my-order", "title"]).optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  groupBy: z.enum(["none", "list", "date"]).optional().default("none"),
  show: z
    .array(z.enum(["notes", "due", "list"]))
    .optional()
    .default(["notes", "due", "list"]),
  limit: z.number().positive().optional(),
  view: z
    .object({
      hideNoTasks: z.boolean().optional(),
      noTasksMessage: z.string().optional(),
    })
    .optional(),
});

export type TaskQuery = z.infer<typeof taskQuerySchema>;

const generateWarnings = (_query: TaskQuery): string[] => {
  return [];
};

export const taskQueryDefinition: QueryDefinition<typeof taskQuerySchema> = {
  schema: taskQuerySchema,
  generateWarnings,
};
