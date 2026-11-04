import { setLanguage } from "@/i18n";
import "@/styles/main.scss";
import type { PluginManifest } from "obsidian";
import { type App, Plugin } from "obsidian";

import { GoogleTasksApiClient } from "@/api";
import { ObsidianFetcher } from "@/api/fetcher";
import { registerCommands } from "@/commands";
import { secondsToMillis } from "@/infra/time";
import { QueryInjector } from "@/query/injector";
import { makeServices, type Services } from "@/services";
import { type Settings, useSettingsStore } from "@/settings";
import { SettingsTab } from "@/ui/settings";

const metadataSyncIntervalMs = secondsToMillis(300);

// biome-ignore lint/style/noDefaultExport: We must use default export for Obsidian plugins
export default class GoogleTasksPlugin extends Plugin {
  public readonly services: Services;

  constructor(app: App, pluginManifest: PluginManifest) {
    super(app, pluginManifest);
    this.services = makeServices(this);
  }

  async onload() {
    const queryInjector = new QueryInjector(this);

    this.registerMarkdownCodeBlockProcessor(
      "google-tasks",
      queryInjector.onNewBlock.bind(queryInjector),
    );
    this.registerMarkdownCodeBlockProcessor("gtasks", queryInjector.onNewBlock.bind(queryInjector));

    this.addSettingTab(new SettingsTab(this.app, this));

    registerCommands(this);
    setLanguage(document.documentElement.lang);

    await this.loadOptions();

    this.app.workspace.onLayoutReady(async () => {
      await this.loadApiClient();
    });

    this.registerInterval(
      window.setInterval(async () => {
        await this.services.tasks.sync();
      }, metadataSyncIntervalMs),
    );
  }

  public async loadApiClient(): Promise<void> {
    try {
      await this.services.auth.getValidAccessToken();
      const apiClient = new GoogleTasksApiClient(
        () => this.services.auth.getValidAccessToken(),
        new ObsidianFetcher(),
      );
      await this.services.tasks.initialize(apiClient);
    } catch (err) {
      console.log("Google Tasks: not authenticated or token expired", err);
    }
  }

  async loadOptions(): Promise<void> {
    const options = await this.loadData();
    useSettingsStore.setState(
      (old) => ({
        ...old,
        ...options,
      }),
      true,
    );
    await this.saveData(useSettingsStore.getState());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(useSettingsStore.getState());
  }

  async writeOptions(update: Partial<Settings>): Promise<void> {
    useSettingsStore.setState(update);
    await this.saveSettings();
  }

  getSettings(): Settings {
    return useSettingsStore.getState();
  }
}
