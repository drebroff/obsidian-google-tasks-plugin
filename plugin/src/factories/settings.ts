import type { Settings } from "@/settings";

export function makeSettings(overrides?: Partial<Settings>): Settings {
  return {
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
    ...overrides,
  };
}
