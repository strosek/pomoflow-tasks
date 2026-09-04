# 0013 — Estimated vs. actual time

Status: done

## Goal

Let the user set an optional time estimate per task and see how long it actually took, revealing
how long tasks really take.

## Requirements

- Add an optional `estimatedMin` field to `Task` (nullable; null = no estimate).
- Edit the estimate from the task board (e.g. a small field in the task row or the start dialog).
- Compare estimate against actual work time (from 0002's `taskTotals`), shown as a dim inline
  note on the task row (e.g. "est 30m · actual 42m") only when both exist.
- Estimate is included in export/import automatically via the existing state serialization.

## Acceptance criteria

- A task with both an estimate and actual work shows both on the board.
- Tasks without an estimate show no comparison.
- Editing the estimate persists and survives reload.
