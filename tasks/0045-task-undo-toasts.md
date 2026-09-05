# 0045 — Undo toasts for task actions

Status: done

## Goal

Add short "Undo" toasts after destructive or easily-mistaken task actions, so users can recover
without digging through dialogs or re-creating work.

## Requirements

- Trigger a toast (reuse the existing toast UI) after: completing a task (incl. recurring
  reopen, 0043), deleting a task, deferring a task, and unplanning from today.
- The toast shows a short message plus an **Undo** button; it auto-dismisses after ~6s
  (consistent with existing toasts).
- Undo restores the previous task state (done flag, plannedFor, or restores the deleted task
  including its id so session history stays linked).
- No undo for quick-run advancement (0018) or session finish (0011 already covers it).
- Keyboard friendly: the toast button is focusable and `Esc` dismisses it.

## Acceptance criteria

- Completing a task shows an undo toast; clicking Undo restores it (and for recurring tasks
  cancels the reopen).
- Deleting a task shows an undo toast; Undo restores the task with its sessions intact.
- Toasts auto-dismiss and don't stack more than one at a time.
