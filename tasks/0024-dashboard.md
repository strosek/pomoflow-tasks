# 0024 — Dashboard view

Status: done

## Goal

Provide a separate dashboard view that summarizes attention areas and progress, reached via a
small header button, while keeping the main task board clean.

## Requirements

- Add a "Dashboard" button to the header actions (alongside History/Settings).
- The dashboard is its own view with a "← Back" control returning to the task board; it does not
  clutter the main interface.
- Show, in a light ADHD-friendly layout (numbers and simple bars, not heavy charts):
  - Overview: total tasks, open tasks, done this week.
  - Focus summary: today's and this week's focus time, and the streak (reuse 0007/0012 stats).
  - Quadrant attention: open-task counts per Eisenhower quadrant (q1–q4).
  - Tag attention: open-task counts per tag, sorted descending (from 0023).
- Everything is derived from existing state; no new data model beyond 0023.

## Acceptance criteria

- The dashboard is reachable from the board via a header button.
- Returning to the board via Back works.
- Open-task counts by quadrant and by tag reflect the current task list.
- Focus summary matches the board's summary bar.
