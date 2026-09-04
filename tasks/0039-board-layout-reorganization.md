# 0039 — Board layout reorganization

Status: done

## Goal

Reorder the board and widen the layout so the page feels organized on desktop while staying calm
and single-purpose.

## Requirements

- Reorder the board sections: add-task form at the top (primary action), then Today, then the
  main task list, then Later (deferred), then Quick tasks. The summary bar stays near the top.
- Combine the summary bar, search, and filter/sort controls into one visually coherent toolbar
  area instead of loose rows.
- Widen `#app` from 760px to ~1000px max-width; keep a single column, with task text readable at
  a comfortable measure. No horizontal scroll at ≥1024px viewports.
- Make the header (title + action buttons) sticky on scroll with a subtle background so views
  remain reachable in long lists.
- Keep all empty states, plan sections, and quick sections working exactly as before (no behavior
  changes, layout only).

## Acceptance criteria

- Add task appears above the Today and main task lists.
- Search and filters read as one toolbar and filtering behavior is unchanged.
- At 1024px+ the content uses the wider layout with no horizontal scrolling.
- The sticky header does not overlap content and works with keyboard navigation.
- `npm run build`, `npm test`, and `npm run lint` pass.
