export type Quadrant = "q1" | "q2" | "q3" | "q4";

export type Technique = "pomodoro" | "flowtime";

export type SessionStatus = "running" | "paused" | "done";

export type Theme = "night" | "day";

export type SoundPreset = "chime" | "soft" | "breeze";

export type Phase = "work" | "shortBreak" | "longBreak";

/**
 * 0043: recurrence schedule for a task. `time` is minutes from local midnight
 * (the time of day the occurrence is due); omitted means "no specific time".
 */
export type Recurrence =
  | { every: "daily"; time?: number }
  | { every: "workdays"; time?: number } // Monday–Friday
  | { every: "weekly"; weekday?: number; time?: number } // 0 = Sunday .. 6 = Saturday; defaults to completion weekday
  | { every: "monthly"; day?: number; time?: number } // day of month (1..31); defaults to completion day
  | { every: "days"; interval: number; time?: number }; // legacy "every N days" (not offered in the UI)

export interface Task {
  id: string;
  title: string;
  priority: number; // 1 (highest) .. 5 (lowest)
  quadrant: Quadrant;
  done: boolean;
  createdAt: number;
  doneAt: number | null;
  estimatedMin: number | null;
  quick: boolean; // ~2 minute tasks, batched in a quick run
  tags: string[]; // parsed from #tags at creation
  description: string; // optional longer description (0026)
  plannedFor: number | null; // local midnight of the planned day (0029/0030)
  recurrence: Recurrence | null; // 0043: repeats after completion (null = one-off)
}

/** 0014: break countdown started automatically after finishing a session. */
export interface BreakState {
  endsAt: number;
  taskId: string;
  technique: Technique;
  done: boolean;
}

/** 0018: one continuous count-up run across several quick tasks. */
export interface QuickRun {
  startedAt: number;
  lastAdvance: number;
  taskId: string;
}

export interface Watch {
  sessionId: string;
  phase: Phase;
  running: boolean;
}

export interface FinishedRecord {
  session: Session;
  status: Session["status"];
  endedAt: number | null;
  activeId: string | null;
  completedPomodoros: number;
  newlyCreated: boolean;
  taskId?: string;
  prevDone?: boolean;
}

export interface RestartNote {
  id: string;
  sessionId: string;
  text: string;
  createdAt: number;
}

export interface Session {
  id: string;
  taskId: string;
  technique: Technique;
  plannedMs: number; // pomodoro work length; flowtime target (0 = open)
  startedAt: number; // epoch ms
  pausedAt: number | null; // epoch ms when paused, else null
  accumulatedPauseMs: number;
  completedPomodoros: number;
  endedAt: number | null;
  status: SessionStatus;
}

export interface AppState {
  tasks: Task[];
  sessions: Session[];
  notes: RestartNote[];
  activeSessionId: string | null;
}

export interface Settings {
  pomodoroWorkMin: number;
  pomodoroShortBreakMin: number;
  pomodoroLongBreakMin: number;
  pomodoroLongBreakEvery: number;
  flowtimeBreakRatio: number; // 0..1, suggested break = focus time × ratio
  soundEnabled: boolean;
  soundPreset: SoundPreset;
  autoBreak: boolean; // 0014: auto-start break countdown after a session
  showEstimates: boolean; // 0016: show/hide estimate inputs + comparison
  notificationsEnabled: boolean; // 0020: browser notifications on transitions
  maxFlowtimeMin: number; // 0021: cap flowtime length (0 = off)
  theme: Theme;
}

export const DEFAULT_SETTINGS: Settings = {
  pomodoroWorkMin: 25,
  pomodoroShortBreakMin: 5,
  pomodoroLongBreakMin: 15,
  pomodoroLongBreakEvery: 4,
  flowtimeBreakRatio: 0.2,
  soundEnabled: true,
  soundPreset: "chime",
  autoBreak: true,
  showEstimates: true,
  notificationsEnabled: false,
  maxFlowtimeMin: 0,
  theme: "night",
};

export interface ExportPayload {
  app: "pomoflow";
  version: 1;
  exportedAt: number;
  settings: Settings;
  data: AppState;
}

export const QUADRANT_LABEL: Record<Quadrant, string> = {
  q1: "Urgent · Important",
  q2: "Not urgent · Important",
  q3: "Urgent · Not important",
  q4: "Not urgent · Not important",
};

export function newId(): string {
  return crypto.randomUUID();
}
