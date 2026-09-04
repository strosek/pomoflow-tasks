# 0002 — Session history

Status: done

## Goal

Show how much work actually went into each task by aggregating completed sessions, and
provide a history view of past sessions.

## Requirements

- Define a canonical "work time" for a finished session:
  `workMs = endedAt - startedAt - accumulatedPauseMs` (active time, pauses excluded).
  For flowtime this is the open-ended elapsed time; for pomodoro it is the sum of active focus
  minutes (exclude break time from "work" totals where practical — at minimum, report active time).
- Per-task aggregate shown on the task board (small, dim, ADHD-friendly):
  - total work time
  - number of sessions
  - pomodoros completed (pomodoro technique only)
- Add a history view listing past sessions (most recent first): task title, technique,
  date, work time, pomodoros completed, and any restart notes attached to that session.
- Provide a way to see a single task's session history (e.g. click a task's "history" action).

## Data notes

- `Session` already persists `startedAt`, `endedAt`, `accumulatedPauseMs`,
  `completedPomodoros`, `technique`, `taskId` — no migration needed for the core totals.
- For accurate pomodoro work-time totals, derive work duration from `completedPomodoros ×
workMs` (using the settings from 0001) rather than raw active time when the technique is
  pomodoro.

## Acceptance criteria

- Finishing a session updates the owning task's displayed total work time.
- History view shows every finished session with its task and work time.
- Task board shows a per-task work total without overwhelming the minimal layout.
