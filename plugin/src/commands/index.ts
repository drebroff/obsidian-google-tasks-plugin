import type { Command as ObsidianCommand } from "obsidian";

import {
  addTask,
  addTaskWithPageInContent,
  addTaskWithPageInDescription,
} from "@/commands/addTask";
import type GoogleTasksPlugin from "@/index";
import { debug } from "@/log";

export type MakeCommand = (plugin: GoogleTasksPlugin) => Omit<ObsidianCommand, "id">;

const syncCommand: MakeCommand = (plugin: GoogleTasksPlugin) => {
  return {
    name: "Sync Google Tasks",
    callback: async () => {
      debug("Syncing with Google Tasks API");
      await plugin.services.tasks.sync();
    },
  };
};

const commands = {
  "google-tasks-sync": syncCommand,
  "add-task": addTask,
  "add-task-page-content": addTaskWithPageInContent,
  "add-task-page-description": addTaskWithPageInDescription,
};

export type CommandId = keyof typeof commands;

export const registerCommands = (plugin: GoogleTasksPlugin) => {
  for (const [id, make] of Object.entries(commands)) {
    plugin.addCommand({ id, ...make(plugin) });
  }
};

export const fireCommand = <K extends CommandId>(id: K, plugin: GoogleTasksPlugin) => {
  const make = commands[id];
  make(plugin).callback?.();
};
