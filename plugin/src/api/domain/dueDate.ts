import { z } from "zod";

export const dueDateSchema = z.object({
  isRecurring: z.boolean().default(false),
  date: z.string(),
});

export type DueDate = z.infer<typeof dueDateSchema>;
