import classNames from "classnames";
import type { TaskQuery } from "@/query/schema/tasks";
import { useTasks } from "@/ui/hooks";
import { TaskItem } from "@/ui/components/TaskItem";

interface TaskListProps {
  query: TaskQuery;
  className?: string;
}

export function TaskList({ query, className }: TaskListProps) {
  const { tasks, isLoading, isEmpty } = useTasks(query);

  if (isLoading) {
    return (
      <div className={classNames("gtasks-list", className)}>
        <div className="gtasks-skeleton">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="gtasks-skeleton-item" />
          ))}
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={classNames("gtasks-list", className)}>
        <div className="gtasks-empty">No tasks found</div>
      </div>
    );
  }

  const groupedTasks = tasks.reduce(
    (acc, task) => {
      const groupKey = query.groupBy === "list" ? task.taskList.title : 
                     query.groupBy === "date" ? task.due?.start?.flag || "no-date" : 
                     "none";
      
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(task);
      return acc;
    },
    {} as Record<string, typeof tasks>
  );

  return (
    <div className={classNames("gtasks-list", className)}>
      {Object.entries(groupedTasks).map(([groupKey, groupTasks]) => (
        <div key={groupKey} className="gtasks-group">
          {query.groupBy !== "none" && (
            <div className="gtasks-group-header">
              {groupKey}
            </div>
          )}
          <div className="gtasks-group-items">
            {groupTasks.map((task) => (
              <TaskItem key={task.id} task={task} show={query.show} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}