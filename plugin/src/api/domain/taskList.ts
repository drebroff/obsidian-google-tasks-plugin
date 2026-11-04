import { z } from "zod";

export const taskListIdSchema = z.string();
export type TaskListId = z.infer<typeof taskListIdSchema>;

export const taskListSchema = z.object({
  id: taskListIdSchema,
  title: z.string(),
  updated: z.string().optional(),
});

export type TaskList = z.infer<typeof taskListSchema>;

export const taskListsResponseSchema = z.object({
  kind: z.string().optional(),
  items: z.array(taskListSchema).default([]),
  nextPageToken: z.string().optional(),
});

