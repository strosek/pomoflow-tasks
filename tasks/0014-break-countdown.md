# 0014 — Auto-start break countdown

Status: done

## Goal

After finishing a work session, automatically start a break countdown using the suggested break
time, so the user doesn't have to remember to take the break themselves.

## Suggested break time

- **Pomodoro**: short break normally; long break when the just-finished pomodoro completes a
  cycle (`completedPomodoros % pomodoroLongBreakEvery === 0`). Durations come from settings (0001).
- **Flowtime**: `focus work × flowtimeBreakRatio` (already computed at finish, 0001).
- If the computed break is `0`, skip auto-starting (fall back to the current finish toast).

## Requirements

- Add a settings flag `autoBreak` (default `true`) to enable/disable auto-starting breaks.
- When enabled and a session finishes with a positive break time, start a **break timer**
  immediately after the finish toast/undo affordance.
- Break is a distinct, drift-free countdown (derive remaining from timestamps, like work
  sessions). Keep it ephemeral (not persisted in history); a reload during break drops it.
- Break view shows a clear "Break" label, the countdown, and a **Skip** button (returns to board).
- When the countdown reaches zero:
  - play the `workStart` cue,
  - show a "Break over" state with "Start focusing" (new work session for the same task) and
    "Done" (back to board).
- **Undo interaction (0011)**: if the user undoes the finish, cancel/never start the break.
- A new work session may also be started from the break view (before the countdown ends).

## Acceptance criteria

- Finishing a pomodoro starts a break countdown with the configured short/long break length.
- Finishing a flowtime session starts a break countdown of `focus × ratio`.
- Break end triggers the work-start cue and offers to start a new session.
- Skip and Done return to the board; undo prevents the break entirely.
- `autoBreak` off restores the current finish behavior.
