# 0035 — Idle nudge during focus

Status: done

## Goal

Gently remind the user when a focus session has been running while they stepped away, so a
session isn't accidentally left running unnoticed.

## Requirements

- Watch `visibilitychange`: when the tab becomes hidden during a running focus session, record
  the hidden timestamp (the drift-safe timer keeps counting, as designed).
- When the tab becomes visible again, if the session has been running while hidden for longer
  than an idle threshold (e.g. 10 minutes), show a subtle toast "Session still running" and
  (if enabled) a notification (0020) and/or a soft cue.
- The toast offers to Pause or Finish the session.
- Only fires for running sessions; paused or finished sessions are ignored.

## Acceptance criteria

- Hiding the tab during a running session and returning after the threshold shows the nudge once.
- The nudge offers Pause/Finish and acts on the active session.
- No nudge for sessions that were paused or already finished while hidden.
