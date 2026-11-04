import { GoogleTasksAdapter } from "@/data";
import type GoogleTasksPlugin from "@/index";
import { ModalHandler } from "@/services/modals";
import { GoogleAuthManager } from "@/services/tokenAccessor";

export type Services = {
  modals: ModalHandler;
  auth: GoogleAuthManager;
  tasks: GoogleTasksAdapter;
};

export const makeServices = (plugin: GoogleTasksPlugin): Services => {
  return {
    modals: new ModalHandler(plugin),
    auth: new GoogleAuthManager(async () => {
      await plugin.saveSettings();
    }),
    tasks: new GoogleTasksAdapter(),
  };
};
