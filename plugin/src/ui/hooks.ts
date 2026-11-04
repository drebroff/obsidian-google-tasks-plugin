import { useEffect, useState } from "react";
import type { Services } from "@/services";
import type { TaskQuery } from "@/query/schema/tasks";
import type { Task } from "@/data/task";

export function useTasks(query: TaskQuery) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    const services = (window as any).obsidianGoogleTasksServices as Services | undefined;
    if (!services?.tasks) {
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const loadTasks = async () => {
      setIsLoading(true);
      try {
        if (unsubscribe) unsubscribe();
        
        const [unsub, refresh] = services.tasks.subscribe(query, (result) => {
          if (result.type === "success") {
            setTasks(result.tasks);
            setIsEmpty(result.tasks.length === 0);
          } else if (result.type === "error") {
            console.error("Tasks error:", result);
          } else if (result.type === "not-ready") {
            setIsLoading(true);
          }
        });
        
        unsubscribe = unsub;
        
        if (!services.tasks.isReady()) {
          await services.tasks.sync();
        }
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [query]);

  return { tasks, isLoading, isEmpty };
}

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    return (window as any).obsidianGoogleTasksSettings;
  });

  return settings;
}