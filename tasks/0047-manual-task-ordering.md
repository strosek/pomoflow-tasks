# 0047 — Manual task ordering

Status: done

## Goal

Allow manual ordering of the task list as an alternative to auto-sort, so users can arrange the
board the way they intend to work it.

## Requirements

- Add a new sort mode "Manual" to the sort selector (0017).
- In manual mode, rows are ordered by a stored `order` value; dragging a row (or using
  up/down buttons on touch) reorders it and persists the new order.
- A sort/priority change preserves manual order when switching back (store per-task `order`).
- Drag-and-drop via pointer events with a visible drop indicator; keyboard alternative: move
  up/down actions in the row menu (0037).
- Interplay with done tasks: done tasks stay at the bottom (0017 behavior) even in manual mode.

## Acceptance criteria

- Selecting "Manual" sort shows tasks in saved order; dragging reorders and persists across
  reloads.
- New tasks are appended at the end of the manual order.
- Switching to Priority/Newest and back to Manual restores the custom order.

## Nice to have

- Touch-friendly reorder buttons for mobile.
