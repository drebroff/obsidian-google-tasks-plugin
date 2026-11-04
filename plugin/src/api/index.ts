import { type GoogleTask, googleTaskSchema, tasksResponseSchema } from "@/api/domain/googleTask";
import { type TaskList, taskListsResponseSchema } from "@/api/domain/taskList";
import { type RequestParams, StatusCode, type WebFetcher } from "@/api/fetcher";
import { parseApiResponse } from "@/api/validation";

const GOOGLE_TASKS_BASE_URL = "https://tasks.googleapis.com/tasks/v1";

export class GoogleTasksApiClient {
  private readonly getAccessToken: () => Promise<string>;
  private readonly fetcher: WebFetcher;

  constructor(getAccessToken: () => Promise<string>, fetcher: WebFetcher) {
    this.getAccessToken = getAccessToken;
    this.fetcher = fetcher;
  }

  public async getTaskLists(): Promise<TaskList[]> {
    const response = await this.request("/users/@me/lists", "GET");
    const parsed = parseApiResponse(taskListsResponseSchema, response.body);
    return parsed.items;
  }

  public async getTasks(
    taskListId: string,
    options: { showCompleted?: boolean; showHidden?: boolean } = {
      showCompleted: true,
      showHidden: false,
    },
  ): Promise<GoogleTask[]> {
    const queryParams: Record<string, string> = {
      maxResults: "100",
    };
    if (options.showCompleted !== undefined) {
      queryParams.showCompleted = String(options.showCompleted);
    }
    if (options.showHidden !== undefined) {
      queryParams.showHidden = String(options.showHidden);
    }

    const response = await this.request(`/lists/${encodeURIComponent(taskListId)}/tasks`, "GET", {
      queryParams,
    });
    const parsed = parseApiResponse(tasksResponseSchema, response.body);
    return parsed.items.map((task) => ({
      ...task,
      taskListId,
    }));
  }

  public async createTask(
    taskListId: string,
    title: string,
    options?: { notes?: string; due?: string },
  ): Promise<GoogleTask> {
    const body: Record<string, unknown> = {
      title,
      status: "needsAction",
      ...(options?.notes ? { notes: options.notes } : {}),
      ...(options?.due ? { due: options.due } : {}),
    };

    const response = await this.request(`/lists/${encodeURIComponent(taskListId)}/tasks`, "POST", {
      json: body,
    });
    const parsed = parseApiResponse(googleTaskSchema, response.body);
    return {
      ...parsed,
      taskListId,
    };
  }

  public async patchTask(
    taskListId: string,
    taskId: string,
    patch: Record<string, unknown>,
  ): Promise<GoogleTask> {
    const response = await this.request(
      `/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
      "PATCH",
      { json: patch },
    );
    const parsed = parseApiResponse(googleTaskSchema, response.body);
    return {
      ...parsed,
      taskListId,
    };
  }

  public async completeTask(taskListId: string, taskId: string): Promise<GoogleTask> {
    return await this.patchTask(taskListId, taskId, {
      status: "completed",
    });
  }

  public async uncompleteTask(taskListId: string, taskId: string): Promise<GoogleTask> {
    return await this.patchTask(taskListId, taskId, {
      status: "needsAction",
      completed: null,
    });
  }

  public async deleteTask(taskListId: string, taskId: string): Promise<void> {
    await this.request(
      `/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
      "DELETE",
    );
  }

  private async request(
    path: string,
    method: string,
    options?: {
      json?: unknown;
      queryParams?: Record<string, string>;
    },
  ) {
    const token = await this.getAccessToken();
    let url = `${GOOGLE_TASKS_BASE_URL}${path}`;

    if (options?.queryParams) {
      const searchParams = new URLSearchParams(options.queryParams);
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const params: RequestParams = {
      url,
      method,
      headers,
      body: options?.json !== undefined ? JSON.stringify(options.json) : undefined,
    };

    const response = await this.fetcher.fetch(params);

    if (StatusCode.isError(response.statusCode)) {
      throw new Error(`Google Tasks API error (${response.statusCode}): ${response.body}`);
    }

    return response;
  }
}
