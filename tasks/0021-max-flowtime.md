# 0021 — Max flowtime duration

Status: done

## Goal

Cap how long a flowtime session can run (counting only active time), so an accidentally
forgotten session is auto-finished instead of running indefinitely.

## Requirements

- Add a settings value `maxFlowtimeMin` (default `0` = off). Values `1+` cap flowtime sessions
  in minutes.
- The cap applies to active elapsed time (pauses excluded), so paused sessions don't "use up"
  the cap.
- When a running flowtime session's active time reaches the cap, automatically finish it
  through the normal finish flow (0011): play the finish cue, record the session, show the
  finish toast (with undo), and start the suggested break if auto-break is on (0014).
- Add the field to the Settings dialog with `0` labelled as "off".
- Applies to flowtime sessions; pomodoro and quick runs are unaffected (pomodoro already
  bounded, quick runs are user-driven).

## Acceptance criteria

- A flowtime session auto-finishes at the configured active-time cap.
- Pauses don't count toward the cap.
- Setting `0` disables the cap entirely.
- Undo still restores the finished session (0011).
