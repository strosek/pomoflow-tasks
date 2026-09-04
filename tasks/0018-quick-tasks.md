# 0018 — Quick tasks

Status: done

## Goal

Let the user flag small tasks (roughly two minutes or less) as "quick", group them on the board,
and close several of them within a single work session ("quick run").

## Model

- Add `quick: boolean` (default `false`) to `Task`. Marking a task quick is a small toggle on
  the task row (or in the add dialog). The flag is independent of `estimatedMin` (0013) so it
  still works when estimates are hidden (0016).
- "Quick" is roughly ≤ 2 minutes; the user decides, no enforcement.

## Board

- Incomplete quick tasks are grouped in a distinct **Quick tasks** section at the top of the
  board (visually separated, bordered), so they are easy to batch.
- Non-quick tasks keep the existing filters (0015) and sort (0017) in the main list. The quick
  section itself is not filtered/sorted by those controls.

## Quick run

- A quick task offers a "Quick run" start option: one continuous timer (flowtime-style count-up,
  drift-free) that runs across several quick tasks.
- The current quick task's title is shown on the clock (as with any session).
- Marking the current quick task done (or pressing "Next") closes it and advances the run to the
  next incomplete quick task without resetting the timer.
- Each closed task is recorded as a short finished session for its `taskId` (ended when you
  advance), so history (0002) reflects the work per task.
- The run ends when all quick tasks are closed or the user finishes it; finishing records the
  final task's session and the summary (0011 undo applies to the final task only).
- Restart notes and sound cues (0003) behave as in normal sessions.

## Acceptance criteria

- Toggling a task as quick moves it into the Quick tasks section.
- A quick run starts a single count-up timer across multiple quick tasks.
- Advancing closes the current quick task (done) and moves to the next, with no timer reset.
- History shows a finished session for each quick task closed during the run.
- Finishing the run records the last task and returns to the board.
