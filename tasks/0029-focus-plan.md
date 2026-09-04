# 0029 — Focus plan (today)

Status: done

## Goal

Let the user pick a small set of tasks to focus on "today", surface them on the board and
dashboard, and start them quickly — helping avoid over-planning.

## Requirements

- Add `plannedFor: number | null` to `Task` (epoch ms at local midnight of the planned day).
- A "Today" action on task rows (in the row menu, 0037) marks the task as planned for today.
  Selecting it again clears the plan (toggle).
- Board shows a "Today" section at the top listing planned-for-today open tasks (compact rows
  with a quick Start), separate from the main list.
- Dashboard adds a "Today" card: planned open tasks with quick-start buttons and planned vs.
  done for today.
- Planned tasks remain editable/deletable like normal tasks.

## Acceptance criteria

- Marking a task for today moves it to the board's Today section.
- Unmarking removes it from the section.
- The dashboard Today card lists planned open tasks with Start actions.
- Planned-for-today status is derived from `plannedFor` and flows through export/import.
