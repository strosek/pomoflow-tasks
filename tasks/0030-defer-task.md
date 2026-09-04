# 0030 — Defer / snooze a task

Status: done

## Goal

Let the user push a task to a future day so unfinished items don't sit at the top of the list.

## Requirements

- Reuse the `plannedFor` field from 0029: "Defer" sets `plannedFor` to a chosen future date
  (e.g. tomorrow or a date picker).
- Board shows deferred open tasks dimmed/grouped under their planned date, ordered by date;
  tasks planned for today or with no plan appear first.
- Once the planned date passes (overdue), the task returns to normal visibility (still marked
  overdue until re-planned or completed).
- Defer action lives in the task row menu (0037); also available from the edit dialog.
- A small date indicator on deferred tasks.

## Acceptance criteria

- Deferring a task to tomorrow moves it out of the immediate list, dimmed under its date.
- An overdue deferred task returns to normal prominence.
- Clearing the plan (via 0029 toggle or edit) removes the date indicator.
