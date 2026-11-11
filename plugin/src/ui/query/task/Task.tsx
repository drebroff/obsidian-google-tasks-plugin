import * as motion from "motion/react-m";
import { Notice } from "obsidian";
import type React from "react";

import type { TaskTree } from "@/data/transformations/relationships";
import { useSettingsStore } from "@/settings";
import { Markdown } from "@/ui/components/markdown";
import { PluginContext, QueryContext } from "@/ui/context";
import { TaskList } from "@/ui/query/task/TaskList";
import { TaskMetadata } from "@/ui/query/task/TaskMetadata";

const noticeDurationMs = 2000;

type Props = {
  tree: TaskTree;
};

export const Task: React.FC<Props> = ({ tree }) => {
  const plugin = PluginContext.use();
  const query = QueryContext.use();
  const settings = useSettingsStore();

  const onClickTask = async () => {
    try {
      await plugin.services.tasks.actions.toggleTask(tree.id, tree.status);
    } catch (error: unknown) {
      console.error("Failed to update task", error);
      new Notice("Failed to update task", noticeDurationMs);
    }
  };

  const shouldRenderDescription =
    (!query.show || query.show.includes("notes")) && tree.description !== "";

  const transitionOpacity = settings.fadeToggle ? 0 : 1;

  return (
    <>
      <motion.div
        className="google-tasks-task-container"
        data-due-metadata={
          tree.status !== "completed" && tree.due !== undefined && tree.due.start.isOverdue
            ? "overdue"
            : undefined
        }
        initial={{
          opacity: transitionOpacity,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: transitionOpacity,
        }}
        transition={{
          duration: 0.4,
        }}
      >
        <label className="google-tasks-task-checkbox">
          <input
            type="radio"
            name={`task-${tree.id}`}
            checked={tree.status === "completed"}
            onChange={onClickTask}
            className="google-tasks-task-radio-input"
          />
          <div className="google-tasks-task-radio-indicator" />
        </label>
        <div className="google-tasks-task">
          <Markdown
            className="google-tasks-task-content"
            content={sanitizeContent(tree.content)}
            key={tree.content}
          />
          {shouldRenderDescription && <DescriptionRenderer content={tree.description} />}
          <TaskMetadata query={query} task={tree} settings={settings} />
        </div>
      </motion.div>
      {tree.children.length > 0 && <TaskList trees={tree.children} />}
    </>
  );
};

const sanitizeContent = (content: string): string => {
  return content.replace(/^[*_~]{1,2}|[*_~]{1,2}$/g, "").trim();
};

const DescriptionRenderer: React.FC<{ content: string }> = ({ content }) => {
  return <Markdown className="google-tasks-task-description" content={content} />;
};
