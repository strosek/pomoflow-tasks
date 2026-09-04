# 0017 — Sort tasks by priority / type / date created

Status: done

## Goal

Let the user choose how the task board is ordered — by priority, by quadrant (type), or by date
created — instead of the current fixed order (done first, then priority, then created).

## Requirements

- Add a small sort control (select) on the board with options:
  - **Priority** (default, current behavior: incomplete first, then priority, then created)
  - **Type** (quadrant order q1 → q2 → q3 → q4, incomplete first)
  - **Newest** (by date created, newest first; incomplete first)
- Sorting applies to the currently filtered list (0015).
- Keep done tasks grouped last in all modes so completed work stays out of the way.
- Sort selection is view-state only (ephemeral); persistence is optional and out of scope to
  avoid bloat.

## Acceptance criteria

- Each sort option reorders the board as specified.
- Done tasks remain grouped after incomplete ones in every mode.
- The selected sort applies on top of any active filters.
