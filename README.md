# Pomoflow

_One thing at a time._

Pomoflow is a calm, free, browser-only task tracker for people who juggle too much. It pairs a
simple urgent/important task board with the two focus techniques that actually help — **Flowtime**
for deep, open-ended work and **Pomodoro** for steady progress — and it never asks for an account,
a subscription, or a server to think about.

Your data lives in your browser. Open it, add a task, start focusing.

## Why Pomoflow?

Built for the people who like Flowtime and don't want to pay for an app this simple — or lose their
peace of mind to feature creep. It is designed to be:

- **Minimal.** Few buttons, quiet colors, nothing to configure before it is useful.
- **Calming.** A biophilic, dark-by-default theme inspired by forest greens.
- **Kind to a busy mind.** Prioritize and sort urgent vs. important, and let today's focus be a
  single reassuring number instead of a wall of todos.
- **Honest about time.** Timing is computed from wall-clock timestamps, so sessions never drift —
  even if you close the laptop and come back.

## Features

### Tasks, organized

- Priorities 1–5 and the Eisenhower quadrant (urgent / important)
- Tags (`#errands`), descriptions, and optional time estimates
- Plan for today or defer to a later date; overdue is surfaced clearly
- Quick tasks for the tiny stuff, batched into one continuous run
- Recurring tasks (daily, work days, weekly, or monthly) with a scheduled time that reopen after completion
- Natural-language quick-add (`#tags`, `!priority`, "tomorrow 9am")
- Manual drag-and-drop ordering alongside priority/type/newest sort
- Search, filter, and sort
- Undo toasts for completing, deleting, and rescheduling tasks

### Focus, your way

- **Flowtime** — open-ended, count-up sessions with a suggested break when you finish
- **Pomodoro** — work/break cycles with configurable durations and long-break cadence
- Drift-free timers derived from timestamps (no clock drift)
- Automatic break countdown after a session
- **Focus mode** — hides everything but the clock and the current task
- Restart notes per session, plus a "pick up where you left off" hint
- Sound cues (chime / soft / breeze, with preview) and optional browser notifications
- Idle nudge if a session keeps running while you step away

### Insight without noise

- Today and week focus totals, focus streak
- Dashboard: focus trend and weekday rhythm charts, focus by quadrant and tag, open tasks by
  quadrant, areas needing attention, recent sessions
- Session history per task, with editable notes

### Data you own

- 100% local — stored in your browser, no account, no server
- Installable PWA that works offline
- Export / import (JSON), CSV import (e.g. from Todoist), and Markdown history export
- Automatic backup before destructive actions, with restore, plus daily snapshots
- Duplicate-task warnings and delete confirmations with session counts

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # typecheck + production build
npm run preview  # preview the production build
```

### Scripts

| Script              | What it does                        |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Vite dev server                     |
| `npm run build`     | `tsc` + production build to `dist/` |
| `npm run preview`   | Serve the production build          |
| `npm run typecheck` | TypeScript check (no emit)          |
| `npm test`          | Vitest unit + smoke tests           |
| `npm run lint`      | ESLint                              |
| `npm run format`    | Prettier (write)                    |

### Keyboard shortcuts

| Key     | Action                                 |
| ------- | -------------------------------------- |
| `N`     | New task                               |
| `/`     | Search                                 |
| `Space` | Pause / resume                         |
| `F`     | Finish (session, quick task, or break) |
| `Esc`   | Close menu, exit focus mode, or dialog |

## Tech

- TypeScript, Vite, vanilla DOM — no runtime dependencies
- LocalStorage persistence with sanitized load/import paths
- Synthesized audio cues (no asset files)
- Vitest, ESLint, and Prettier for quality

## Trying it with example data

`examples/` contains realistic export files you can load from **Settings → Import data**:

- `typical-2-months.json` — a mixed user: ~17 tasks across quadrants/priorities, ~2 months of
  pomodoro and flowtime sessions, plans for today and later.
- `flowtime-focused.json` — a flowtime-first user with longer deep-work sessions, progress notes,
  day theme, and a max-flowtime cap.

Dates are generated relative to today, so the dashboard, streak, and Today/Later sections are
immediately populated. Regenerate them at any time:

```bash
npm run examples
```

## Notes

- A single-page, front-end-only app by design (see `INTENT.md`).
- Data is tied to the browser you use — export a JSON backup before clearing your browser data.
