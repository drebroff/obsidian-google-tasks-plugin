import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Task } from "@/data/task";
import type { TaskQuery } from "@/query/schema/tasks";
import type { Settings } from "@/settings";

import { TaskMetadata } from "./TaskMetadata";

const makeTask = (links?: Task["links"]): Task => ({
  id: "task-1",
  content: "Fwd: Meeting",
  description: "",
  taskList: { id: "list-1", title: "My Tasks" },
  status: "needsAction",
  position: "0",
  order: 0,
  links,
});

const query: TaskQuery = {
  list: "all",
  filter: { status: "all", due: "all" },
  sorting: "date",
  sortOrder: "asc",
  groupBy: "none",
  show: [],
};

const settings: Settings = {
  clientId: "",
  clientSecret: "",
  accessToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
  userEmail: null,
  fadeToggle: true,
  autoRefreshToggle: false,
  autoRefreshInterval: 60,
  renderDateIcon: false,
  renderListIcon: false,
  renderEmailLinkIcon: true,
  shouldWrapLinksInParens: false,
  taskCreationDefaultDueDate: "none",
  taskCreationDefaultListId: null,
  debugLogging: false,
  version: 1,
};

describe("TaskMetadata", () => {
  it("should render a clickable mail icon when the task has an email link", () => {
    const task = makeTask([
      {
        type: "email",
        description: "Fwd: Meeting",
        link: "https://mail.google.com/mail/u/0/#inbox/1234",
      },
    ]);

    const { container } = render(<TaskMetadata query={query} task={task} settings={settings} />);

    const link = container.querySelector('a[href="https://mail.google.com/mail/u/0/#inbox/1234"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("aria-label", "Fwd: Meeting");
    expect(link?.querySelector(".obsidian-icon")).toBeInTheDocument();
  });

  it("should fall back to a generic tooltip when the email subject is missing", () => {
    const task = makeTask([{ type: "email", link: "https://mail.google.com/mail/u/0/#inbox/1" }]);

    const { container } = render(<TaskMetadata query={query} task={task} settings={settings} />);

    const link = container.querySelector(".google-tasks-task-metadata-icon-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("aria-label", "Open linked email");
  });

  it("should open the link externally on click", () => {
    const windowOpen = vi.fn();
    vi.stubGlobal("open", windowOpen);

    const task = makeTask([
      {
        type: "email",
        description: "Fwd: Meeting",
        link: "https://mail.google.com/mail/u/0/#inbox/1234",
      },
    ]);

    const { container } = render(<TaskMetadata query={query} task={task} settings={settings} />);

    const link = container.querySelector(".google-tasks-task-metadata-icon-link");
    expect(link).not.toBeNull();
    fireEvent.click(link as HTMLElement);

    expect(windowOpen).toHaveBeenCalledWith(
      "https://mail.google.com/mail/u/0/#inbox/1234",
      "_blank",
    );
    vi.unstubAllGlobals();
  });

  it("should not render the mail icon when the task has no links", () => {
    const task = makeTask();

    const { container } = render(<TaskMetadata query={query} task={task} settings={settings} />);

    expect(container.querySelector(".google-tasks-task-metadata-icon-link")).toBeNull();
  });

  it("should not render the mail icon when the setting is disabled", () => {
    const task = makeTask([
      {
        type: "email",
        description: "Fwd: Meeting",
        link: "https://mail.google.com/mail/u/0/#inbox/1234",
      },
    ]);

    const { container } = render(
      <TaskMetadata
        query={query}
        task={task}
        settings={{ ...settings, renderEmailLinkIcon: false }}
      />,
    );

    expect(container.querySelector(".google-tasks-task-metadata-icon-link")).toBeNull();
  });
});
