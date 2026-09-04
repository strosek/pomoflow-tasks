# 0042 — Typography & section hierarchy

Status: done

## Goal

Establish a consistent type scale and give the board's sections a clear visual hierarchy without
adding noise.

## Requirements

- Define a small set of font-size custom properties (e.g. `--text-xs`, `--text-sm`, `--text-md`,
  `--text-lg`) in `:root` and apply them across the app so meta text, body text, and titles are
  consistent.
- Standardize section headings: Today, Later, and Quick tasks get the same heading style and
  weight; keep them visually quieter than the page title.
- Differentiate plan sections: solid border for actionable sections (Today/Quick), dashed border
  for deferred (Later).
- Use tabular numerals for all durations, counts, and dates.
- Keep a minimum readable size for all text (nothing below ~0.72rem except tiny badges).

## Acceptance criteria

- Text sizes are consistent across board, history, dashboard, dialogs, and settings.
- Section headings read as one hierarchy level; deferred sections look visually distinct.
- All numeric values align via tabular numerals.
- Night and day themes both look correct.
