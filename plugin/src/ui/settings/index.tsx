import { type App, Notice, PluginSettingTab } from "obsidian";
import React, { useState } from "react";
import { createRoot, type Root } from "react-dom/client";

import { BuildStamp } from "@/stamp";
import { PluginContext } from "@/ui/context";

import type GoogleTasksPlugin from "../../index";
import { type Settings, useSettingsStore } from "../../settings";
import { AutoRefreshIntervalControl } from "./AutoRefreshIntervalControl";
import { Setting } from "./SettingItem";
import "./styles.scss";

export class SettingsTab extends PluginSettingTab {
  private readonly plugin: GoogleTasksPlugin;
  private reactRoot: Root | undefined;

  constructor(app: App, plugin: GoogleTasksPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.icon = "check-square";
  }

  display() {
    this.containerEl.empty();
    this.reactRoot = createRoot(this.containerEl);
    this.reactRoot.render(<SettingsRoot plugin={this.plugin} />);
  }

  hide() {
    this.reactRoot?.unmount();
  }
}

type Props = {
  plugin: GoogleTasksPlugin;
};

type SettingsKeys<V> = {
  [K in keyof Settings]: Settings[K] extends V ? K : never;
}[keyof Settings];

const SettingsRoot: React.FC<Props> = ({ plugin }) => {
  const settings = useSettingsStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const mkOptionUpdate = <K extends keyof Settings>(key: K) => {
    return async (val: Settings[K]) => {
      await plugin.writeOptions({
        [key]: val,
      });
    };
  };

  const toggleProps = (key: SettingsKeys<boolean>) => {
    const onClick = mkOptionUpdate(key);
    const value = settings[key];
    return {
      value,
      onClick,
    };
  };

  const handleLogin = async () => {
    if (!settings.clientId || !settings.clientSecret) {
      new Notice("Please enter both Client ID and Client Secret first.");
      return;
    }

    try {
      setIsLoggingIn(true);
      const authUrl = plugin.services.auth.getAuthUrl();
      window.open(authUrl);
      new Notice("Browser opened. Please authorize in your browser...");

      const email = await plugin.services.auth.login();
      new Notice(`Successfully connected as ${email}!`);
      await plugin.loadApiClient();
    } catch (err: unknown) {
      console.error("Login failed:", err);
      new Notice(`Login failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await plugin.services.auth.logout();
    new Notice("Disconnected from Google Tasks.");
  };

  return (
    <PluginContext.Provider value={plugin}>
      <div className="todoist-settings">
        <h2>Google Tasks Authentication</h2>
        <Setting.Root name="Client ID" description="OAuth 2.0 Client ID from Google Cloud Console.">
          <input
            type="text"
            placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
            value={settings.clientId}
            onChange={(e) => mkOptionUpdate("clientId")(e.target.value.trim())}
            style={{ width: "280px" }}
          />
        </Setting.Root>

        <Setting.Root
          name="Client Secret"
          description="OAuth 2.0 Client Secret from Google Cloud Console."
        >
          <input
            type="password"
            placeholder="Enter Client Secret"
            value={settings.clientSecret}
            onChange={(e) => mkOptionUpdate("clientSecret")(e.target.value.trim())}
            style={{ width: "280px" }}
          />
        </Setting.Root>

        <Setting.Root
          name="Account Connection"
          description={
            settings.userEmail
              ? `Connected as ${settings.userEmail}`
              : "Sign in with your Google account via browser"
          }
        >
          {settings.userEmail ? (
            <button type="button" className="mod-warning" onClick={handleLogout}>
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              className="mod-cta"
              disabled={isLoggingIn || !settings.clientId || !settings.clientSecret}
              onClick={handleLogin}
            >
              {isLoggingIn ? "Waiting for browser..." : "Connect Google Account"}
            </button>
          )}
        </Setting.Root>

        <h2>Display</h2>
        <Setting.Root
          name="Fade completed tasks"
          description="Smoothly fade completed tasks before hiding them."
        >
          <Setting.ToggleControl {...toggleProps("fadeToggle")} />
        </Setting.Root>

        <Setting.Root
          name="Render date icon"
          description="Show calendar icon next to task due dates."
        >
          <Setting.ToggleControl {...toggleProps("renderDateIcon")} />
        </Setting.Root>

        <Setting.Root name="Render list icon" description="Show list icon next to tasklist names.">
          <Setting.ToggleControl {...toggleProps("renderListIcon")} />
        </Setting.Root>

        <h2>Synchronization</h2>
        <Setting.Root
          name="Automatic Refresh"
          description="Periodically refresh tasks in open notes."
        >
          <Setting.ToggleControl {...toggleProps("autoRefreshToggle")} />
        </Setting.Root>

        <Setting.Root
          name="Auto-refresh interval"
          description="Interval in seconds between refreshes."
        >
          <AutoRefreshIntervalControl
            initialValue={settings.autoRefreshInterval}
            onChange={mkOptionUpdate("autoRefreshInterval")}
          />
        </Setting.Root>

        <h2>Debugging</h2>
        <Setting.Root
          name="Debug Logging"
          description="Enable verbose logging in the developer console."
        >
          <Setting.ToggleControl {...toggleProps("debugLogging")} />
        </Setting.Root>

        <Setting.Root name="Build Version" description="Plugin build version info.">
          <span style={{ color: "var(--text-muted)" }}>{BuildStamp}</span>
        </Setting.Root>
      </div>
    </PluginContext.Provider>
  );
};
