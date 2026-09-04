#!/usr/bin/env node
/**
 * Generates example Pomoflow export files under examples/ with dates relative
 * to "today", so loading them exercises the dashboard, focus streak, and the
 * Today/Later plan sections. Deterministic for a given day.
 *
 * Usage: node scripts/generate-examples.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "examples");

/** Deterministic PRNG so re-runs are stable. */
function mulberry32(seed) {
  let s = seed;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function localMidnight(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function buildSettings(overrides = {}) {
  return {
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
    ...overrides,
  };
}

function taskFrom(spec) {
  return {
    id: spec.id,
    title: spec.title,
    priority: spec.priority,
    quadrant: spec.quadrant,
    done: typeof spec.doneDaysAgo === "number",
    createdAt: localMidnight(-(spec.createdDaysAgo ?? 70 + Math.floor(Math.random() * 20))),
    doneAt:
      typeof spec.doneDaysAgo === "number" ? localMidnight(-spec.doneDaysAgo) + 12 * HOUR : null,
    estimatedMin: spec.est ?? null,
    quick: spec.quick ?? false,
    tags: spec.tags ?? [],
    description: spec.desc ?? "",
    plannedFor: typeof spec.plannedOffset === "number" ? localMidnight(spec.plannedOffset) : null,
  };
}

function writeExport(name, settings, state) {
  const payload = {
    app: "pomoflow",
    version: 1,
    exportedAt: Date.now(),
    settings,
    data: state,
  };
  const file = join(OUT_DIR, name);
  writeFileSync(file, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return file;
}

/* ------------------------------------------------------------------ */
/* Example 1: typical-2-months.json                                    */
/* ------------------------------------------------------------------ */

const TYPICAL_TASKS = [
  {
    id: "t1",
    title: "Update Q3 budget spreadsheet",
    quadrant: "q1",
    priority: 1,
    tags: ["work"],
    est: 45,
    doneDaysAgo: 21,
    desc: "Reconcile the marketing line items before end of month.",
  },
  {
    id: "t2",
    title: "Send invoice to client",
    quadrant: "q1",
    priority: 2,
    tags: ["work", "admin"],
    est: 15,
    doneDaysAgo: 5,
  },
  {
    id: "t3",
    title: "Book dentist appointment",
    quadrant: "q2",
    priority: 3,
    tags: ["health"],
    est: 10,
    doneDaysAgo: 2,
  },
  {
    id: "t4",
    title: "Clean out fridge",
    quadrant: "q4",
    priority: 4,
    tags: ["home"],
    doneDaysAgo: 8,
  },
  {
    id: "t5",
    title: "Read 20 pages of Deep Work",
    quadrant: "q2",
    priority: 2,
    tags: ["study", "growth"],
    est: 30,
    doneDaysAgo: 1,
  },
  {
    id: "t6",
    title: "Renew gym membership",
    quadrant: "q2",
    priority: 3,
    tags: ["health"],
    doneDaysAgo: 14,
  },
  {
    id: "t7",
    title: "Order printer ink",
    quadrant: "q4",
    priority: 5,
    tags: ["admin"],
    quick: true,
    doneDaysAgo: 3,
  },
  {
    id: "t8",
    title: "Prepare presentation for Monday",
    quadrant: "q1",
    priority: 1,
    tags: ["work"],
    est: 60,
    plannedOffset: 0,
    desc: "Company all-hands deck. Start with the Q3 wins section.",
  },
  {
    id: "t9",
    title: "Plan team offsite",
    quadrant: "q2",
    priority: 2,
    tags: ["work"],
    est: 90,
    plannedOffset: 0,
  },
  {
    id: "t10",
    title: "Fix leaking faucet",
    quadrant: "q3",
    priority: 3,
    tags: ["home"],
    est: 30,
    plannedOffset: 3,
  },
  {
    id: "t11",
    title: "Write blog post about flowtime",
    quadrant: "q2",
    priority: 2,
    tags: ["study", "growth"],
    est: 120,
  },
  { id: "t12", title: "Organize digital photos", quadrant: "q4", priority: 5, tags: ["home"] },
  {
    id: "t13",
    title: "Review insurance policies",
    quadrant: "q2",
    priority: 3,
    tags: ["home", "admin"],
    est: 45,
  },
  {
    id: "t14",
    title: "Learn TypeScript generics",
    quadrant: "q2",
    priority: 2,
    tags: ["study"],
    est: 60,
  },
  {
    id: "t15",
    title: "Water the plants",
    quadrant: "q4",
    priority: 4,
    tags: ["home"],
    quick: true,
  },
  {
    id: "t16",
    title: "Reply to Sarah's email",
    quadrant: "q3",
    priority: 3,
    tags: ["work"],
    quick: true,
  },
  {
    id: "t17",
    title: "Schedule car maintenance",
    quadrant: "q3",
    priority: 3,
    tags: ["admin"],
    est: 20,
    plannedOffset: 1,
  },
];

const RESTART_NOTES = [
  "Pick up here: draft the Q3 wins slide next.",
  "Blocked on feedback from Maria; left a comment.",
  "Next up: section 3.4 examples.",
  "Almost done — just the summary is left.",
  "Split the remaining work into two smaller pomodoros.",
  "Sketched the outline; flesh out the middle section tomorrow.",
];

function generateTypical() {
  const rnd = mulberry32(0xc0ffee);
  const tasks = TYPICAL_TASKS.map(taskFrom);
  const idOf = (idx) => tasks[idx].id;
  const sessions = [];
  const notes = [];
  let seq = 0;

  const pickWeighted = (values, weights) => {
    const r = rnd();
    let acc = 0;
    for (let i = 0; i < values.length; i++) {
      acc += weights[i];
      if (r < acc) return values[i];
    }
    return values[values.length - 1];
  };

  const addSession = (startedAt, isPomodoro) => {
    const sessId = `s${++seq}`;
    const taskId = idOf(Math.floor(rnd() * tasks.length));
    if (isPomodoro) {
      const pomos = pickWeighted([1, 2, 3], [0.35, 0.45, 0.2]);
      const work = 25 * MIN;
      const short = 5 * MIN;
      sessions.push({
        id: sessId,
        taskId,
        technique: "pomodoro",
        plannedMs: work,
        startedAt,
        pausedAt: null,
        accumulatedPauseMs: 0,
        completedPomodoros: pomos,
        endedAt: startedAt + pomos * work + (pomos - 1) * short,
        status: "done",
      });
    } else {
      const dur = (40 + Math.floor(rnd() * 70)) * MIN;
      sessions.push({
        id: sessId,
        taskId,
        technique: "flowtime",
        plannedMs: 0,
        startedAt,
        pausedAt: null,
        accumulatedPauseMs: 0,
        completedPomodoros: 0,
        endedAt: startedAt + dur,
        status: "done",
      });
      if (rnd() < 0.3) {
        notes.push({
          id: `n${notes.length + 1}`,
          sessionId: sessId,
          text: RESTART_NOTES[Math.floor(rnd() * RESTART_NOTES.length)],
          createdAt: startedAt + dur,
        });
      }
    }
  };

  const sessionsOn = (dayMs) =>
    sessions.filter((s) => s.startedAt >= dayMs && s.startedAt < dayMs + DAY).length;

  for (let d = 60; d >= 0; d--) {
    const dayMs = localMidnight(-d);
    const weekday = new Date(dayMs).getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const recent = d <= 7;

    if (isWeekend && !recent && rnd() < 0.6) continue; // skip most weekend days early on
    if (!isWeekend && rnd() < 0.08) continue; // occasional weekday skip
    if (recent && d !== 0 && sessionsOn(dayMs) === 0 && rnd() < 0.5) continue; // still cover the streak window

    const count = pickWeighted([1, 2, 3, 4], [0.25, 0.35, 0.25, 0.15]);
    for (let k = 0; k < count; k++) {
      const hourStart = dayMs + (8 + Math.floor(rnd() * 12)) * HOUR;
      const startedAt = hourStart + Math.floor(rnd() * 4) * 30 * MIN;
      addSession(startedAt, rnd() < 0.45);
    }
  }

  // Guarantee the streak window (last 8 days) and today look active.
  for (let d = 0; d <= 7; d++) {
    const dayMs = localMidnight(-d);
    while (sessionsOn(dayMs) < (d === 0 ? 2 : 1)) {
      const startedAt = dayMs + (8 + Math.floor(rnd() * 12)) * HOUR;
      addSession(startedAt, rnd() < 0.4);
    }
  }

  return {
    tasks,
    sessions: sessions.sort((a, b) => a.startedAt - b.startedAt),
    notes,
    activeSessionId: null,
  };
}

/* ------------------------------------------------------------------ */
/* Example 2: flowtime-focused.json                                    */
/* ------------------------------------------------------------------ */

const FLOW_TASKS = [
  {
    id: "f1",
    title: "Draft chapter on focus techniques",
    quadrant: "q2",
    priority: 1,
    tags: ["writing", "book"],
    est: 180,
    createdDaysAgo: 45,
  },
  {
    id: "f2",
    title: "Refactor the reporting module",
    quadrant: "q1",
    priority: 1,
    tags: ["code", "work"],
    est: 240,
    plannedOffset: 0,
  },
  {
    id: "f3",
    title: "Learn French vocabulary",
    quadrant: "q2",
    priority: 2,
    tags: ["study", "language"],
    est: 45,
  },
  {
    id: "f4",
    title: "Edit podcast episode 12",
    quadrant: "q2",
    priority: 2,
    tags: ["podcast"],
    est: 90,
    plannedOffset: 0,
  },
  {
    id: "f5",
    title: "Plan garden layout for spring",
    quadrant: "q4",
    priority: 4,
    tags: ["home"],
    plannedOffset: 7,
  },
  {
    id: "f6",
    title: "Write monthly newsletter",
    quadrant: "q3",
    priority: 3,
    tags: ["work", "writing"],
    est: 60,
    doneDaysAgo: 2,
  },
  {
    id: "f7",
    title: "Record interview with the guest",
    quadrant: "q1",
    priority: 1,
    tags: ["podcast"],
    est: 150,
    plannedOffset: 1,
  },
  {
    id: "f8",
    title: "Take a long walk without phone",
    quadrant: "q4",
    priority: 5,
    tags: ["health"],
    quick: true,
    doneDaysAgo: 1,
  },
];

const PROGRESS_NOTES = [
  "Good momentum — finished the first half of the chapter.",
  "Deep focus session; solved the tricky refactor step.",
  "Got through 3 pages of vocabulary, next session reviews.",
  "Trimmed the podcast intro; outro still needs work.",
  "Outline for the newsletter is done.",
  "Flow was great; stopped while still interested.",
];

function generateFlowtime() {
  const rnd = mulberry32(0xd00df00d);
  const tasks = FLOW_TASKS.map(taskFrom);
  const sessions = [];
  const notes = [];
  let seq = 0;

  for (let d = 44; d >= 0; d--) {
    const dayMs = localMidnight(-d);
    const weekday = new Date(dayMs).getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const recent = d <= 7;

    if (isWeekend && !recent && rnd() < 0.5) continue;
    if (!isWeekend && rnd() < 0.15) continue;
    if (recent && sessions.length === 0 && rnd() < 0.5) continue;

    const count = pickWeighted(rnd, [1, 2, 3], [0.5, 0.35, 0.15]);
    for (let k = 0; k < count; k++) {
      const startedAt =
        dayMs + (9 + Math.floor(rnd() * 10)) * HOUR + Math.floor(rnd() * 4) * 30 * MIN;
      const dur = (60 + Math.floor(rnd() * 90)) * MIN; // 60–149 min, some capped at maxFlowtime
      const sessId = `s${++seq}`;
      const taskId = tasks[Math.floor(rnd() * tasks.length)].id;
      sessions.push({
        id: sessId,
        taskId,
        technique: "flowtime",
        plannedMs: 0,
        startedAt,
        pausedAt: null,
        accumulatedPauseMs: 0,
        completedPomodoros: 0,
        endedAt: startedAt + dur,
        status: "done",
      });
      if (rnd() < 0.8) {
        notes.push({
          id: `n${notes.length + 1}`,
          sessionId: sessId,
          text: PROGRESS_NOTES[Math.floor(rnd() * PROGRESS_NOTES.length)],
          createdAt: startedAt + dur,
        });
      }
    }
  }

  // Ensure a healthy recent streak and a couple of sessions today.
  for (let d = 0; d <= 6; d++) {
    const dayMs = localMidnight(-d);
    const has = sessions.some((s) => s.startedAt >= dayMs && s.startedAt < dayMs + DAY);
    if (!has) {
      const startedAt = dayMs + (9 + Math.floor(rnd() * 10)) * HOUR;
      const dur = 90 * MIN;
      const sessId = `s${++seq}`;
      sessions.push({
        id: sessId,
        taskId: tasks[Math.floor(rnd() * tasks.length)].id,
        technique: "flowtime",
        plannedMs: 0,
        startedAt,
        pausedAt: null,
        accumulatedPauseMs: 0,
        completedPomodoros: 0,
        endedAt: startedAt + dur,
        status: "done",
      });
    }
  }

  return {
    tasks,
    sessions: sessions.sort((a, b) => a.startedAt - b.startedAt),
    notes,
    activeSessionId: null,
  };
}

function pickWeighted(rnd, values, weights) {
  const r = rnd();
  let acc = 0;
  for (let i = 0; i < values.length; i++) {
    acc += weights[i];
    if (r < acc) return values[i];
  }
  return values[values.length - 1];
}

/* ------------------------------------------------------------------ */
/* Write files                                                         */
/* ------------------------------------------------------------------ */

mkdirSync(OUT_DIR, { recursive: true });

const typicalSettings = buildSettings();
const typical = generateTypical();
const typicalFile = writeExport("typical-2-months.json", typicalSettings, typical);
console.log(
  `wrote ${typicalFile} (${typical.tasks.length} tasks, ${typical.sessions.length} sessions, ${typical.notes.length} notes)`,
);

const flowSettings = buildSettings({
  pomodoroLongBreakMin: 20,
  pomodoroLongBreakEvery: 6,
  flowtimeBreakRatio: 0.25,
  soundPreset: "breeze",
  notificationsEnabled: true,
  maxFlowtimeMin: 120,
  theme: "day",
});
const flow = generateFlowtime();
const flowFile = writeExport("flowtime-focused.json", flowSettings, flow);
console.log(
  `wrote ${flowFile} (${flow.tasks.length} tasks, ${flow.sessions.length} sessions, ${flow.notes.length} notes)`,
);
