# 0044 — About / help modal

Status: proposed

## Goal

Add an information button on the left side of the header that opens a modal explaining the app's
philosophy and basic usage, so a first-time visitor quickly understands what Pomoflow is and how
to use it.

## Requirements

- An icon button (e.g. `info` / help icon) on the **left** side of the header (0040 button
  aesthetics, 0027 icon buttons), next to the title.
- Opens a modal (reuse the overlay/dialog system in `dialogs.ts`) titled "About Pomoflow".
- Content covers:
  - **Philosophy** — "one thing at a time"; calm, minimal, no account/no server; data lives in
    the browser; built around Flowtime (deep, open-ended work) and Pomodoro (steady progress).
  - **Basic usage** — add a task (priority + quadrant), start a session, finish and take a
    break; quick tasks and quick runs; recurring tasks (0043); tags and estimates; history and
    dashboard.
  - **Keyboard shortcuts** — the same list shown in the footer (0009), kept in sync.
- The modal respects the current theme and closes via its close button, clicking the backdrop,
  and `Esc` (consistent with existing dialogs).
- No change to data, persistence, or the board layout beyond the new button.

## Acceptance criteria

- Clicking the info button opens the About modal; it closes with close button, backdrop click,
  and `Esc`.
- The modal explains the philosophy and how to add a task, start a session, and finish it, plus
  the shortcut keys.
- The info button is on the left side of the header and matches the existing icon-button styling.

## Nice to have

- A one-line link to the Ko-fi support page inside the modal.
