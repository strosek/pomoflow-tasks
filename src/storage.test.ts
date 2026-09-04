import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./types";
import type { Settings } from "./types";
import {
  emptyState,
  loadBackup,
  loadSettings,
  loadState,
  parseImport,
  sanitizeSettings,
  sanitizeState,
  saveBackup,
  saveSettings,
  saveState,
} from "./storage";
import type { AppState } from "./types";

// Minimal localStorage shim for the Node test environment.
const store = new Map<string, string>();
beforeEach(() => store.clear());

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  },
  configurable: true,
});

const VALID_SETTINGS: Settings = { ...DEFAULT_SETTINGS, pomodoroWorkMin: 30 };

describe("sanitizeSettings", () => {
  it("passes valid settings through", () => {
    expect(sanitizeSettings(VALID_SETTINGS)).toEqual(VALID_SETTINGS);
  });

  it("clamps out-of-range values", () => {
    const s = sanitizeSettings({
      ...VALID_SETTINGS,
      pomodoroWorkMin: 5000,
      pomodoroLongBreakEvery: 0,
    });
    expect(s.pomodoroWorkMin).toBe(120);
    expect(s.pomodoroLongBreakEvery).toBe(1);
  });

  it("falls back to defaults for garbage", () => {
    expect(
      sanitizeSettings({ pomodoroWorkMin: "nope", soundPreset: "bogus", theme: "purple" }),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it("rejects invalid sound presets and themes", () => {
    const s = sanitizeSettings({ ...VALID_SETTINGS, soundPreset: "bogus", theme: "purple" });
    expect(s.soundPreset).toBe("chime");
    expect(s.theme).toBe("night");
  });
});

describe("sanitizeState", () => {
  it("passes valid state through", () => {
    const valid = {
      tasks: [
        {
          id: "t1",
          title: "A",
          priority: 2,
          quadrant: "q1",
          done: false,
          createdAt: 1,
          doneAt: null,
          estimatedMin: null,
          quick: false,
          tags: [],
          description: "",
          plannedFor: null,
        },
      ],
      sessions: [
        {
          id: "s1",
          taskId: "t1",
          technique: "pomodoro",
          plannedMs: 1500000,
          startedAt: 1,
          pausedAt: null,
          accumulatedPauseMs: 0,
          completedPomodoros: 0,
          endedAt: null,
          status: "running",
        },
      ],
      notes: [{ id: "n1", sessionId: "s1", text: "hi", createdAt: 1 }],
      activeSessionId: "s1",
    };
    expect(sanitizeState(valid)).toEqual(valid);
  });

  it("repairs corrupt task records and drops unknown fields", () => {
    const out = sanitizeState({
      tasks: [{ id: "t1", quadrant: "q9", priority: 99, tags: [1, "ok"] }],
    });
    expect(out.tasks).toHaveLength(1);
    const t = out.tasks[0];
    expect(t.quadrant).toBe("q2");
    expect(t.priority).toBe(5); // 99 clamps to the max of 1..5
    expect(t.tags).toEqual(["ok"]);
    expect(t.title).toBe("");
    expect(t.done).toBe(false);
    expect("notes" in t).toBe(false);
  });

  it("falls back to the default priority for non-numbers", () => {
    const out = sanitizeState({ tasks: [{ id: "t1", priority: "high" }] });
    expect(out.tasks[0].priority).toBe(3);
  });

  it("defaults missing arrays to empty", () => {
    expect(sanitizeState({})).toEqual(emptyState());
    expect(sanitizeState(null)).toEqual(emptyState());
  });

  it("clears activeSessionId that points at a done or missing session", () => {
    const doneSession = {
      id: "s1",
      taskId: "t1",
      technique: "flowtime",
      plannedMs: 0,
      startedAt: 1,
      pausedAt: null,
      accumulatedPauseMs: 0,
      completedPomodoros: 0,
      endedAt: 2,
      status: "done",
    };
    expect(
      sanitizeState({ sessions: [doneSession], activeSessionId: "s1" }).activeSessionId,
    ).toBeNull();
    expect(sanitizeState({ sessions: [], activeSessionId: "nope" }).activeSessionId).toBeNull();
  });

  it("keeps activeSessionId for a running session", () => {
    const running = {
      id: "s1",
      taskId: "t1",
      technique: "flowtime",
      plannedMs: 0,
      startedAt: 1,
      pausedAt: null,
      accumulatedPauseMs: 0,
      completedPomodoros: 0,
      endedAt: null,
      status: "running",
    };
    expect(sanitizeState({ sessions: [running], activeSessionId: "s1" }).activeSessionId).toBe(
      "s1",
    );
  });
});

describe("parseImport", () => {
  it("rejects non-JSON", () => {
    expect(parseImport("not json").ok).toBe(false);
  });

  it("rejects non-Pomoflow or wrong-version files", () => {
    expect(parseImport(JSON.stringify({ app: "other", version: 1 })).ok).toBe(false);
    expect(parseImport(JSON.stringify({ app: "pomoflow", version: 99 })).ok).toBe(false);
  });

  it("rejects exports missing data arrays", () => {
    expect(parseImport(JSON.stringify({ app: "pomoflow", version: 1, data: {} })).ok).toBe(false);
  });

  it("parses a valid export and sanitizes it", () => {
    const result = parseImport(
      JSON.stringify({
        app: "pomoflow",
        version: 1,
        data: { tasks: [], sessions: [], notes: [] },
        settings: { ...DEFAULT_SETTINGS, pomodoroWorkMin: 5000 },
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.data).toEqual(emptyState());
    expect(result.payload.settings.pomodoroWorkMin).toBe(120);
  });
});

describe("persistence", () => {
  it("round-trips state through localStorage", () => {
    const state: AppState = {
      ...emptyState(),
      tasks: [
        {
          id: "t1",
          title: "A",
          priority: 2,
          quadrant: "q1",
          done: false,
          createdAt: 1,
          doneAt: null,
          estimatedMin: null,
          quick: false,
          tags: [],
          description: "",
          plannedFor: null,
        },
      ],
    };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it("round-trips settings", () => {
    saveSettings(VALID_SETTINGS);
    expect(loadSettings()).toEqual(VALID_SETTINGS);
  });

  it("falls back to defaults on corrupt storage", () => {
    store.set("pomoflow:v1", "{oops");
    expect(loadState()).toEqual(emptyState());
  });

  it("backs up and restores data", () => {
    const state = emptyState();
    saveBackup(VALID_SETTINGS, state);
    expect(loadBackup()).toEqual({ settings: VALID_SETTINGS, data: state });
    expect(loadBackup()).not.toBeNull();
  });
});
