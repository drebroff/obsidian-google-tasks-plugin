import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GoogleTasksApiClient } from "@/api";
import type { SubscriptionResult } from "@/data/index";
import { GoogleTasksAdapter, type OnSubscriptionChange } from "@/data/index";
import type { TaskQuery } from "@/query/schema/tasks";

const makeMockApi = (): GoogleTasksApiClient => {
  return {
    getTaskLists: vi.fn().mockResolvedValue([]),
    getTasks: vi.fn().mockResolvedValue([]),
    createTask: vi.fn(),
    patchTask: vi.fn(),
    completeTask: vi.fn(),
    uncompleteTask: vi.fn(),
    deleteTask: vi.fn(),
  } as unknown as GoogleTasksApiClient;
};

const baseQuery: TaskQuery = {
  list: "all",
  filter: { status: "all", due: "all" },
  sorting: "date",
  sortOrder: "asc",
  groupBy: "none",
  show: ["notes", "due", "list"],
};

describe("GoogleTasksAdapter", () => {
  let adapter: GoogleTasksAdapter;
  let mockApi: GoogleTasksApiClient;

  beforeEach(() => {
    adapter = new GoogleTasksAdapter();
    mockApi = makeMockApi();
  });

  describe("Subscription", () => {
    it("should deliver not-ready result when API is not initialized", async () => {
      let captured: SubscriptionResult = { type: "success", tasks: [] };
      const callback: OnSubscriptionChange = (r) => {
        captured = r;
      };

      const [, refresh] = adapter.subscribe(baseQuery, callback);
      await refresh();

      expect(captured.type).toBe("not-ready");
    });

    it("should deliver success result with tasks after sync", async () => {
      const taskList = { id: "list-1", title: "My Tasks", updated: new Date().toISOString() };
      const googleTask = {
        id: "task-1",
        title: "Test task",
        status: "needsAction" as const,
        position: "00000000000000000000",
        taskListId: "list-1",
        updated: new Date().toISOString(),
      };

      vi.mocked(mockApi.getTaskLists).mockResolvedValue([taskList]);
      vi.mocked(mockApi.getTasks).mockResolvedValue([googleTask]);

      await adapter.initialize(mockApi);

      const captured: { current: SubscriptionResult } = { current: { type: "not-ready" } };
      const callback: OnSubscriptionChange = (r) => {
        captured.current = r;
      };

      const [, refresh] = adapter.subscribe(baseQuery, callback);
      await refresh();

      expect(captured.current.type).toBe("success");
      if (captured.current.type !== "success") {
        return;
      }

      expect(captured.current.tasks).toHaveLength(1);
      expect(captured.current.tasks[0].id).toBe("task-1");
    });

    it("should toggle task status optimistically", async () => {
      const taskList = { id: "list-1", title: "My Tasks", updated: new Date().toISOString() };
      const googleTask = {
        id: "task-1",
        title: "Test task",
        status: "needsAction" as const,
        position: "00000000000000000000",
        taskListId: "list-1",
        updated: new Date().toISOString(),
      };

      vi.mocked(mockApi.getTaskLists).mockResolvedValue([taskList]);
      vi.mocked(mockApi.getTasks).mockResolvedValue([googleTask]);
      vi.mocked(mockApi.completeTask).mockResolvedValue({
        ...googleTask,
        status: "completed",
      });

      await adapter.initialize(mockApi);

      const captured: { current: SubscriptionResult } = { current: { type: "not-ready" } };
      const callback: OnSubscriptionChange = (r) => {
        captured.current = r;
      };

      const [, refresh] = adapter.subscribe(baseQuery, callback);
      await refresh();

      // Toggle task
      await adapter.actions.toggleTask("task-1", "needsAction");

      expect(captured.current.type).toBe("success");
      if (captured.current.type !== "success") {
        return;
      }

      expect(captured.current.tasks[0].status).toBe("completed");
    });
  });
});
