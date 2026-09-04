# 0027 — Icon buttons with hover hints

Status: done

## Goal

Replace wordy labels on most buttons with compact icons so the UI is denser and less
overwhelming, while keeping everything discoverable via hover tooltips and screen-reader labels.

## Requirements

- Introduce a small, consistent inline SVG icon set (using `currentColor`, ~16–18px) for the
  most common actions; no emoji dependency.
- Convert compact controls to icon buttons:
  - header: theme, dashboard, history, settings
  - task rows: start, edit, quick, details, delete
  - history items: delete
  - board controls remain selects/labels
  - session view: keep the primary actions (Pause/Resume, Finish, Focus) readable — either
    icon + short label or a text label, since they are the core controls; secondary buttons
    (skip, back, dismiss) become icons.
  - dialogs: primary actions keep text; cancel/close can be icons.
- Every icon button gets a `title` attribute (hover hint) and an `aria-label`.
- Hover hints use the native `title` tooltip (lightweight, no extra library); focus-visible
  outline stays for keyboard users.
- Keep icon size/alignment consistent so rows don't grow.

## Acceptance criteria

- Most compact controls render as icons with hover tooltips.
- All icon-only buttons have `aria-label` and are keyboard-focusable.
- Primary session controls remain unambiguous (icon+label or text).
- Layout is visibly denser (smaller buttons, no wrapped rows where previously needed).
