# 0046 — Natural-language quick-add

Status: done

## Goal

Extend the add-task input to parse common shorthand, so "review PRs #work tomorrow 9am !1"
creates a fully-specified task in one keystroke.

## Requirements

- Keep existing `#tag` parsing (0023) intact.
- Parse and remove from the title: `!N` or `pN` for priority (1–5), `today`/`tomorrow`/weekday
  names for `plannedFor`, and a time (`9am`, `18:00`) for the time of day (reuse 0043 time
  handling).
- Parsed values prefill the priority select / schedule but can be overridden manually before
  clicking Add.
- Unknown words are ignored; the cleaned title shows in the input as you type (live preview),
  or the title is silently stripped of parsed tokens on submit.
- Document the syntax in the placeholder and the About modal (0044).

## Acceptance criteria

- "buy milk tomorrow 9am" creates a task titled "buy milk" planned tomorrow at 09:00.
- "review PRs !1 #work" creates a priority-1 task tagged `#work`.
- Invalid fragments ("!9", "25:99") are ignored and remain in the title.
