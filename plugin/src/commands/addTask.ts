import { MarkdownView } from "obsidian";

import type { MakeCommand } from "@/commands";
import type GoogleTasksPlugin from "@/index";

export const addTask: MakeCommand = (plugin: GoogleTasksPlugin) => {
  return {
    name: "Add Google Task",
    callback: makeCallback(plugin),
  };
};

const makeCallback = (plugin: GoogleTasksPlugin) => {
  return () => {
    plugin.services.modals.taskCreation({
      initialContent: grabSelection(plugin),
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
