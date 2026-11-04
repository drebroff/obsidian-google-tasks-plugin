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

Query fields:
- `filter.status`: `needsAction` | `completed` | `all` (default `needsAction`)
- `filter.due`: `all` | `no-date` | `overdue` | `today` | `today-and-overdue` | `upcoming` (default `all`)
- `filter.search`: string
- `limit`: number
- `name`: display name with `{task_count}` placeholder
- `groupBy`: grouping option
- `autorefresh`: interval in minutes

## Build

```bash
cd plugin
npm run build
```

Copy `plugin/dist/main.js`, `styles.css`, `manifest.json` to the plugin folder.

## License

ISC
