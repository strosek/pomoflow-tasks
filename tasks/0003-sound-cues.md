# 0003 — Sound cues

Status: done

## Goal

Play soft audio cues at session transitions (work → break, break → work, session finished) to
help users with ADHD notice phase changes without looking at the clock.

## Requirements

- Use the Web Audio API to synthesize gentle tones (no audio assets to download). Prefer a
  soft, biophilic chime (e.g. two short sine/triangle notes, low gain, ~0.2s envelope) over
  harsh beeps.
- Play on:
  - pomodoro work → break
  - break → work
  - session finish / pause (optional distinct cue)
- Respect the `soundEnabled` setting from 0001; mute when disabled.
- Respect browser autoplay policy: create/resume the `AudioContext` from a user gesture
  (starting a session is a click, so unlock there). No sound before first interaction.

## Implementation notes

- Add a small `src/sound.ts` module exposing `playCue(type: "workStart" | "breakStart" | "finish")`.
- Detect phase transitions by comparing consecutive `snapshot()` results (e.g. in the repaint
  loop, or a dedicated watcher) so cues fire exactly once per transition, not every tick.

## Acceptance criteria

- A transition from focus to break triggers a soft chime once.
- A transition from break to focus triggers a (distinct) soft chime once.
- Toggling sound off in settings silences all cues immediately.
- No sound plays before the user has interacted with the page.
