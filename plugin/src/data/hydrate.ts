import type { GoogleTask } from "@/api/domain/googleTask";
import type { TaskList, TaskListId } from "@/api/domain/taskList";
import { DueDate } from "@/data/dueDate";
import type { RepositoryReader } from "@/data/repository";
import type { Task } from "@/data/task";

export type DataAccessor = {
  taskLists: RepositoryReader<TaskListId, TaskList>;
};

export function hydrate(apiTask: GoogleTask, data: DataAccessor, order = 0): Task {
  const taskList = data.taskLists.byId(apiTask.taskListId) ?? {
    id: apiTask.taskListId,
    title: "Unknown List",
  };

  const due = apiTask.due ? DueDate.parse({ date: apiTask.due, isRecurring: false }) : undefined;

  return {
    id: apiTask.id,
    content: apiTask.title,
    description: apiTask.notes ?? "",
    taskList,
    status: apiTask.status,
    due,
    position: apiTask.position ?? "",
    completed: apiTask.completed,
    order,
  };
}
