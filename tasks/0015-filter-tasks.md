# 0015 — Filter task list by priority / type

Status: done

## Goal

Let the user narrow the task board by priority and by quadrant (urgent/important type), so the
list stays focused and scannable for ADHD users.

## Requirements

- Add compact filter controls on the board (e.g. two small selects or pill toggles): one for
  priority, one for quadrant.
- Filters combine (AND): only tasks matching both selected filters are shown.
- "All" default for both, so behavior is unchanged until the user opts in.
- Filters are view-state only (not persisted); reset when returning to the board is acceptable.
- Keep it minimal: one row of small controls near the board header; no counts/badges unless
  trivial.

## Acceptance criteria

- Selecting a priority shows only tasks with that priority.
- Selecting a quadrant shows only tasks in that quadrant.
- Selecting both shows only tasks matching both.
- Resetting to "All" restores the full list.
