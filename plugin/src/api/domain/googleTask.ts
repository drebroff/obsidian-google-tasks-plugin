import { z } from "zod";

export const taskIdSchema = z.string();
export type TaskId = z.infer<typeof taskIdSchema>;

export const taskStatusSchema = z.enum(["needsAction", "completed"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const googleTaskSchema = z.object({
  id: taskIdSchema,
  title: z.string().default(""),
  updated: z.string().optional(),
  notes: z.string().optional(),
  status: taskStatusSchema.default("needsAction"),
  due: z.string().optional(),
  completed: z.string().optional(),
  deleted: z.boolean().optional(),
  hidden: z.boolean().optional(),
  position: z.string().optional(),
});

export type GoogleTask = z.infer<typeof googleTaskSchema> & {
  taskListId: string;
};

export const tasksResponseSchema = z.object({
  kind: z.string().optional(),
  items: z.array(googleTaskSchema).default([]),
  nextPageToken: z.string().optional(),
});
