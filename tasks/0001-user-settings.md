# 0001 — User settings

Status: done

## Goal

Let the user configure timing values (pomodoro lengths, flowtime break ratio) and persist
them in browser storage, so sessions use the user's own values instead of hardcoded defaults.

## Settings model

```ts
interface Settings {
  pomodoroWorkMin: number; // default 25
  pomodoroShortBreakMin: number; // default 5
  pomodoroLongBreakMin: number; // default 15
  pomodoroLongBreakEvery: number; // default 4 (long break after N pomodoros)
  flowtimeBreakRatio: number; // default 0.2 (suggested break = work × ratio)
  soundEnabled: boolean; // default true (consumed by 0003 sound cues)
}
```

## Requirements

- Store settings in localStorage under a separate versioned key (e.g. `pomoflow:settings:v1`),
  independent of task/session data.
- Add a settings UI (gear icon opens a panel/dialog) with fields for each value, with sane
  min/max bounds (e.g. work 1–120 min, ratio 0–1).
- Persist on change; apply immediately to any running/new session.
- Replace the hardcoded `POMODORO` constants in `src/timer.ts` with values read from settings.
  `snapshot()`/`pomodoroSnapshot()` must accept durations instead of importing the constant.
- Flowtime break ratio: when a flowtime session is finished, compute `suggestedBreakMs =
activeElapsed × ratio` and surface it (e.g. in the finish summary / history).

## Acceptance criteria

- Changing "pomodoro length" changes the countdown for the next pomodoro session.
- Changing "break ratio" changes the suggested break shown when finishing a flowtime session.
- Settings survive a full page reload.
- Defaults are applied when no settings have been saved yet.
