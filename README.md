# Obsidian Google Tasks Plugin

Unofficial plugin for Obsidian that syncs Google Tasks with your vault.

## Features

- Bidirectional sync of Google Tasks
- Query code blocks to render task lists
- Commands for sync and task management

## Installation

### From the Obsidian community plugin directory

1. Open **Settings → Community plugins**.
2. Select **Browse**, search for **Google Tasks Sync** and install it.
3. Enable the plugin.

### Manual installation

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/drebroff/obsidian-google-tasks-plugin/releases/latest).
2. Create the folder `.obsidian/plugins/obsidian-google-tasks-plugin` inside your vault.
3. Copy the three files into it.
4. Enable the plugin under **Settings → Community plugins**.

## Google Cloud setup

The plugin talks to the Google Tasks API with **your own OAuth credentials**. You create a free Google Cloud project once and connect it to the plugin:

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. Enable the **Google Tasks API**: *APIs & Services → Library* → search for "Google Tasks API" → **Enable**.
3. Configure the OAuth consent screen (*APIs & Services → OAuth consent screen*):
   - User type: **External**.
   - Add your Google account as a test user while the app is in *Testing*.
4. Create an OAuth client (*APIs & Services → Credentials → Create credentials → OAuth client ID*):
   - Application type: **Desktop app**.
   - Add `http://127.0.0.1:42813` as an authorized redirect URI.
5. Copy the **Client ID** and **Client Secret**.

Then in Obsidian:

6. Open **Settings → Google Tasks Sync**.
7. Paste the **Client ID** and **Client Secret**.
8. Select **Connect Google Account** and authorize the plugin in the browser window that opens.

## Data and privacy

- The plugin only talks to Google: `accounts.google.com` (sign-in), `oauth2.googleapis.com` (token exchange and refresh) and `www.googleapis.com` (Tasks API and your account email).
- It requests two scopes: `https://www.googleapis.com/auth/tasks` (read and write your tasks) and `https://www.googleapis.com/auth/userinfo.email` (your account email, shown in the settings).
- OAuth tokens are stored locally in your vault (`data.json`) and are never sent anywhere except Google.
- The plugin collects no analytics or telemetry.

## Usage

Add a code block in a note:

```google-tasks
filter:
  status: needsAction
  due: all
```

Supported block tags: `google-tasks`, `gtasks`.

Nested keys can also be written in dot notation, e.g. `filter.status: needsAction` is equivalent to the nested form above. Invalid values (e.g. an unknown `filter.due` option) fail query parsing and are shown as an error; unknown keys produce a visible warning.

Query fields:
- `filter.status`: `needsAction` | `completed` | `all` (default `needsAction`)
- `filter.due`: `all` | `no-date` | `overdue` | `today` | `today-and-overdue` | `upcoming` (default `all`)
- `filter.search`: string
- `limit`: number
- `name`: display name with `{task_count}` placeholder
- `groupBy`: grouping option

## Refreshing

Tasks are refreshed in the following situations:

- **On window focus** — whenever the Obsidian window regains focus (throttled to at most once every 10 seconds).
- **After task changes** — creating, completing, uncompleting, or deleting a task updates all open queries immediately.
- **Manual refresh** — via the refresh button in a query header.
- **Periodic auto-refresh** — controlled by the "Automatic Refresh" toggle and "Auto-refresh interval" (in seconds) in the plugin settings. When the toggle is off, no periodic refresh happens.

## Build

```bash
cd plugin
npm run build
```

Copy `plugin/dist/main.js`, `styles.css`, `manifest.json` to the plugin folder.

## License

MIT — see [LICENSE](LICENSE). The copyright notice for Jamie Brynes' original work is retained in the LICENSE file.
