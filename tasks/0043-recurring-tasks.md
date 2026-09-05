# 0043 — Recurring tasks

Status: done

## Goal

Let the user mark a task as recurring so it automatically comes back after being completed —
e.g. daily habits like reviewing PRs, checking email, or a weekly planning block.

## Model

- Add an optional `recurrence` field to `Task`:
  - `null` — a normal, one-off task (default).
  - `{ every: "daily", time? }` — recurs every day.
  - `{ every: "workdays", time? }` — recurs Monday through Friday.
  - `{ every: "weekly", weekday?, time? }` — recurs weekly, on the given weekday (defaults to
    the weekday it was completed on).
  - `{ every: "monthly", day?, time? }` — recurs monthly on the given day of month (defaults to
    the day it was completed on).
  - `time` is minutes from local midnight (the time of day the occurrence is due).
  - `{ every: "days", interval }` is still accepted when loading old data but no longer offered
    in the UI.
- Stored in the task JSON so it survives export/import and sanitizes safely (unknown values
  fall back to `null`).
- Independent of `quick` and `estimatedMin`.

## Scheduling a fixed date & time

- The Repeats dialog also sets when the task is next due: a date picker plus a time picker. With
  "Doesn't repeat" this acts as a one-time scheduled task; `plannedFor` may now hold a time of
  day, not just local midnight.
- Today/Later/overdue classification compares by calendar day (`tasks.ts`).

## Behavior

- When a recurring task is marked done, its next occurrence is computed from the completion time
  (`doneAt`) and the recurrence rule (including the time of day); the task immediately reopens
  and is scheduled for that date:
  - If due today, it stays in the normal board.
  - If due on a future date, it moves into the **Later** list (0029/0030), showing its
    recurrence badge and due date/time.
- Title, quadrant, priority, tags, estimate, and description carry over unchanged. Session
  history (0002) keeps every completed instance as its own finished session, so you still see
  "3 sessions, 1h 20m" style stats per recurring task.
- The row menu (0037) and edit dialog (0025) let the user set or change the recurrence and due
  date/time; "Doesn't repeat" turns it back into a one-off task.
- Editing a recurring task's schedule applies to future occurrences; there is no separate
  instance history editing.

## Acceptance criteria

- Marking a daily task done reopens it at the next scheduled occurrence (e.g. tomorrow 09:00)
  with a recurrence badge.
- A work-days task completed on Friday reopens Monday.
- A weekly task completed today reopens next week on the same weekday and appears in Later.
- A monthly task recurs on the chosen day of month, clamping to month length.
- Completing a recurring task records its session in history like a normal task.
- "Doesn't repeat" converts the task back to a one-off without losing its data or sessions.
- Sanitize (storage.ts) treats an unknown/absent recurrence as `null`.

## Nice to have

- A small "repeat" icon/badge on recurring rows so they're recognizable at a glance.
- Optional nudge in the summary bar (0007) when a recurring task is due today.