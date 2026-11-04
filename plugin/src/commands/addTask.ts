import { MarkdownView, type TFile } from "obsidian";

import type { MakeCommand } from "@/commands";
import type GoogleTasksPlugin from "@/index";
import type { TaskCreationOptions } from "@/ui/createTaskModal";

export const addTask: MakeCommand = (plugin: GoogleTasksPlugin) => {
  return {
    name: "Add Google Task",
    callback: makeCallback(plugin),
  };
};

export const addTaskWithPageInContent: MakeCommand = (plugin: GoogleTasksPlugin) => {
  return {
    name: "Add Google Task with page link in title",
    callback: makeCallback(plugin, {
      appendLinkTo: "content",
    }),
  };
};

export const addTaskWithPageInDescription: MakeCommand = (plugin: GoogleTasksPlugin) => {
  return {
    name: "Add Google Task with page link in notes",
    callback: makeCallback(plugin, {
      appendLinkTo: "description",
    }),
  };
};

const makeCallback = (plugin: GoogleTasksPlugin, opts?: Partial<TaskCreationOptions>) => {
  return () => {
    plugin.services.modals.taskCreation({
      initialContent: grabSelection(plugin),
      fileContext: getFileContext(plugin),
      options: {
        ...(opts ?? {}),
      },
    });
  };
};

const grabSelection = (plugin: GoogleTasksPlugin): string | undefined => {
  const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
  if (activeView === null) {
    return undefined;
  }

  const selection = activeView.editor.getSelection();
  return selection.length > 0 ? selection : undefined;
};

const getFileContext = (plugin: GoogleTasksPlugin): TFile | undefined => {
  const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
  return activeView?.file ?? undefined;
};
