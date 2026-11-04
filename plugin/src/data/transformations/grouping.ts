import { DueDate } from "@/data/dueDate";
import type { Task } from "@/data/task";

export type GroupedTasks = {
  header: string;
  tasks: Task[];
};

export function groupBy(tasks: Task[], key: "none" | "list" | "date"): GroupedTasks[] {
  switch (key) {
    case "list":
      return groupByList(tasks);
    case "date":
      return groupByDate(tasks);
    default:
      return [{ header: "", tasks }];
  }
}

function groupByList(tasks: Task[]): GroupedTasks[] {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    const listTitle = t.taskList.title;
    const existing = map.get(listTitle) ?? [];
    existing.push(t);
    map.set(listTitle, existing);
  }

  return Array.from(map.entries()).map(([header, tasks]) => ({
    header,
    tasks,
  }));
}

function groupByDate(tasks: Task[]): GroupedTasks[] {
  const map = new Map<string, Task[]>();

  for (const t of tasks) {
    let header = "No Due Date";
    if (t.due) {
      if (t.due.start.isOverdue && t.status === "needsAction") {
        header = "Overdue";
      } else if (t.due.start.flag === "today") {
        header = "Today";
      } else if (t.due.start.flag === "tomorrow") {
        header = "Tomorrow";
      } else {
        header = DueDate.formatHeader(t.due);
      }
    }
    const existing = map.get(header) ?? [];
    existing.push(t);
    map.set(header, existing);
  }

  return Array.from(map.entries()).map(([header, tasks]) => ({
    header,
    tasks,
  }));
}
