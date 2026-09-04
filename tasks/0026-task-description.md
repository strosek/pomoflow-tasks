# 0026 — Task description

Status: done

## Goal

Give tasks an optional longer, multi-line description, reachable from a small button on the
task row, and shown as a hint while working on the task.

## Requirements

- Add `description: string` (default `""`) to `Task`.
- A small button on each task row (e.g. "Details") opens the description view/editor; it reuses
  the edit dialog from 0025 so title/priority/etc. stay editable in one place.
- When starting a work session (pomodoro or flowtime) on a task that has a description, show the
  description near the top of the session view (styled like the resume hint, 0008), so the goal
  is visible while working. It is dismissible for that session.
- Tasks without a description show no hint and no interruption.

## Acceptance criteria

- A task can get a multi-line description via the task row button.
- The description persists and appears in export/import (flows through state).
- Starting a session on a task with a description shows it as a hint in the session view.
- The hint is dismissible and does not appear for tasks without a description.
