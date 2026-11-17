import { describe, expect, it } from "vitest";

import type { GoogleTask, TaskLink } from "@/api/domain/googleTask";
import { googleTaskSchema } from "@/api/domain/googleTask";
import { parseApiResponse } from "@/api/validation";
import { hydrate } from "@/data/hydrate";

const apiTask: GoogleTask = {
  id: "task-1",
  title: "Fwd: Meeting",
  status: "needsAction",
  notes: "hello",
  position: "0",
  taskListId: "list-1",
  links: [
    {
      type: "email",
      description: "Fwd: Meeting",
      link: "https://mail.google.com/mail/u/0/#inbox/1234",
    },
  ],
};

const taskLists = [
  { id: "list-1", title: "My Tasks" },
];

const dataAccessor = {
  taskLists: {
    byId: () => taskLists[0],
    byTitle: () => taskLists[0],
    iter: () => taskLists[Symbol.iterator](),
    iterActive: () => taskLists[Symbol.iterator](),
  },
};

describe("hydrate", () => {
  it("should pass through links from the API task", () => {
    const task = hydrate(apiTask, dataAccessor);

    expect(task.links).toEqual(apiTask.links);
  });

  it("should leave links undefined when the API task has none", () => {
    const task = hydrate({ ...apiTask, links: undefined }, dataAccessor);

    expect(task.links).toBeUndefined();
  });
});

describe("googleTaskSchema", () => {
  it("should parse an API response containing links (as returned for Gmail-created tasks)", () => {
    const jsonBody = JSON.stringify({
      kind: "tasks#task",
      id: "task-1",
      title: "Fwd: Meeting",
      status: "needsAction",
      links: [
        {
          type: "email",
          description: "Fwd: Meeting",
          link: "https://mail.google.com/mail/u/0/#inbox/1234",
          position: "0",
        },
      ],
    });

    const result = parseApiResponse(googleTaskSchema, jsonBody);

    const links: TaskLink[] | undefined = result.links;
    expect(links).toHaveLength(1);
    expect(links?.[0]).toMatchObject({
      type: "email",
      description: "Fwd: Meeting",
      link: "https://mail.google.com/mail/u/0/#inbox/1234",
    });
  });

  it("should not require links", () => {
    const jsonBody = JSON.stringify({
      kind: "tasks#task",
      id: "task-1",
      title: "Plain task",
      status: "needsAction",
    });

    const result = parseApiResponse(googleTaskSchema, jsonBody);

    expect(result.links).toBeUndefined();
  });
});
