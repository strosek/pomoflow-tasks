# 0009 — Keyboard shortcuts

Status: done

## Goal

Add minimal, discoverable keyboard shortcuts so keyboard-oriented users (common with ADHD) can
navigate without the mouse.

## Requirements

- Shortcuts apply only when appropriate:
  - `Space` — pause/resume the active session.
  - `N` — focus the "new task" input on the board.
  - `Esc` — close dialogs / exit no-distraction mode (0006).
  - `F` — finish the active session.
- Guard against firing when typing in an input/textarea/select (ignore shortcuts there, except
  `Esc` to blur).
- Show a short hint line in the session view and on the board so shortcuts are discoverable,
  not hidden.
- No shortcut settings UI; keep the list fixed and small.

## Acceptance criteria

- Each shortcut performs its action when not focused in a form field.
- Shortcuts are ignored while typing in inputs/textarea.
- A brief hint makes the available shortcuts visible.
