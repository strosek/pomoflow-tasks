# 0016 — Optional task estimates in settings

Status: done

## Goal

Make the estimate feature (0013) optional: a settings toggle that shows or hides estimate inputs
and the est-vs-actual comparison, so users who don't estimate aren't forced to see the field.

## Requirements

- Add a settings flag `showEstimates` (default `true`) in the settings model (0001).
- When enabled: show the per-task `est` input and the `est Xm · actual Y` comparison as today.
- When disabled: hide the estimate input on every task row and suppress the estimate comparison
  bits in the stats line.
- Existing stored estimates are preserved when disabled (just hidden), so toggling back on
  restores them.
- Add the toggle to the Settings dialog (a checkbox).

## Acceptance criteria

- Turning estimates off hides all estimate inputs and comparisons immediately.
- Stored estimates survive the toggle (off and back on).
- The toggle persists across reloads.
