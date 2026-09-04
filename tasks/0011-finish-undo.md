# 0011 — Finish/pause undo

Status: done

## Goal

Protect against accidental session completion by offering a brief, non-blocking undo after
finishing (and optionally after a long pause).

## Requirements

- After finishing a session (currently final in `finishSession`), show a transient "Undo"
  affordance for ~3 seconds instead of only the summary.
- Undo restores the session to its pre-finish state (status `running`/`paused`, `endedAt` null,
  `activeSessionId` restored, repaint resumed) and removes the just-saved summary — no data is
  lost or duplicated.
- If the user does not undo, the finish stands as today.
- Optional: pause for longer than X minutes shows a "keep paused / resume / finish" prompt.

## Acceptance criteria

- Finishing then undoing returns to the running session with clock still accurate.
- Not undoing completes the session normally and records it in history.
- No duplicate or orphaned sessions after an undo.
