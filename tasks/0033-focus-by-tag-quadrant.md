# 0033 — Dashboard focus time by tag / quadrant

Status: done

## Goal

Show where focus time actually goes — aggregated by tag and by quadrant — on the dashboard, so
the user can see which areas of work consumed attention.

## Requirements

- Aggregate `sessionWorkMs` from finished sessions (0002) by the owning task's quadrant and by
  each of its tags (a session counts toward all tags of its task).
- Add two dashboard cards (0024): "Focus by quadrant" and "Focus by tag", each listing the
  aggregated time, sorted descending.
- Sessions whose task was deleted are counted as "untagged"/unknown.
- Derived from existing data; no new storage.

## Acceptance criteria

- Dashboard shows focus time per quadrant and per tag from finished sessions.
- Totals match the sum of session work time.
- Deleted-task sessions appear under a fallback bucket.
