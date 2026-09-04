# 0031 — Auto-backup before destructive actions

Status: done

## Goal

Make destructive actions safe by snapshotting the current data to a recoverable backup before
an import-replace or clear-data.

## Requirements

- Before applying an import replace (0004) or clear-data (0019), write a snapshot
  `{ settings, data }` to a dedicated localStorage backup key (e.g. `pomoflow:backup:v1`),
  overwriting any previous backup.
- Confirm dialogs for import and clear mention that a backup will be saved first.
- Add a "Restore last backup" action in the Settings Data section that offers to replace current
  data with the saved snapshot (with confirmation).
- If no backup exists, the restore action is disabled or shows "no backup".

## Acceptance criteria

- Importing or clearing saves a recoverable backup first.
- Restore replaces current data with the last backup after confirmation.
- No backup → restore shows a clear "no backup" state.
