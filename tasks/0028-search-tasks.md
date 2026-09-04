# 0028 — Search tasks

Status: done

## Goal

Let the user quickly find a task by typing, searching across titles and tags, without scrolling.

## Requirements

- Add a compact search input on the board (e.g. a small field above the task list).
- Match is case-insensitive substring against task title and tag names; matches show as the
  filtered list (combined with existing filters/sort from 0015/0017).
- The search applies to the main list only; the quick section (0018) is unaffected unless empty
  results would hide everything (then show a "no matches" message).
- `/` keyboard shortcut focuses the search input; `Esc` clears it and blurs.
- Searching is instant as you type; no extra storage.

## Acceptance criteria

- Typing filters the list to matching tasks in real time.
- Search matches tag names (e.g. `#work` finds tasks tagged work) and title text.
- `/` focuses search; `Esc` clears and blurs.
- Search combines with the existing priority/type filters and sort.
