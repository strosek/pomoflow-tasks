# 0041 — Task row refinement

Status: done

## Goal

Declutter task rows for desktop scanning: encode quadrant and priority visually, tuck away
secondary actions, and keep the essential info readable.

## Requirements

- Add a 3px left border to each task row colored by quadrant (q1 clay, q2 green, q3 gold,
  q4 faint) while keeping a small text label for accessibility and clarity.
- Replace the "P2" priority text with a 1–5 dot indicator (filled dots, e.g. earth/gold);
  keep the numeric value in an accessible form (e.g. `aria-label` or tooltip).
- Move task stats (time, sessions, pomodoros) into a right-aligned, dim column with tabular
  numerals, separated from the action buttons.
- Show the row action buttons (play, quick, more) on hover only on devices that support hover;
  reveal them via keyboard focus (`:focus-within`) and always show them on touch devices
  (`@media (hover: none)`).
- Keep the overdue highlight working alongside the new left border (e.g. full border color plus
  the existing badge), and keep done rows faded with strikethrough.

## Acceptance criteria

- Quadrant and priority are visible at a glance without reading labels.
- Rows look less busy; stats are right-aligned and don't wrap under action buttons.
- Actions are reachable with mouse, keyboard, and touch.
- Overdue and done states remain clearly visible.
- `npm run build` and `npm test` pass.
