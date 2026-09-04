# 0012 — Focus streak

Status: done

## Goal

Show a gentle, non-numeric streak as a subtle biophilic visual (a growing leaf/mark) to
encourage consistency without gamifying with loud numbers.

## Requirements

- Define a "focus day": any day with at least one finished session.
- Track consecutive focus days ending today/yesterday; display as a small leaf/mark whose
  size/level grows with streak length.
- Place it dimly near the daily summary (0007) on the board.
- Derive from existing session `endedAt` timestamps; no new data model needed.
- Keep it subtle — no badges, no counters, no animation loops.

## Acceptance criteria

- A focus day increments the streak.
- A missed day resets the streak to zero.
- The visual is present but understated and does not distract.
