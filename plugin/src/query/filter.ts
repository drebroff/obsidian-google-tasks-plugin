import type { Task } from "@/data/task";
import type { TaskQuery } from "@/query/schema/tasks";

export function filterAndSortTasks(tasks: Task[], query: TaskQuery): Task[] {
  let filtered = tasks.filter((task) => {
    // 1. List filter
    if (query.list && query.list !== "all") {
      const allowedLists = Array.isArray(query.list) ? query.list : [query.list];
      const match = allowedLists.some(
        (l) => l.toLowerCase() === task.taskList.title.toLowerCase() || l === task.taskList.id,
      );
      if (!match) {
        return false;
      }
    }

    // 2. Status filter
    const statusFilter = query.filter?.status ?? "needsAction";
    if (statusFilter !== "all" && task.status !== statusFilter) {
      return false;
    }

    // 3. Due date filter
    const dueFilter = query.filter?.due ?? "all";
    if (dueFilter !== "all") {
      if (dueFilter === "no-date") {
        if (task.due !== undefined) {
          return false;
        }
      } else if (task.due) {
        const { isOverdue, flag } = task.due.start;
        switch (dueFilter) {
          case "today":
            if (flag !== "today") {
              return false;
            }
            break;
          case "overdue":
            if (!isOverdue) {
              return false;
            }
            break;
          case "today-and-overdue":
            if (flag !== "today" && !isOverdue) {
              return false;
            }
            break;
          case "upcoming":
            if (isOverdue || flag === "today") {
              return false;
            }
            break;
          default:
            break;
        }
      } else {
        return false;
      }
    }

    // 4. Search query
    if (query.filter?.search) {
      const search = query.filter.search.toLowerCase();
      const titleMatch = task.content.toLowerCase().includes(search);
      const notesMatch = task.description.toLowerCase().includes(search);
      if (!titleMatch && !notesMatch) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  const sorting = query.sorting ?? "date";
  const isAsc = (query.sortOrder ?? "asc") === "asc";

  filtered.sort((a, b) => {
    let cmp = 0;
    if (sorting === "title") {
      cmp = a.content.localeCompare(b.content);
    } else if (sorting === "my-order") {
      cmp = a.position.localeCompare(b.position);
    } else if (!a.due && !b.due) {
      // date
      cmp = a.position.localeCompare(b.position);
    } else if (!a.due) {
      cmp = 1;
    } else if (b.due) {
      cmp = a.due.start.raw.getTime() - b.due.start.raw.getTime();
    } else {
      cmp = -1;
    }
    return isAsc ? cmp : -cmp;
  });

  if (query.limit && query.limit > 0) {
    filtered = filtered.slice(0, query.limit);
  }

  return filtered;
}
