import { Notice, type TFile } from "obsidian";
import type React from "react";
import { useState } from "react";

import type { TaskList } from "@/api/domain/taskList";
import { ModalContext, PluginContext } from "@/ui/context";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="google-tasks-create-task-modal">
      <h2>New Google Task</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
            Task Title
          </label>
          <input
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
            Notes / Description
          </label>
          <textarea
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details, markdown or links..."
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
              List
            </label>
            <select
              className="dropdown"
              value={activeListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              style={{ width: "100%" }}
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
              Due Date
            </label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
          <button type="button" onClick={() => modal.close()}>
            Cancel
          </button>
          <button type="submit" className="mod-cta" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
};
