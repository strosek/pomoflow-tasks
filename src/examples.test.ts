import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseImport } from "./storage";

const EXAMPLES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "examples");

const EXAMPLES = ["typical-2-months.json", "flowtime-focused.json"];

function loadExample(name: string) {
  return parseImport(readFileSync(join(EXAMPLES_DIR, name), "utf8"));
}

describe("example exports", () => {
  it("every example file parses as a valid import", () => {
    for (const name of EXAMPLES) {
      const result = loadExample(name);
      expect(result.ok, `${name} should parse`).toBe(true);
    }
  });

  it.each(EXAMPLES)("%s has realistic, internally-consistent data", (name) => {
    const result = loadExample(name);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { tasks, sessions, notes } = result.payload.data;
    const sessionIds = new Set(sessions.map((s) => s.id));

    expect(tasks.length).toBeGreaterThan(0);
    expect(sessions.length).toBeGreaterThan(10);
    for (const t of tasks) {
      expect(["q1", "q2", "q3", "q4"]).toContain(t.quadrant);
      expect(Number.isInteger(t.priority)).toBe(true);
      expect(t.priority).toBeGreaterThanOrEqual(1);
      expect(t.priority).toBeLessThanOrEqual(5);
      if (t.done) expect(t.doneAt).not.toBeNull();
      else expect(t.doneAt).toBeNull();
    }
    for (const s of sessions) {
      expect(["pomodoro", "flowtime"]).toContain(s.technique);
      expect(["running", "paused", "done"]).toContain(s.status);
      expect(s.startedAt).toBeLessThanOrEqual(s.endedAt ?? s.startedAt);
    }
    // Every note points at a session that exists.
    for (const n of notes) expect(sessionIds.has(n.sessionId)).toBe(true);
  });
});
