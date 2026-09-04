# 0038 — Dashboard visualizations

Status: done

## Goal

Turn the dashboard (0024) from lists of numbers into rich, glanceable visualizations — charts,
graphs, and tables — so attention patterns become obvious at a look while keeping the calm,
ADHD-friendly aesthetic.

## Requirements

- No runtime dependencies: all visuals are built with vanilla DOM / CSS / inline SVG (see README
  "Tech"). No charting library.
- Keep the biophilic, dark-by-default look: quiet colors, generous spacing, no flashing or
  cluttered legend text.
- Replace plain stat lists with visual counterparts where appropriate:
  - **Focus trend chart**: daily focus time for the last 14 days as vertical bars (CSS or SVG),
    with today highlighted; hover/focus shows exact time per day. Empty days stay visible as
    dimmed slots.
  - **Week distribution**: average focus per weekday (Mon–Sun) as a small bar row, so the user
    sees their rhythm.
  - **Quadrant attention**: open tasks by quadrant (q1–q4) as horizontal proportion bars with
    counts, instead of the current number list.
  - **Tag attention**: keep the sorted list but add a proportion bar per tag relative to the
    largest bucket.
  - **Recent sessions table**: last N finished sessions as a compact table (task, technique,
    duration, ended date), reusing 0002 history data; links into the existing history view.
- All data is derived from existing state (sessions, tasks, tags, stats from 0007/0012/0033); no
  new storage or data model.
- Degrade gracefully with no data: show the existing friendly empty texts instead of blank
  charts.
- Numbers remain accessible: charts are decorative complements, not replacements for the text
  values (e.g. `aria-hidden` on decorative SVG, visible labels elsewhere).

## Acceptance criteria

- Dashboard shows a 14-day focus trend, weekday distribution, quadrant proportion bars, tag
  proportion bars, and a recent-sessions table.
- Charts match the totals shown by 0007/0033 and update after finishing a session without a
  reload.
- The app builds with zero new dependencies (`npm run build` and `npm test` pass).
- Empty states show friendly messages; nothing renders as a broken/blank chart.
