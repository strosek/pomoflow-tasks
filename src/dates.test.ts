import { describe, expect, it } from "vitest";
import { nextDueDate, startOfLocalDay } from "./dates";

// Construct a local date at a given time on a known weekday.
// NOTE: weekday checks are deterministic via getDay().
function at(ms: number, hour: number, min = 0): number {
  const d = new Date(ms);
  d.setHours(hour, min, 0, 0);
  return d.getTime();
}

describe("nextDueDate", () => {
  const dayGap = (from: number, next: number): number =>
    (startOfLocalDay(next) - startOfLocalDay(from)) / 86_400_000;

  it("daily recurs on the next local midnight", () => {
    const from = at(Date.UTC(2026, 2, 4, 10, 30), 10, 30);
    const d = new Date(from);
    d.setHours(0, 0, 0, 0);
    expect(nextDueDate({ every: "daily" }, from)).toBe(d.getTime() + 86_400_000);
  });

  it("weekly with a fixed weekday lands on that weekday", () => {
    // 2026-03-04 is a Wednesday (getDay() === 3).
    const from = at(Date.UTC(2026, 2, 4, 10), 10);
    const nextFriday = nextDueDate({ every: "weekly", weekday: 5 }, from);
    expect(new Date(nextFriday).getDay()).toBe(5);
    expect(dayGap(from, nextFriday)).toBeGreaterThanOrEqual(1);
    expect(dayGap(from, nextFriday)).toBeLessThanOrEqual(7);
  });

  it("weekly without a weekday defaults to the completion weekday", () => {
    const from = at(Date.UTC(2026, 2, 4, 10), 10); // Wednesday
    const next = nextDueDate({ every: "weekly" }, from);
    expect(new Date(next).getDay()).toBe(3);
    expect(dayGap(from, next)).toBe(7);
  });

  it("every N days recurs after N days and clamps to at least 1", () => {
    const from = at(Date.UTC(2026, 2, 4, 10), 10);
    expect(dayGap(from, nextDueDate({ every: "days", interval: 3 }, from))).toBe(3);
    expect(dayGap(from, nextDueDate({ every: "days", interval: 0 }, from))).toBe(1);
  });

  it("workdays skips weekends", () => {
    // 2026-03-06 is a Friday.
    const friday = at(Date.UTC(2026, 2, 6, 10), 10);
    expect(new Date(friday).getDay()).toBe(5);
    const nextMonday = nextDueDate({ every: "workdays" }, friday);
    expect(new Date(nextMonday).getDay()).toBe(1);
    expect(dayGap(friday, nextMonday)).toBe(3);

    // 2026-03-04 is a Wednesday -> next workday is Thursday.
    const wednesday = at(Date.UTC(2026, 2, 4, 10), 10);
    const nextThursday = nextDueDate({ every: "workdays" }, wednesday);
    expect(new Date(nextThursday).getDay()).toBe(4);
    expect(dayGap(wednesday, nextThursday)).toBe(1);
  });

  it("monthly recurs on the chosen day of next month", () => {
    // 2026-01-15 -> next is 2026-02-15.
    const jan15 = at(Date.UTC(2026, 0, 15, 10), 10);
    const feb15 = nextDueDate({ every: "monthly", day: 15 }, jan15);
    expect(new Date(feb15).getMonth()).toBe(1);
    expect(new Date(feb15).getDate()).toBe(15);

    // Day 31 clamps to the last day of the month (Feb 2026 = 28 days).
    const jan31 = at(Date.UTC(2026, 0, 31, 10), 10);
    const next = nextDueDate({ every: "monthly", day: 31 }, jan31);
    expect(new Date(next).getMonth()).toBe(1);
    expect(new Date(next).getDate()).toBe(28);
  });

  it("applies the time of day to the next occurrence", () => {
    const from = at(Date.UTC(2026, 2, 4, 10, 30), 10, 30);
    const next = nextDueDate({ every: "daily", time: 9 * 60 }, from);
    expect(next - startOfLocalDay(next)).toBe(9 * 60 * 60_000);
    expect(dayGap(from, next)).toBe(1);
  });

  it("always returns local midnight when no time is set", () => {
    const from = at(Date.UTC(2026, 2, 4, 10, 30), 10, 30);
    const next = nextDueDate({ every: "daily" }, from);
    expect(next).toBe(startOfLocalDay(next));
  });
});