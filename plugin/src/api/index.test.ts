import { describe, expect, it, vi } from "vitest";

import type { RequestParams, WebFetcher, WebResponse } from "@/api/fetcher";
import { GoogleTasksApiClient } from "@/api/index";

function parseUrl(url: string) {
  const parsed = new URL(url);
  return { pathname: parsed.pathname, params: parsed.searchParams };
}

function makeGoogleTask(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "task-1",
    title: "Test task",
    status: "needsAction",
    position: "00000000000000000000",
    ...overrides,
  };
}

function makeTaskListResponse(items: Record<string, unknown>[]): WebResponse {
  return {
    statusCode: 200,
    body: JSON.stringify({ kind: "tasks#taskLists", items }),
  };
}

function makeTasksResponse(items: Record<string, unknown>[]): WebResponse {
  return {
    statusCode: 200,
    body: JSON.stringify({ kind: "tasks#tasks", items }),
  };
}

function makeFetcher(): WebFetcher & {
  fetch: ReturnType<typeof vi.fn<(params: RequestParams) => Promise<WebResponse>>>;
} {
  return { fetch: vi.fn<(params: RequestParams) => Promise<WebResponse>>() };
}

const TEST_LIST_ID = "list-abc";

describe("GoogleTasksApiClient", () => {
  describe("getTaskLists", () => {
    it("calls /users/@me/lists and returns parsed task lists", async () => {
      const fetcher = makeFetcher();
      fetcher.fetch.mockResolvedValueOnce(
        makeTaskListResponse([{ id: "list-1", title: "My Tasks" }]),
      );

      const client = new GoogleTasksApiClient(async () => "test-token", fetcher);
      const lists = await client.getTaskLists();

      expect(lists).toHaveLength(1);
      expect(lists[0].id).toBe("list-1");
      expect(lists[0].title).toBe("My Tasks");

      const call = fetcher.fetch.mock.calls[0][0];
      const { pathname } = parseUrl(call.url);
      expect(pathname).toBe("/tasks/v1/users/@me/lists");
    });

    it("returns empty array when no lists", async () => {
      const fetcher = makeFetcher();
      fetcher.fetch.mockResolvedValueOnce(makeTaskListResponse([]));

      const client = new GoogleTasksApiClient(async () => "test-token", fetcher);
      const lists = await client.getTaskLists();

      expect(lists).toHaveLength(0);
    });
  });

  describe("getTasks", () => {
    it("calls /lists/{taskListId}/tasks and returns tasks with taskListId", async () => {
      const fetcher = makeFetcher();
      fetcher.fetch.mockResolvedValueOnce(
        makeTasksResponse([makeGoogleTask({ id: "task-1" }), makeGoogleTask({ id: "task-2" })]),
      );

      const client = new GoogleTasksApiClient(async () => "test-token", fetcher);
      const tasks = await client.getTasks(TEST_LIST_ID);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].taskListId).toBe(TEST_LIST_ID);
      expect(tasks[1].taskListId).toBe(TEST_LIST_ID);

      const call = fetcher.fetch.mock.calls[0][0];
      const { pathname } = parseUrl(call.url);
      expect(pathname).toBe(`/tasks/v1/lists/${TEST_LIST_ID}/tasks`);
    });

    it("returns empty array when no tasks", async () => {
      const fetcher = makeFetcher();
      fetcher.fetch.mockResolvedValueOnce(makeTasksResponse([]));

      const client = new GoogleTasksApiClient(async () => "test-token", fetcher);
      const tasks = await client.getTasks(TEST_LIST_ID);

      expect(tasks).toHaveLength(0);
    });

    it("passes showCompleted and showHidden query params", async () => {
      const fetcher = makeFetcher();
      fetcher.fetch.mockResolvedValueOnce(makeTasksResponse([]));

      const client = new GoogleTasksApiClient(async () => "test-token", fetcher);
      await client.getTasks(TEST_LIST_ID, { showCompleted: false, showHidden: false });

      const call = fetcher.fetch.mock.calls[0][0];
      const { params } = parseUrl(call.url);
      expect(params.get("showCompleted")).toBe("false");
      expect(params.get("showHidden")).toBe("false");
    });
  });

  describe("createTask", () => {
    it("sends POST with correct body and returns created task", async () => {
      const fetcher = makeFetcher();
      fetcher.fetch.mockResolvedValueOnce({
        statusCode: 200,
        body: JSON.stringify(makeGoogleTask({ id: "new-task", title: "Buy milk" })),
      });

      const client = new GoogleTasksApiClient(async () => "test-token", fetcher);
      const task = await client.createTask(TEST_LIST_ID, "Buy milk");

      expect(task.title).toBe("Buy milk");
      expect(task.taskListId).toBe(TEST_LIST_ID);

      const call = fetcher.fetch.mock.calls[0][0];
      expect(call.method).toBe("POST");
      const { pathname } = parseUrl(call.url);
      expect(pathname).toBe(`/tasks/v1/lists/${TEST_LIST_ID}/tasks`);

      const body = JSON.parse(call.body as string);
      expect(body.title).toBe("Buy milk");
    });

    it("includes due date when provided", async () => {
      const fetcher = makeFetcher();
      fetcher.fetch.mockResolvedValueOnce({
        statusCode: 200,
        body: JSON.stringify(makeGoogleTask({ due: "2026-11-01T00:00:00.000Z" })),
      });

      const client = new GoogleTasksApiClient(async () => "test-token", fetcher);
      await client.createTask(TEST_LIST_ID, "Task with due", { due: "2026-11-01T00:00:00.000Z" });

      const call = fetcher.fetch.mock.calls[0][0];
      const body = JSON.parse(call.body as string);
      expect(body.due).toBe("2026-11-01T00:00:00.000Z");
    });
  });

  describe("completeTask / uncompleteTask", () => {
    it("sends PATCH with status=completed for completeTask", async () => {
      const fetcher = makeFetcher();
      fetcher.fetch.mockResolvedValueOnce({
        statusCode: 200,
        body: JSON.stringify(makeGoogleTask({ status: "completed" })),
      });

      const client = new GoogleTasksApiClient(async () => "test-token", fetcher);
      const task = await client.completeTask(TEST_LIST_ID, "task-1");

      expect(task.status).toBe("completed");

      const call = fetcher.fetch.mock.calls[0][0];
      expect(call.method).toBe("PATCH");
      const body = JSON.parse(call.body as string);
      expect(body.status).toBe("completed");
    });

    it("sends PATCH with status=needsAction for uncompleteTask", async () => {
      const fetcher = makeFetcher();
      fetcher.fetch.mockResolvedValueOnce({
        statusCode: 200,
        body: JSON.stringify(makeGoogleTask({ status: "needsAction" })),
      });

      const client = new GoogleTasksApiClient(async () => "test-token", fetcher);
      const task = await client.uncompleteTask(TEST_LIST_ID, "task-1");

      expect(task.status).toBe("needsAction");

      const call = fetcher.fetch.mock.calls[0][0];
      expect(call.method).toBe("PATCH");
      const body = JSON.parse(call.body as string);
      expect(body.status).toBe("needsAction");
    });
  });

  describe("deleteTask", () => {
    it("sends DELETE request", async () => {
      const fetcher = makeFetcher();
      fetcher.fetch.mockResolvedValueOnce({ statusCode: 204, body: "" });

      const client = new GoogleTasksApiClient(async () => "test-token", fetcher);
      await client.deleteTask(TEST_LIST_ID, "task-1");

      const call = fetcher.fetch.mock.calls[0][0];
      expect(call.method).toBe("DELETE");
      const { pathname } = parseUrl(call.url);
      expect(pathname).toBe(`/tasks/v1/lists/${TEST_LIST_ID}/tasks/task-1`);
    });
  });

  describe("authorization", () => {
    it("includes Bearer token in Authorization header", async () => {
      const fetcher = makeFetcher();
      fetcher.fetch.mockResolvedValueOnce(makeTaskListResponse([]));

      const client = new GoogleTasksApiClient(async () => "my-secret-token", fetcher);
      await client.getTaskLists();

      const call = fetcher.fetch.mock.calls[0][0];
      expect(call.headers.Authorization).toBe("Bearer my-secret-token");
    });
  });

  describe("error handling", () => {
    it("throws on 4xx error", async () => {
      const fetcher = makeFetcher();
      fetcher.fetch.mockResolvedValueOnce({ statusCode: 401, body: "Unauthorized" });

      const client = new GoogleTasksApiClient(async () => "test-token", fetcher);
      await expect(client.getTaskLists()).rejects.toThrow("401");
    });

    it("throws on 5xx error", async () => {
      const fetcher = makeFetcher();
      fetcher.fetch.mockResolvedValueOnce({ statusCode: 500, body: "Server Error" });

      const client = new GoogleTasksApiClient(async () => "test-token", fetcher);
      await expect(client.getTaskLists()).rejects.toThrow("500");
    });
  });
});
