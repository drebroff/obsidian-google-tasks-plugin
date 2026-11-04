import type { TaskList } from "@/api/domain/taskList";
import type { DueDate } from "@/data/dueDate";

export type TaskId = string;

export type Task = {
  id: TaskId;
  content: string;
  description: string;
  taskList: TaskList;
  status: "needsAction" | "completed";
  due?: DueDate;
  position: string;
  completed?: string;
  order: number;
};
