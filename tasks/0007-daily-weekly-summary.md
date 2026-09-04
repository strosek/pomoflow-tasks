# 0007 — Daily / weekly focus summary

Status: done

## Goal

Show a small, encouraging summary of focus time (e.g. "Today: 2h 05m · 4 pomodoros") to build
momentum without adding a full dashboard.

## Requirements

- Derive totals from existing finished sessions (`sessionWorkMs` from 0002), aggregated by day
  and by week (week starting Monday).
- Surface as a compact line on the board header (dim, ADHD-friendly) — not a chart.
- Compute from session `endedAt` timestamps; no new data model needed.
- Week summary appears once there is more than one day of data (otherwise show the day only).

## Acceptance criteria

- Today's focus time and pomodoro count show on the board.
- Weekly focus time is shown when applicable.
- Totals update after finishing a session without a reload.
