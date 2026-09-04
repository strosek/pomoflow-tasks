# 0036 — Export history as Markdown

Status: done

## Goal

Provide a human-readable, portable export of session history (in addition to the JSON export,
0004), useful for review or external tools.

## Requirements

- Add "Export history (Markdown)" to the Settings Data section (and/or a small button in the
  history view).
- Generate a `.md` document grouping finished sessions, e.g. by task, with date, technique,
  work time, pomodoros, and any restart notes.
- Include per-task totals at the end (reuse 0002/0007 calculations).
- Trigger a file download (`pomoflow-history-YYYY-MM-DD.md`).
- Read-only: does not alter state.

## Acceptance criteria

- Downloading produces a valid Markdown file listing sessions with their details.
- Per-task totals are included.
- The generated file matches the history view's data.
