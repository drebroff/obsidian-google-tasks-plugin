import type { GoogleTasksApiClient } from "@/api";
import type { GoogleTask } from "@/api/domain/googleTask";
import type { TaskList, TaskListId } from "@/api/domain/taskList";
import { mapApiError, QueryErrorKind } from "@/data/errors";
import { type DataAccessor, hydrate } from "@/data/hydrate";
import { Repository } from "@/data/repository";
import {
  type OnSubscriptionChange,
  type Refresh,
  SubscriptionManager,
  type SubscriptionResult,
  type UnsubscribeCallback,
} from "@/data/subscriptions";
import type { Task, TaskId } from "@/data/task";
import { filterAndSortTasks } from "@/query/filter";
import type { TaskQuery } from "@/query/schema/tasks";
import { Maybe } from "@/utils/maybe";

export { QueryErrorKind } from "@/data/errors";
export type { OnSubscriptionChange, Refresh, SubscriptionResult } from "@/data/subscriptions";

type Subscription = {
  query: TaskQuery;
  callback: OnSubscriptionChange;
  update: () => Promise<void>;
};

export class GoogleTasksAdapter {
  private readonly api: Maybe<GoogleTasksApiClient> = Maybe.Empty();
  private readonly taskLists: Repository<TaskListId, TaskList> = new Repository<
    TaskListId,
    TaskList
  >();
  private readonly tasks: Map<TaskId, GoogleTask> = new Map();
  private readonly subscriptions: SubscriptionManager<Subscription> =
    new SubscriptionManager<Subscription>();

  private hasSynced = false;

  public actions = {
    toggleTask: async (id: TaskId, currentStatus: "needsAction" | "completed") => {
      const task = this.tasks.get(id);
      if (!task) return;

      const newStatus = currentStatus === "needsAction" ? "completed" : "needsAction";
      // Optimistic update
      const updated: GoogleTask = { ...task, status: newStatus };
      this.tasks.set(id, updated);
      this.notifySubscriptions();

      try {
        await this.api.withInner(async (api) => {
          if (newStatus === "completed") {
            await api.completeTask(task.taskListId, id);
          } else {
            await api.uncompleteTask(task.taskListId, id);
          }
        });
      } catch (err) {
        // Rollback
        this.tasks.set(id, task);
        this.notifySubscriptions();
        throw err;
      }
    },

    createTask: async (
      taskListId: TaskListId,
      title: string,
      options?: { notes?: string; due?: string },
    ): Promise<Task> => {
      const created = await this.api.withInner(async (api) => {
        return await api.createTask(taskListId, title, options);
      });
      this.tasks.set(created.id, created);
      this.notifySubscriptions();
      return hydrate(created, this.data());
    },

    deleteTask: async (taskListId: TaskListId, taskId: TaskId): Promise<void> => {
      const prev = this.tasks.get(taskId);
      this.tasks.delete(taskId);
      this.notifySubscriptions();
      try {
        await this.api.withInner((api) => api.deleteTask(taskListId, taskId));
      } catch (err) {
        if (prev) this.tasks.set(taskId, prev);
        this.notifySubscriptions();
        throw err;
      }
    },
  };

  public isReady(): boolean {
    return this.api.hasValue() && this.hasSynced;
  }

  public async initialize(api: GoogleTasksApiClient) {
    this.api.insert(api);
    await this.sync();
  }

  public async sync(): Promise<void> {
    if (!this.api.hasValue()) {
      return;
    }

    try {
      const lists = await this.api.withInner((api) => api.getTaskLists());
      this.taskLists.replaceAll(lists);

      const allTasks: GoogleTask[] = [];
      await Promise.all(
        lists.map(async (list) => {
          try {
            const listTasks = await this.api.withInner((api) =>
              api.getTasks(list.id, { showCompleted: true, showHidden: false }),
            );
            allTasks.push(...listTasks);
          } catch (err) {
            console.error(`Failed to fetch tasks for list ${list.title}:`, err);
          }
        }),
      );

      this.tasks.clear();
      for (const t of allTasks) {
        this.tasks.set(t.id, t);
      }

      this.hasSynced = true;
      console.log(`Google Tasks: Synced ${allTasks.length} tasks`);
      this.notifySubscriptions();
    } catch (error) {
      console.error("Failed to sync Google Tasks:", error);
      for (const sub of this.subscriptions.list()) {
        sub.callback({
          type: "error",
          kind: mapApiError(error),
        });
      }
    }
  }

  public data(): DataAccessor {
    return {
      taskLists: this.taskLists,
    };
  }

  public getTaskLists(): TaskList[] {
    return Array.from(this.taskLists.iter());
  }

  public subscribe(
    query: TaskQuery,
    callback: OnSubscriptionChange,
  ): [UnsubscribeCallback, Refresh] {
    const update = async () => {
      if (!this.hasSynced) {
        callback({ type: "not-ready" });
        await this.sync();
        return;
      }

      console.log("Google Tasks: Refreshing...");
      await this.sync();
      const hydrated = this.getHydratedTasks();
      const filtered = filterAndSortTasks(hydrated, query);
      callback({ type: "success", tasks: filtered });
    };

    const sub: Subscription = { query, callback, update };
    const unsub = this.subscriptions.subscribe(sub);

    update();

    return [unsub, update];
  }

  private getHydratedTasks(): Task[] {
    const data = this.data();
    const result: Task[] = [];
    let order = 0;
    for (const t of this.tasks.values()) {
      result.push(hydrate(t, data, order++));
    }
    return result;
  }

  private notifySubscriptions(): void {
    const hydrated = this.getHydratedTasks();
    for (const sub of this.subscriptions.list()) {
      const filtered = filterAndSortTasks(hydrated, sub.query);
      sub.callback({ type: "success", tasks: filtered });
    }
  }
}
