# 0025 — Edit task fields

Status: done

## Goal

Let the user edit a task's fields after creation (title, priority, quadrant, estimate, quick
flag, tags) instead of deleting and recreating.

## Requirements

- Add an "Edit" action on each task row (e.g. a small button) that opens a dialog with the
  editable fields.
- Editable fields:
  - title (text)
  - priority (1–5)
  - quadrant (q1–q4)
  - estimate minutes (only when estimates are enabled, 0016; otherwise hidden)
  - quick flag (0018)
  - tags, edited as a `#tag #other` text field (re-parsed on save, 0023)
- Save persists the changes; Cancel discards. No destructive actions here (delete already
  exists).
- The same dialog hosts the description field from 0026 when present.

## Acceptance criteria

- Opening Edit shows the task's current values.
- Saving updates the task row, tags/chips, and sorting/filtering immediately.
- Cancel leaves the task unchanged.
- Fields hidden by settings (e.g. estimates off) are not shown.
