import type { Task } from "@/data/task";

export type TaskTree = Task & { children: TaskTree[] };

export function buildTaskTree(tasks: Task[]): TaskTree[] {
  return tasks.map((task) => ({
    ...task,
    children: [],
  }));
}
