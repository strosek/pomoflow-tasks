import type { Recurrence } from "./types";

export const DAY_MS = 86_400_000;

export function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function todayStart(): number {
  return startOfLocalDay(Date.now());
}

/** Local midnight of the Monday that starts the week containing `ms`. */
export function startOfWeek(ms: number): number {
  const d = new Date(ms);
  const daysSinceMonday = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysSinceMonday);
  return d.getTime();
}

export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function formatDay(ms: number): string {
  return new Date(ms).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ymdForDate(ms: number): string {
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** 0043: minutes-from-midnight of the next occurrence's time of day, or null if unset. */
export function minutesInDay(ms: number): number {
  const d = new Date(ms);
  return d.getHours() * 60 + d.getMinutes();
}

/** 0043: "9:05 AM" style label for a minutes-from-midnight value, or "" when unset. */
export function formatTimeOfDay(minutes: number | null | undefined): string {
  if (minutes == null) return "";
  const d = new Date(0);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** 0043: local timestamp of the next occurrence after `from`, per the recurrence rule. */
export function nextDueDate(recurrence: Recurrence, from: number): number {
  const d = new Date(from);
  switch (recurrence.every) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "workdays":
      do {
        d.setDate(d.getDate() + 1);
      } while (d.getDay() === 0 || d.getDay() === 6);
      break;
    case "weekly": {
      const target = recurrence.weekday ?? d.getDay();
      let diff = target - d.getDay();
      if (diff <= 0) diff += 7;
      d.setDate(d.getDate() + diff);
      break;
    }
    case "monthly": {
      const day = Math.min(Math.max(1, Math.round(recurrence.day ?? d.getDate())), 31);
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
      const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(day, maxDay));
      break;
    }
    case "days":
      d.setDate(d.getDate() + Math.max(1, Math.round(recurrence.interval)));
      break;
  }
  return startOfLocalDay(d.getTime()) + (recurrence.time ?? 0) * 60_000;
}
