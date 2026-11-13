# Obsidian Google Tasks Plugin

Unofficial plugin for Obsidian that syncs Google Tasks with your vault.

## Features

- Bidirectional sync of Google Tasks
- Query code blocks to render task lists
- Commands for sync and task management

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

ISC
