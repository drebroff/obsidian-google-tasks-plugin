import type { TaskList } from "@/api/domain/taskList";
import type { Task } from "@/data/task";

const defaultTaskList: TaskList = {
  id: "list-default",
  title: "My Tasks",
};

export function makeTask(id: string, opts?: Partial<Task>): Task {
  return {
    id,
    content: opts?.content ?? "",
    description: opts?.description ?? "",
    taskList: opts?.taskList ?? defaultTaskList,
    status: opts?.status ?? "needsAction",
    due: opts?.due,
    position: opts?.position ?? "00000000000000000000",
    completed: opts?.completed,
    order: opts?.order ?? 0,
  };
}

export function makeTaskList(id: string, opts?: Partial<TaskList>): TaskList {
  return {
    id,
    title: opts?.title ?? "Task List",
    updated: opts?.updated,
  };
}
