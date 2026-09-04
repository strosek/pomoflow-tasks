# 0004 — Export / import data

Status: done

## Goal

Let the user export their data as a JSON file and import it back, so tasks and sessions can be
ported easily between computers/browsers.

## Requirements

- Export: serialize the full app state (tasks, sessions, notes, settings) to a JSON file and
  trigger a download (e.g. `pomoflow-export-YYYY-MM-DD.json`).
- Import: pick a JSON file, validate its shape, then merge or replace current data.
  Decide and document the merge strategy (recommended: replace, after a confirmation prompt).
- Include a schema `version` field in the export so future migrations are possible.
- Import must validate minimally (version + required arrays) and refuse malformed files with a
  clear message instead of corrupting state.

## Data notes

- `src/storage.ts` already holds the canonical load/save path; reuse it for serialization.
- Settings live under a separate key (0001); include them in the export payload alongside
  tasks/sessions/notes.

## UI

- Two actions reachable from the board (e.g. in a small menu near the settings gear):
  "Export data" and "Import data" (hidden file input).

## Acceptance criteria

- Export produces a downloadable JSON containing tasks, sessions, notes, and settings.
- Importing that file on another machine/browser restores the same tasks and sessions.
- Importing a malformed or non-pomoflow file is rejected without changing current data.
