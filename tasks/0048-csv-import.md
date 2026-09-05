# 0048 — CSV / Todoist import

Status: proposed

## Goal

Let new users bring tasks from Todoist or any CSV export so switching to Pomoflow isn't manual
work.

## Requirements

- In Settings → Data, add "Import CSV" next to the JSON import (0004).
- Accept a generic CSV with columns like `title`, `priority`, `quadrant`, `tags`, `done`,
  `estimated_min`, and Todoist's CSV layout (`TYPE,CONTENT,DESCRIPTION,PRIORITY,...`).
- Preview parsed rows before importing: show count, map columns, and let the user cancel.
- Imported tasks get fresh ids; completed tasks import as done; unknown/empty rows are skipped
  with a summary report ("Imported 12 tasks, skipped 3").
- Parser is tolerant of quoted fields, newlines, and BOM.

## Acceptance criteria

- Importing a Todoist CSV creates the expected tasks with priorities and tags mapped.
- A malformed CSV shows a clear error and imports nothing.
- The import is undoable via the backup/restore flow (0031) or an undo toast (0045).
