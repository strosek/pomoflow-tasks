# 0034 — Sound preview in settings

Status: done

## Goal

Let the user hear a sound preset before committing to it, since they can't otherwise tell
"soft" vs "breeze" apart from names.

## Requirements

- In the Settings dialog (0001), next to the Sound preset select add a small "Preview" button
  that plays the currently selected preset's cues (e.g. the workStart then finish cue).
- The preview uses the existing `playCue` (0003) so it respects the audio unlock gesture (a
  click is a gesture, so it works immediately).
- No new settings or storage.

## Acceptance criteria

- Clicking Preview plays the selected preset's chime(s).
- Changing the preset select then previewing plays the newly selected preset.
- Preview does not persist anything.
