# 0032 — Session notes management

Status: done

## Goal

Let the user edit and delete individual restart notes (currently append-only), so stale or
mistyped notes can be corrected.

## Requirements

- In the history view (0002), restart notes shown under a session get small edit and delete
  actions per note.
- Edit opens a small dialog with the note text; saving updates the note.
- Delete removes the note (with a lightweight confirm or undo).
- Notes are also visible in the session view (0026-area) — editing there is optional; history
  editing is the primary surface.
- Existing `RestartNote` fields are unchanged.

## Acceptance criteria

- A restart note can be edited in the history view and the change persists.
- A restart note can be deleted and disappears from history and future resume hints (0008).
- No orphaned references remain after deletion.
