# 0052 — Error-proofing & data safety

Status: proposed

## Goal

Reduce avoidable mistakes and add safety nets around task data.

## Requirements

- Warn when creating a task whose title duplicates an existing open task (case-insensitive),
  with "Add anyway".
- Delete confirmation dialog lists the task's session count ("This task has 4 sessions");
  reuses 0022 messaging.
- Daily backup snapshots: in addition to the destructive-action backup (0031), keep the last N
  (e.g. 3) daily snapshots in localStorage and a "Restore from snapshot" picker in Settings.
- Confirm before "Clear all data" (0019) shows what will be lost (task/session counts).
- Sanitize/defensive parsing already handled (storage.ts) — extend coverage tests for new fields.

## Acceptance criteria

- Adding a duplicate title prompts for confirmation; "Add anyway" works.
- Deleting a task with sessions shows the count in the dialog.
- Daily snapshots exist and restoring one works; storage stays within quota (snapshots pruned).
