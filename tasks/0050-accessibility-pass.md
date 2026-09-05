# 0050 — Accessibility pass

Status: proposed

## Goal

Make the app usable with assistive tech and comfortable for everyone: keyboard, screen readers,
and reduced motion.

## Requirements

- Dialog/overlay focus management: focus moves into the dialog on open, is trapped while open,
  and returns to the trigger on close (audit `dialogs.ts`).
- `aria-live="polite"` region announcing timer phase changes, finishes, and toasts without
  spamming every tick.
- Add `prefers-reduced-motion` handling: disable clock/bar transitions and repaint smoothness
  (0038 charts, session clock).
- Contrast audit of `--text-faint`/`--text-dim` against both themes (0005); bump tokens where
  below WCAG AA.
- Ensure icon-only buttons have descriptive `aria-label`s everywhere (mostly done in 0027 —
  audit remaining).
- Focus-visible styles for all interactive elements (keyboard focus ring).

## Acceptance criteria

- Tab order and Esc/Enter behavior are consistent across board, dialogs, and session views.
- Screen reader announces session phase transitions and the finish toast.
- With "reduce motion" enabled, transitions and animations are minimized.
