# 0022 — Delete history items

Status: done

## Goal

Let the user remove individual finished sessions from the history view, e.g. to clean up
accidental or test sessions.

## Requirements

- In the history view (0002, both all-sessions and per-task), each history item gets a delete
  action (e.g. a small ✕ button).
- Deleting a session removes that session from `state.sessions`; its restart notes (which
  reference the session) are removed too to avoid orphans.
- Per-task totals and daily/weekly summaries (0007/0012) update immediately since they are
  derived from sessions.
- Deleting an active session is not possible (only finished sessions appear in history).
- Use a small confirmation (or rely on the undo affordance pattern) to prevent accidents;
  keep it lightweight.

## Acceptance criteria

- A finished session can be removed from history.
- Its restart notes disappear with it.
- Task totals and summary update after deletion.
- The action is reachable in both the global history and per-task history views.
