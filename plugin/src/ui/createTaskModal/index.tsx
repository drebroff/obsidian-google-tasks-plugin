import { Notice, type TFile } from "obsidian";
import type React from "react";
import { useState } from "react";
import { Button } from "react-aria-components";

import type { TaskList } from "@/api/domain/taskList";
import { ModalContext, PluginContext } from "@/ui/context";

import { TaskContentInput } from "./TaskContentInput";
import { TaskListSelect } from "./TaskListSelect";
import "./styles.scss";

export type LinkDestination = "content" | "description";

export type TaskCreationOptions = {
  appendLinkTo?: LinkDestination;
};

type CreateTaskProps = {
  initialContent?: string;
  fileContext?: TFile;
  options: TaskCreationOptions;
};

const getLinkDestinationMessage = (
  destination: LinkDestination | undefined,
): string | undefined => {
  switch (destination) {
    case "content":
      return "A link to this page will be appended to the task title.";
    case "description":
      return "A link to this page will be appended to the task description.";
    default:
      return undefined;
  }
};

export const CreateTaskModal: React.FC<CreateTaskProps> = ({
  initialContent = "",
  fileContext,
  options,
}) => {
  const plugin = PluginContext.use();
  const modal = ModalContext.use();

  const [title, setTitle] = useState(initialContent);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lists: TaskList[] = plugin.services.tasks.getTaskLists();
  const activeListId = selectedListId || (lists[0]?.id ?? "");

  const createTask = async () => {
    if (!title.trim()) {
      new Notice("Task title cannot be empty");
      return;
    }

    if (!activeListId) {
      new Notice("No Google Task list available");
      return;
    }

    let finalTitle = title.trim();
    let finalNotes = notes.trim();

    if (fileContext && options.appendLinkTo) {
      const link = `[[${fileContext.basename}]]`;
      if (options.appendLinkTo === "content") {
        finalTitle = `${finalTitle} ${link}`;
      } else {
        finalNotes = finalNotes ? `${finalNotes}\n${link}` : link;
      }
    }

    try {
      setIsSubmitting(true);
      const dueRFC3339 = dueDate ? `${dueDate}T00:00:00.000Z` : undefined;

      await plugin.services.tasks.actions.createTask(activeListId, finalTitle, {
        notes: finalNotes || undefined,
        due: dueRFC3339,
      });

      new Notice("Google Task created!");
      modal.close();
    } catch (err: unknown) {
      console.error("Failed to create Google Task:", err);
      new Notice(`Failed to create task: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const linkDestinationMessage = getLinkDestinationMessage(options.appendLinkTo);

  return (
    <div className="task-creation-modal-root">
      <TaskContentInput
        className="task-name"
        placeholder="What needs to be done?"
        content={title}
        onChange={setTitle}
        autofocus={true}
        onEnterKey={createTask}
      />
      <TaskContentInput
        className="task-description"
        placeholder="Add details, markdown or links..."
        content={notes}
        onChange={setNotes}
      />
      <div className="task-creation-selectors">
        <div className="task-creation-selectors-group">
          <TaskListSelect lists={lists} value={activeListId} onChange={setSelectedListId} />
          <input
            type="date"
            className="input task-due-date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date"
          />
        </div>
      </div>
      <div className="task-creation-notes">
        <ul>{linkDestinationMessage && <li>{linkDestinationMessage}</li>}</ul>
      </div>
      <hr />
      <div className="task-creation-controls">
        <div />
        <div className="task-creation-action">
          <Button onPress={() => modal.close()} aria-label="Cancel">
            Cancel
          </Button>
          <Button
            className="mod-cta"
            isDisabled={isSubmitting || !title.trim()}
            onPress={createTask}
            aria-label="Create Task"
          >
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </div>
    </div>
  );
};
