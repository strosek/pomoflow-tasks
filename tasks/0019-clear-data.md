# 0019 — Clear data

Status: done

## Goal

Provide a "Clear data" action in Settings so the user can wipe all tasks, sessions, and notes
(starting fresh) without clearing their browser storage manually.

## Requirements

- Add a "Danger zone" section in the Settings dialog with a **Clear data** button (visually
  distinct from normal actions).
- Clearing removes all tasks, sessions, and restart notes. Settings (timing, theme, sound,
  notifications) are preserved.
- Also cancels any active session, break countdown (0014), or quick run (0018) and returns to
  the board.
- Require confirmation before anything is deleted (a dialog stating it cannot be undone), so
  accidental clicks are safe.

## Acceptance criteria

- Confirming the clear empties the board, history, and per-task totals.
- Settings survive a clear.
- An active session/break/quick run is cancelled and the app returns to the board.
- Cancel does nothing.
