import { todayStart } from "./dates";
import type { Task } from "./types";

export function isTodayOpen(t: Task): boolean {
  return !t.done && t.plannedFor != null && t.plannedFor === todayStart();
}

export function isFutureOpen(t: Task): boolean {
  return !t.done && t.plannedFor != null && t.plannedFor > todayStart();
}

export function isOverdueOpen(t: Task): boolean {
  return !t.done && t.plannedFor != null && t.plannedFor < todayStart();
}
