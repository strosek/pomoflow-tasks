import type { Phase, Session, Settings, Technique } from "./types";

export const MIN = 60_000;

export interface TimerConfig {
  pomodoroWorkMs: number;
  pomodoroShortBreakMs: number;
  pomodoroLongBreakMs: number;
  pomodoroLongBreakEvery: number;
}

export function configFromSettings(settings: Settings): TimerConfig {
  return {
    pomodoroWorkMs: settings.pomodoroWorkMin * MIN,
    pomodoroShortBreakMs: settings.pomodoroShortBreakMin * MIN,
    pomodoroLongBreakMs: settings.pomodoroLongBreakMin * MIN,
    pomodoroLongBreakEvery: settings.pomodoroLongBreakEvery,
  };
}

export type { Phase };

export interface TimerSnapshot {
  phase: Phase;
  /** ms remaining in the current phase (null for open-ended flowtime) */
  remainingMs: number | null;
  /** total active (non-paused) elapsed ms since session start */
  elapsedMs: number;
  running: boolean;
  completedPomodoros: number;
}

/** Active (non-paused) elapsed time, drift-free: derived from wall-clock timestamps. */
export function activeElapsedMs(session: Session, now: number): number {
  const anchor = session.pausedAt ?? now;
  return Math.max(0, anchor - session.startedAt - session.accumulatedPauseMs);
}

function flowtimeSnapshot(session: Session, now: number): TimerSnapshot {
  return {
    phase: "work",
    remainingMs:
      session.plannedMs > 0 ? Math.max(0, session.plannedMs - activeElapsedMs(session, now)) : null,
    elapsedMs: activeElapsedMs(session, now),
    running: session.status === "running",
    completedPomodoros: session.completedPomodoros,
  };
}

function pomodoroSnapshot(session: Session, config: TimerConfig, now: number): TimerSnapshot {
  const elapsed = activeElapsedMs(session, now);
  const {
    pomodoroWorkMs: work,
    pomodoroShortBreakMs: shortBreak,
    pomodoroLongBreakMs: longBreak,
    pomodoroLongBreakEvery: every,
  } = config;

  // One cycle is `every` focus blocks separated by short breaks, then a long break.
  const segments: Array<{ phase: Phase; dur: number }> = [];
  for (let i = 0; i < every; i++) {
    segments.push({ phase: "work", dur: work });
    if (i < every - 1) segments.push({ phase: "shortBreak", dur: shortBreak });
  }
  segments.push({ phase: "longBreak", dur: longBreak });

  const cycleLen = segments.reduce((sum, s) => sum + s.dur, 0);
  let pos = elapsed % cycleLen;
  let completed = 0;
  let phase: Phase = "work";
  let remainingInPhase = work;

  for (const segment of segments) {
    if (pos < segment.dur) {
      phase = segment.phase;
      remainingInPhase = segment.dur - pos;
      break;
    }
    pos -= segment.dur;
    if (segment.phase === "work") completed += 1;
  }

  // Also account for full cycles already passed.
  const fullCycles = Math.floor(elapsed / cycleLen);
  completed += fullCycles * every;

  return {
    phase,
    remainingMs: remainingInPhase,
    elapsedMs: elapsed,
    running: session.status === "running",
    completedPomodoros: completed,
  };
}

export function snapshot(
  session: Session,
  config: TimerConfig,
  now: number = Date.now(),
): TimerSnapshot {
  return session.technique === "flowtime"
    ? flowtimeSnapshot(session, now)
    : pomodoroSnapshot(session, config, now);
}

export function techniqueLabel(technique: Technique): string {
  return technique === "pomodoro" ? "Pomodoro" : "Flowtime";
}

export function formatMs(ms: number | null): string {
  if (ms === null) return "--:--";
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Count-up clock for open-ended flowtime (supports hours). */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m`;
  if (s > 0) return `${s}s`;
  return "0m";
}

export function phaseLabel(phase: Phase): string {
  switch (phase) {
    case "work":
      return "Focus";
    case "shortBreak":
      return "Short break";
    case "longBreak":
      return "Long break";
  }
}
