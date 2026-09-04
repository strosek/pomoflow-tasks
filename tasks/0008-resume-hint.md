# 0008 — Next-action reminder on resume

Status: done

## Goal

When a task is resumed for a new session, surface the restart notes from its most recent
finished session so the user can pick up where they left off.

## Requirements

- Restart notes already persist (attached to sessions, from the original PoC).
- When starting a new session for a task, show that task's most recent restart notes at the top
  of the session view (dimmed, dismissible) as a "pick up where you left off" hint.
- Only show notes from the most recent finished session for that task; do not clutter with all
  historical notes.
- Notes remain editable/added via the existing notes section.

## Acceptance criteria

- Starting a session for a task with prior restart notes shows those notes as a hint.
- The hint is dismissible and does not interfere with the existing notes UI.
