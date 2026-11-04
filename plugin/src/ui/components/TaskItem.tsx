import classNames from "classnames";
import type { Task } from "@/data/task";
import type { TaskQuery } from "@/query/schema/tasks";

interface TaskItemProps {
  task: Task;
  show: TaskQuery["show"];
}

export function TaskItem({ task, show }: TaskItemProps) {
  const status = task.status;
  const isCompleted = status === "completed";

  return (
    <div
      className={classNames(
        "gtasks-item",
        isCompleted && "gtasks-item--completed",
      )}
    >
      <button
        className="gtasks-checkbox"
        onClick={() => {
          // This will be handled by the parent component via props
          // We'll use a callback pattern
        }}
        aria-label={isCompleted ? "Uncomplete task" : "Complete task"}
      >
        {isCompleted && <span className="gtasks-checkbox-check" />} 
      </button>

      <div className="gtasks-item-content">
        <div className="gtasks-item-header">
          <span
            className={classNames(
              "gtasks-item-title",
              task.content.includes("http") && "gtasks-item-title--link"
            )}
            onClick={() => {
              if (task.content.includes("http")) {
                window.open(task.content, "_blank");
              }
            }}
          >
            {task.content}
          </span>
          
          {show.includes("list") && (
            <span className="gtasks-item-list">{task.taskList.title}</span>
          )}
        </div>

        {show.includes("due") && task.due && (
          <div className="gtasks-item-due">
            <span
              className={classNames(
                "gtasks-item-due-date",
                task.due.start.isOverdue && "gtasks-item-due-date--overdue",
                task.due.start.flag === "today" && "gtasks-item-due-date--today",
                !task.due.start.isOverdue && !task.due.start.flag && "gtasks-item-due-date--no-date"
              )}
            >
              {task.due.start.raw.toLocaleDateString()}
            </span>
          </div>
        )}

        {show.includes("notes") && task.description && (
          <div className="gtasks-item-notes">
            <details className="gtasks-item-notes-details">
              <summary className="gtasks-item-notes-summary">Notes</summary>
              <div className="gtasks-item-notes-content">{task.description}</div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}