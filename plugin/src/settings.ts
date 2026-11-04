import { create } from "zustand";

export type DueDateDefaultSetting = "none" | "today" | "tomorrow";

const defaultSettings: Settings = {
  clientId: "",
  clientSecret: "",
  accessToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
  userEmail: null,

  fadeToggle: true,

  autoRefreshToggle: false,
  autoRefreshInterval: 60,

  renderDateIcon: true,
  renderListIcon: true,

  shouldWrapLinksInParens: false,
  taskCreationDefaultDueDate: "none",
  taskCreationDefaultListId: null,

  debugLogging: false,
  version: 1,
};

export type Settings = {
  clientId: string;
  clientSecret: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  userEmail: string | null;

  fadeToggle: boolean;
  autoRefreshToggle: boolean;
  autoRefreshInterval: number;

  renderDateIcon: boolean;
  renderListIcon: boolean;

  shouldWrapLinksInParens: boolean;
  taskCreationDefaultDueDate: DueDateDefaultSetting;
  taskCreationDefaultListId: string | null;

  debugLogging: boolean;
  version: number;
};

export const useSettingsStore = create<Settings>(() => ({
  ...defaultSettings,
}));
