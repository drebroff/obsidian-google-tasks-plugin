import type React from "react";

import type { Task } from "@/data/task";
import { buildTaskTree, type TaskTree } from "@/data/transformations/relationships";
import { QueryContext } from "@/ui/context";
import { TaskList } from "@/ui/query/task/TaskList";

type Props = {
  tasks: Task[];
};

export const ListDisplay: React.FC<Props> = ({ tasks }) => {
  QueryContext.use();
  const trees = getTaskTree(tasks);

  return <TaskList trees={trees} />;
};

const getTaskTree = (tasks: Task[]): TaskTree[] => {
  return buildTaskTree(tasks);
};
