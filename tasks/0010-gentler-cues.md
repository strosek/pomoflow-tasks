# 0010 — Gentler cue options

Status: done

## Goal

Extend the existing sound cues (0003) with a small set of softer, natural-sounding chime
presets (e.g. wind/water-like) so the audio is gentler and more biophilic.

## Requirements

- Keep the current synthesized, no-asset approach (`src/sound.ts`).
- Add 2–3 preset variants per transition (current chime + one or two softer alternatives).
- Selectable from the Settings dialog (0001) alongside the existing sound toggle; persist the
  chosen preset.
- Default stays the current chime so behavior is unchanged out of the box.
- No volume control or per-event customization (avoid bloat).

## Acceptance criteria

- A non-default preset changes the cue character for transitions and finish.
- The chosen preset persists across reloads.
- Toggling sound off still silences everything.
