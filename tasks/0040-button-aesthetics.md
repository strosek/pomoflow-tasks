# 0040 — Button aesthetics

Status: done

## Goal

Make buttons feel consistent and tactile: uniform sizes, clear hover feedback, and a more
polished primary action — in both themes.

## Requirements

- All icon buttons share one hit size (32px, centered icon) and gain a hover state
  (`--surface-2` background, border tint) — they currently have none.
- The round task `.check` gets a hover background and a filled state (moss background, check
  mark in `--on-accent`) when the task is done.
- The `.primary` button gets subtle polish: a soft accent gradient or inner highlight plus the
  existing shadow; keep the current `:active` press and hover color shift.
- Ghost, danger, and quick-toggle buttons keep their roles but use the same radii, padding, and
  focus ring.
- All hover changes must work in day theme too — only use existing CSS custom properties.

## Acceptance criteria

- Every interactive button shows a visible hover state on desktop.
- All icon buttons are the same size and align in rows across board, history, and dashboard.
- Keyboard focus remains visible (`focus-visible`) on all buttons.
- Night and day themes both look correct.
