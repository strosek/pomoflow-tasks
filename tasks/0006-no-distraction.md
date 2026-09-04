# 0006 — No-distraction mode

Status: done

## Goal

Provide a one-action toggle that hides everything except the clock and the current task title,
so the user can drop into deep focus without visual clutter.

## Requirements

- In the session view, add a toggle (e.g. a button or keyboard shortcut) that collapses all
  session chrome except the clock and task title (notes, controls, phase label).
- While focused, show a minimal "exit" affordance (e.g. `Esc` or a small floating button) so
  the mode is never a trap; the pause/finish controls remain reachable.
- State is per-session and ephemeral (not persisted).
- Preserve the current single-focus, ADHD-friendly layout; do not add settings for it.

## Acceptance criteria

- Toggling hides notes and controls; the clock and title remain centered.
- Exiting restores the full session view.
- No new persistent settings are introduced.
