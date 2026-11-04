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
    after: {
      id: "list",
      shouldRender: (settings) => settings.renderListIcon,
    },
  },
  side: "right",
};

const dueDateMeta: MetadataDefinition = {
  name: "due",
  isShown: (show, task) => (!show || show.includes("due")) && task.due !== undefined,
  content: (task) => {
    if (!task.due) return [];
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

const metadata: MetadataDefinition[] = [listMeta, dueDateMeta];

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
    <div className="todoist-task-metadata">
      <div className="todoist-task-metadata-group">{leftElements}</div>
      <div className="todoist-task-metadata-group">{rightElements}</div>
    </div>
  );
};

function renderMetadata(def: MetadataDefinition, task: Task, settings: Settings): React.ReactNode {
  const contents = def.content(task);
  const beforeIcon = def.icons.before?.shouldRender(settings, task) ? (
    <ObsidianIcon id={def.icons.before.id} size={def.icons.before.size ?? "s"} />
  ) : null;
  const afterIcon = def.icons.after?.shouldRender(settings, task) ? (
    <ObsidianIcon id={def.icons.after.id} size={def.icons.after.size ?? "s"} />
  ) : null;

  return (
    <span key={def.name} className={`todoist-task-metadata-item`} data-meta={def.name}>
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
