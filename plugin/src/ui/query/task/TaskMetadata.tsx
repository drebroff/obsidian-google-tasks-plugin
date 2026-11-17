import type React from "react";

import { DueDate } from "@/data/dueDate";
import type { Task } from "@/data/task";
import type { TaskQuery } from "@/query/schema/tasks";
import type { Settings } from "@/settings";
import { ObsidianIcon } from "@/ui/components/obsidian-icon";

type MetadataContent = {
  content: string;
  attr?: Record<string, string>;
};

type IconDefinition = {
  id: string;
  shouldRender: (settings: Settings, task: Task) => boolean;
  size?: React.ComponentProps<typeof ObsidianIcon>["size"];
  href?: (task: Task) => string | undefined;
  title?: (task: Task) => string | undefined;
};

type MetadataDefinition = {
  name: string;
  isShown: (show: string[] | undefined, task: Task) => boolean;
  content: (task: Task) => MetadataContent[];
  icons: Partial<Record<"before" | "after", IconDefinition>>;
  side: "left" | "right";
};

const listMeta: MetadataDefinition = {
  name: "list",
  isShown: (show) => !show || show.includes("list"),
  content: (task) => [
    {
      content: task.taskList.title,
    },
  ],
  icons: {
    before: {
      id: "bullet-list",
      shouldRender: (settings) => settings.renderListIcon,
    },
  },
  side: "left",
};

const dueDateMeta: MetadataDefinition = {
  name: "due",
  isShown: (show, task) => (!show || show.includes("due")) && task.due !== undefined,
  content: (task) => {
    if (!task.due) {
      return [];
    }

    return [{ content: DueDate.format(task.due) }];
  },
  icons: {
    before: {
      id: "calendar",
      shouldRender: (settings) => settings.renderDateIcon,
    },
  },
  side: "left",
};

const emailLinkMeta: MetadataDefinition = {
  name: "email-link",
  // The email link is an attribute of the task itself, so it is shown
  // regardless of the query's `show` filter; visibility is controlled
  // by the `renderEmailLinkIcon` setting on the icon definition instead.
  isShown: (_show, task) => getEmailLink(task) !== undefined,
  content: () => [],
  icons: {
    before: {
      id: "lucide-mail",
      shouldRender: (settings, task) =>
        settings.renderEmailLinkIcon && getEmailLink(task) !== undefined,
      href: (task) => getEmailLink(task)?.link,
      title: (task) => getEmailLink(task)?.description ?? "Open linked email",
    },
  },
  side: "left",
};

const metadata: MetadataDefinition[] = [dueDateMeta, listMeta, emailLinkMeta];

type Props = {
  task: Task;
  query: TaskQuery;
  settings: Settings;
};

export const TaskMetadata: React.FC<Props> = ({ task, query, settings }) => {
  const show = query.show;

  const leftElements = metadata
    .filter((m) => m.side === "left" && m.isShown(show, task))
    .map((m) => renderMetadata(m, task, settings));

  const rightElements = metadata
    .filter((m) => m.side === "right" && m.isShown(show, task))
    .map((m) => renderMetadata(m, task, settings));

  if (leftElements.length === 0 && rightElements.length === 0) {
    return null;
  }

  return (
    <div className="google-tasks-task-metadata">
      <div className="google-tasks-task-metadata-group">{leftElements}</div>
      <div className="google-tasks-task-metadata-group">{rightElements}</div>
    </div>
  );
};

function getEmailLink(task: Task): { description?: string; link: string } | undefined {
  return task.links?.find((link) => link.type === "email" && link.link !== "");
}

function renderIcon(icon: IconDefinition, task: Task): React.ReactNode {
  const node = <ObsidianIcon id={icon.id} size={icon.size ?? "s"} />;
  const href = icon.href?.(task);
  const title = icon.title?.(task);

  if (href === undefined) {
    return node;
  }

  return (
    <a
      href={href}
      className="google-tasks-task-metadata-icon-link"
      onClick={(event) => {
        event.preventDefault();
        window.open(href, "_blank");
      }}
      aria-label={title}
    >
      {node}
    </a>
  );
}

function renderMetadata(def: MetadataDefinition, task: Task, settings: Settings): React.ReactNode {
  const contents = def.content(task);
  const beforeIcon =
    def.icons.before?.shouldRender(settings, task) && def.icons.before
      ? renderIcon(def.icons.before, task)
      : null;
  const afterIcon =
    def.icons.after?.shouldRender(settings, task) && def.icons.after
      ? renderIcon(def.icons.after, task)
      : null;

  return (
    <span key={def.name} className={`google-tasks-task-metadata-item`} data-meta={def.name}>
      {beforeIcon}
      {contents.map((c, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: simple metadata
        <span key={i} {...(c.attr ?? {})}>
          {c.content}
        </span>
      ))}
      {afterIcon}
    </span>
  );
}
