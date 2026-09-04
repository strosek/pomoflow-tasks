import type { AppState, Session, Settings, Task } from "./types";
import { MIN, activeElapsedMs } from "./timer";
import { DAY_MS, dayKey, startOfLocalDay, startOfWeek } from "./dates";

/** Actual work done in a session.
 *  - flowtime: all active time counts as work.
 *  - pomodoro: derive from completed focus blocks (breaks are excluded).
 */
export function sessionWorkMs(
  session: Session,
  settings: Settings,
  now: number = Date.now(),
): number {
  if (session.technique === "pomodoro") {
    return session.completedPomodoros * settings.pomodoroWorkMin * MIN;
  }
  return activeElapsedMs(session, session.endedAt ?? now);
}

export interface TaskTotals {
  workMs: number;
  sessionCount: number;
  pomodoroCount: number;
}

export function taskTotals(taskId: string, sessions: Session[], settings: Settings): TaskTotals {
  let workMs = 0;
  let sessionCount = 0;
  let pomodoroCount = 0;
  for (const s of sessions) {
    if (s.taskId !== taskId || s.status !== "done") continue;
    sessionCount += 1;
    workMs += sessionWorkMs(s, settings);
    if (s.technique === "pomodoro") pomodoroCount += s.completedPomodoros;
  }
  return { workMs, sessionCount, pomodoroCount };
}

export function doneSessions(state: AppState): Session[] {
  return state.sessions
    .filter((s) => s.status === "done")
    .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0));
}

/* ------------------------------------------------------------------ */
/* Daily / weekly summaries + streak (0007, 0012)                      */
/* ------------------------------------------------------------------ */

export interface PeriodTotals {
  workMs: number;
  pomodoroCount: number;
  sessionCount: number;
}

function totalsInRange(
  sessions: Session[],
  settings: Settings,
  fromMs: number,
  toMs: number,
): PeriodTotals {
  const out: PeriodTotals = { workMs: 0, pomodoroCount: 0, sessionCount: 0 };
  for (const s of sessions) {
    if (s.status !== "done") continue;
    const end = s.endedAt ?? s.startedAt;
    if (end < fromMs || end >= toMs) continue;
    out.sessionCount += 1;
    out.workMs += sessionWorkMs(s, settings);
    if (s.technique === "pomodoro") out.pomodoroCount += s.completedPomodoros;
  }
  return out;
}

export function todayTotals(sessions: Session[], settings: Settings): PeriodTotals {
  const today = startOfLocalDay(Date.now());
  return totalsInRange(sessions, settings, today, today + DAY_MS);
}

export function weekTotals(sessions: Session[], settings: Settings): PeriodTotals {
  const start = startOfWeek(Date.now());
  return totalsInRange(sessions, settings, start, start + 7 * DAY_MS);
}

/** Distinct focus days within the current week (used to decide when to show the week total). */
export function weekDayCount(sessions: Session[]): number {
  const start = startOfWeek(Date.now());
  const days = new Set<number>();
  for (const s of sessions) {
    if (s.status !== "done") continue;
    const end = s.endedAt ?? s.startedAt;
    if (end >= start && end < start + 7 * DAY_MS) days.add(startOfLocalDay(end));
  }
  return days.size;
}

/** Consecutive days (ending today or yesterday) with at least one finished session. */
export function focusStreak(sessions: Session[]): number {
  const days = new Set<string>();
  for (const s of sessions) {
    if (s.status === "done") days.add(dayKey(s.endedAt ?? s.startedAt));
  }
  let cursor = startOfLocalDay(Date.now());
  if (!days.has(dayKey(cursor))) cursor -= DAY_MS; // today empty, start from yesterday
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

/* ------------------------------------------------------------------ */
/* Tags (0023)                                                         */
/* ------------------------------------------------------------------ */

export interface TagCount {
  tag: string;
  open: number;
}

/** Open-task count per tag, most attention first (for the dashboard). */
export function tagAttention(tasks: Task[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    if (t.done) continue;
    for (const tag of t.tags ?? []) {
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, open]) => ({ tag, open }))
    .sort((a, b) => b.open - a.open || a.tag.localeCompare(b.tag));
}

/* ------------------------------------------------------------------ */
/* Focus time by quadrant / tag (0033)                                 */
/* ------------------------------------------------------------------ */

export interface FocusBucket {
  key: string;
  workMs: number;
}

/** Work time per quadrant (q1–q4), plus a "deleted" bucket for removed tasks. */
export function focusByQuadrant(
  sessions: Session[],
  tasks: Task[],
  settings: Settings,
): FocusBucket[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.status !== "done") continue;
    const task = byId.get(s.taskId);
    const key = task ? task.quadrant : "deleted";
    map.set(key, (map.get(key) ?? 0) + sessionWorkMs(s, settings));
  }
  const order = ["q1", "q2", "q3", "q4", "deleted"];
  return order.filter((k) => map.has(k)).map((key) => ({ key, workMs: map.get(key)! }));
}

/** Work time per tag (an untagged task counts as "untagged"). */
export function focusByTag(sessions: Session[], tasks: Task[], settings: Settings): FocusBucket[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.status !== "done") continue;
    const task = byId.get(s.taskId);
    const tags = task && task.tags.length ? task.tags : ["untagged"];
    const work = sessionWorkMs(s, settings);
    for (const tag of tags) map.set(tag, (map.get(tag) ?? 0) + work);
  }
  return [...map.entries()]
    .map(([key, workMs]) => ({ key, workMs }))
    .sort((a, b) => b.workMs - a.workMs);
}
