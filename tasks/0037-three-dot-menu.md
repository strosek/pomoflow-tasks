# 0037 — Three-dot row menu

Status: done

## Goal

Reduce visual clutter on task rows by replacing the stack of action icons with a single
"⋯" (three-dot) button that opens a small menu of actions.

## Requirements

- Each task row shows one compact "⋯" icon button (title "More actions").
- Clicking it opens a small popover menu with the existing row actions: Start, Edit, Quick
  (toggle), History, and Delete. Keep labels short (icons + text optional).
- The menu closes on outside click, on `Esc`, and on choosing an action.
- One menu open at a time; opening another closes the previous.
- Accessibility: menu is a list of buttons, `aria-expanded` on the trigger, focus stays usable
  with keyboard (arrows optional; Tab works).
- The quick-section rows (0018) keep their dedicated Run/bolt controls; only the main-list rows
  collapse into the menu.
- Session/header/board controls are unaffected.

## Acceptance criteria

- Task rows show a single ⋯ button instead of the individual action icons.
- The menu offers Start, Edit, Quick, History, Delete and performs the same actions.
- Menu closes on outside click and Esc.
- Layout is visibly cleaner/denser on the board.
