import { DEFAULT_SETTINGS, newId } from "./types";
import type { AppState, ExportPayload, RestartNote, Session, Settings, Task } from "./types";

const PRESETS = ["chime", "soft", "breeze"] as const;
const DAY_MS = 86_400_000;

export const STATE_KEY = "pomoflow:v1";
export const SETTINGS_KEY = "pomoflow:settings:v1";
export const BACKUP_KEY = "pomoflow:backup:v1";
export const EXPORT_APP = "pomoflow";
export const EXPORT_VERSION = 1;

export function emptyState(): AppState {
  return {
    tasks: [],
    sessions: [],
    notes: [],
    activeSessionId: null,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return emptyState();
    return sanitizeState(JSON.parse(raw));
  } catch (err) {
    console.error("Failed to load state, resetting.", err);
    return emptyState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save state.", err);
  }
}

function clampNum(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function clampNumOrNull(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, value));
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Merge an arbitrary (possibly partial) settings value into valid settings with clamped bounds. */
export function sanitizeSettings(raw: unknown): Settings {
  const s = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<Settings>;
  return {
    pomodoroWorkMin: clampNum(s.pomodoroWorkMin, 1, 120, DEFAULT_SETTINGS.pomodoroWorkMin),
    pomodoroShortBreakMin: clampNum(
      s.pomodoroShortBreakMin,
      1,
      60,
      DEFAULT_SETTINGS.pomodoroShortBreakMin,
    ),
    pomodoroLongBreakMin: clampNum(
      s.pomodoroLongBreakMin,
      1,
      90,
      DEFAULT_SETTINGS.pomodoroLongBreakMin,
    ),
    pomodoroLongBreakEvery: Math.round(
      clampNum(s.pomodoroLongBreakEvery, 1, 12, DEFAULT_SETTINGS.pomodoroLongBreakEvery),
    ),
    flowtimeBreakRatio: clampNum(s.flowtimeBreakRatio, 0, 1, DEFAULT_SETTINGS.flowtimeBreakRatio),
    soundEnabled:
      typeof s.soundEnabled === "boolean" ? s.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
    soundPreset: PRESETS.includes(s.soundPreset as Settings["soundPreset"])
      ? (s.soundPreset as Settings["soundPreset"])
      : DEFAULT_SETTINGS.soundPreset,
    autoBreak: typeof s.autoBreak === "boolean" ? s.autoBreak : DEFAULT_SETTINGS.autoBreak,
    showEstimates:
      typeof s.showEstimates === "boolean" ? s.showEstimates : DEFAULT_SETTINGS.showEstimates,
    notificationsEnabled:
      typeof s.notificationsEnabled === "boolean"
        ? s.notificationsEnabled
        : DEFAULT_SETTINGS.notificationsEnabled,
    maxFlowtimeMin: clampNum(s.maxFlowtimeMin, 0, 1440, DEFAULT_SETTINGS.maxFlowtimeMin),
    theme: s.theme === "day" ? "day" : "night",
  };
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return sanitizeSettings(JSON.parse(raw));
  } catch (err) {
    console.error("Failed to load settings, using defaults.", err);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save settings.", err);
  }
}

/* ------------------------------------------------------------------ */
/* State sanitization                                                  */
/* ------------------------------------------------------------------ */

function sanitizeTime(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const m = Math.round(value);
  if (m < 0 || m > 23 * 60 + 59) return undefined;
  return m;
}

function sanitizeRecurrence(raw: unknown): Task["recurrence"] {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const time = sanitizeTime(r.time);
  if (r.every === "daily") {
    return time === undefined ? { every: "daily" } : { every: "daily", time };
  }
  if (r.every === "workdays") {
    return time === undefined ? { every: "workdays" } : { every: "workdays", time };
  }
  if (r.every === "weekly") {
    const weekday = typeof r.weekday === "number" ? Math.round(r.weekday) : undefined;
    const w =
      weekday !== undefined && weekday >= 0 && weekday <= 6 ? weekday : undefined;
    const rec: Task["recurrence"] = { every: "weekly", ...(w !== undefined ? { weekday: w } : {}) };
    if (time !== undefined) rec.time = time;
    return rec;
  }
  if (r.every === "monthly") {
    const day = typeof r.day === "number" ? Math.round(r.day) : undefined;
    const d = day !== undefined && day >= 1 && day <= 31 ? day : undefined;
    const rec: Task["recurrence"] = { every: "monthly", ...(d !== undefined ? { day: d } : {}) };
    if (time !== undefined) rec.time = time;
    return rec;
  }
  if (r.every === "days") {
    const interval =
      typeof r.interval === "number" && Number.isFinite(r.interval)
        ? Math.max(1, Math.round(r.interval))
        : 1;
    const rec: Task["recurrence"] = { every: "days", interval };
    if (time !== undefined) rec.time = time;
    return rec;
  }
  return null;
}

function sanitizeTask(raw: unknown): Task {
  const t = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<Task>;
  return {
    id: str(t.id) || newId(),
    title: str(t.title),
    priority: Math.round(clampNum(t.priority, 1, 5, 3)),
    quadrant:
      t.quadrant === "q1" || t.quadrant === "q2" || t.quadrant === "q3" || t.quadrant === "q4"
        ? t.quadrant
        : "q2",
    done: typeof t.done === "boolean" ? t.done : false,
    createdAt:
      typeof t.createdAt === "number" && Number.isFinite(t.createdAt) ? t.createdAt : Date.now(),
    doneAt: typeof t.doneAt === "number" ? t.doneAt : null,
    estimatedMin: clampNumOrNull(t.estimatedMin, 0, 60 * 24),
    quick: typeof t.quick === "boolean" ? t.quick : false,
    tags: Array.isArray(t.tags) ? t.tags.filter((x): x is string => typeof x === "string") : [],
    description: str(t.description),
    plannedFor: typeof t.plannedFor === "number" ? t.plannedFor : null,
    recurrence: sanitizeRecurrence(t.recurrence),
  };
}

function sanitizeSession(raw: unknown): Session {
  const s = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<Session>;
  return {
    id: str(s.id) || newId(),
    taskId: str(s.taskId),
    technique: s.technique === "flowtime" ? "flowtime" : "pomodoro",
    plannedMs: clampNum(s.plannedMs, 0, 7 * DAY_MS, 0),
    startedAt:
      typeof s.startedAt === "number" && Number.isFinite(s.startedAt) ? s.startedAt : Date.now(),
    pausedAt: typeof s.pausedAt === "number" ? s.pausedAt : null,
    accumulatedPauseMs: clampNum(s.accumulatedPauseMs, 0, Number.MAX_SAFE_INTEGER, 0),
    completedPomodoros: Math.round(clampNum(s.completedPomodoros, 0, 100_000, 0)),
    endedAt: typeof s.endedAt === "number" ? s.endedAt : null,
    status: s.status === "running" || s.status === "paused" ? s.status : "done",
  };
}

function sanitizeNote(raw: unknown): RestartNote {
  const n = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<RestartNote>;
  return {
    id: str(n.id) || newId(),
    sessionId: str(n.sessionId),
    text: str(n.text),
    createdAt:
      typeof n.createdAt === "number" && Number.isFinite(n.createdAt) ? n.createdAt : Date.now(),
  };
}

/** Validate and repair an arbitrary (possibly partial/corrupt) state blob. */
export function sanitizeState(raw: unknown): AppState {
  const d = (typeof raw === "object" && raw !== null ? raw : {}) as Partial<AppState>;
  const tasks = Array.isArray(d.tasks) ? d.tasks.map(sanitizeTask) : [];
  const sessions = Array.isArray(d.sessions) ? d.sessions.map(sanitizeSession) : [];
  const notes = Array.isArray(d.notes) ? d.notes.map(sanitizeNote) : [];

  // Only keep activeSessionId if it points at a live (running/paused) session.
  const active = sessions.find((s) => s.id === d.activeSessionId);
  const activeSessionId = active && active.status !== "done" ? active.id : null;

  return { tasks, sessions, notes, activeSessionId };
}

export function buildExport(settings: Settings, state: AppState): ExportPayload {
  return {
    app: EXPORT_APP,
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    settings,
    data: state,
  };
}

export type ImportResult = { ok: true; payload: ExportPayload } | { ok: false; error: string };

export function parseImport(text: string): ImportResult {
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not valid JSON." };
  }

  if (typeof obj !== "object" || obj === null) {
    return { ok: false, error: "This file is not a Pomoflow export." };
  }
  const rec = obj as Record<string, unknown>;
  if (rec.app !== EXPORT_APP) {
    return { ok: false, error: "This file is not a Pomoflow export." };
  }
  if (rec.version !== EXPORT_VERSION) {
    return { ok: false, error: `Unsupported export version (${String(rec.version)}).` };
  }

  const data = rec.data;
  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "This export has no data section." };
  }
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.tasks) || !Array.isArray(d.sessions) || !Array.isArray(d.notes)) {
    return { ok: false, error: "This export is missing expected data arrays." };
  }

  return {
    ok: true,
    payload: {
      app: EXPORT_APP,
      version: EXPORT_VERSION,
      exportedAt: typeof rec.exportedAt === "number" ? rec.exportedAt : Date.now(),
      settings: sanitizeSettings(rec.settings),
      data: sanitizeState(rec.data),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Backup before destructive actions (0031)                            */
/* ------------------------------------------------------------------ */

export interface BackupData {
  settings: Settings;
  data: AppState;
}

export function saveBackup(settings: Settings, state: AppState): void {
  try {
    localStorage.setItem(
      BACKUP_KEY,
      JSON.stringify({ settings, data: state } satisfies BackupData),
    );
  } catch (err) {
    console.error("Failed to save backup.", err);
  }
}

export function loadBackup(): BackupData | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BackupData>;
    const d = parsed.data;
    if (!d || !Array.isArray(d.tasks) || !Array.isArray(d.sessions) || !Array.isArray(d.notes)) {
      return null;
    }
    return {
      settings: sanitizeSettings(parsed.settings),
      data: sanitizeState(d),
    };
  } catch {
    return null;
  }
}
