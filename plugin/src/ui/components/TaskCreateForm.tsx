import classNames from "classnames";
import { useState } from "react";

interface TaskCreateFormProps {
  listId?: string;
  onTaskCreated?: () => void;
  className?: string;
}

export function TaskCreateForm({ onTaskCreated, className }: TaskCreateFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await onTaskCreated?.();
      setTitle("");
      setDueDate("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  if (!isOpen) {
    return (
      <button
        className={classNames("gtasks-create-form-toggle", className)}
        onClick={() => setIsOpen(true)}
      >
        + Add Task
      </button>
    );
  }

  return (
    <form className="gtasks-create-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="gtasks-create-form-input"
        autoFocus
      />

      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="gtasks-create-form-date"
      />

      <div className="gtasks-create-form-actions">
        <button
          type="submit"
          className="gtasks-create-form-submit"
          disabled={!title.trim()}
        >
          Create
        </button>
        <button
          type="button"
          className="gtasks-create-form-cancel"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}