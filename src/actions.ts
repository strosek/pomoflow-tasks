import { announce } from "./announce";
import { DAY_MS, startOfLocalDay, todayStart, ymdForDate } from "./dates";
import { openDialog, showImportError, showMessage, downloadTextFile } from "./dialogs";
import { escapeHtml } from "./escape";
import { startRepaint, stopRepaint } from "./repaint";
import {
  activeSession,
  applyTheme,
  breakState,
  focusMode,
  lastFinished,
  openMenuTaskId,
  persist,
  quickRun,
  setBreakState,
  setDescriptionHintVisible,
  setFocusMode,
  setHiddenAt,
  setHiddenSessionId,
  setLastFinished,
  setLastWatch,
  setOpenMenuTaskId,
  setQuickRun,
  setResumeHintVisible,
  setSettings,
  setState,
  setSubView,
  settings,
  state,
  taskById,
  timerConfig,
} from "./state";
import {
  buildExport,
  emptyState,
  loadBackup,
  parseImport,
  saveBackup,
  saveSettings,
} from "./storage";
import { doneSessions, sessionWorkMs, taskTotals } from "./stats";
import { isTodayOpen } from "./tasks";
import { MIN, formatDuration, snapshot, techniqueLabel } from "./timer";
import type { Quadrant, Session, Settings, Task, Technique } from "./types";
import { QUADRANT_LABEL, newId } from "./types";
import { notify, requestPermission } from "./notify";
import { playCue } from "./sound";
import { render } from "./views";

/* ------------------------------------------------------------------ */
/* Task parsing                                                        */
/* ------------------------------------------------------------------ */

function parseTags(title: string): string[] {
  const matches = Array.from(title.matchAll(/#([\p{L}\p{N}_-]+)/gu), (m) => m[1].toLowerCase());
  return [...new Set(matches)];
}

function stripTags(title: string): string {
  return title
    .replace(/#[\p{L}\p{N}_-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Task actions                                                        */
/* ------------------------------------------------------------------ */

export function addTask(): void {
  const titleInput = document.querySelector<HTMLInputElement>("#task-title");
  const priorityInput = document.querySelector<HTMLSelectElement>("#task-priority");
  const quadrantInput = document.querySelector<HTMLSelectElement>("#task-quadrant");
  const quickInput = document.querySelector<HTMLInputElement>("#task-quick");
  if (!titleInput || !priorityInput || !quadrantInput) return;

  const rawTitle = titleInput.value.trim();
  if (!rawTitle) return;
  const cleanTitle = stripTags(rawTitle);

  state.tasks.push({
    id: newId(),
    title: cleanTitle || rawTitle,
    priority: Number(priorityInput.value),
    quadrant: quadrantInput.value as Quadrant,
    done: false,
    createdAt: Date.now(),
    doneAt: null,
    estimatedMin: null,
    quick: quickInput?.checked ?? false,
    tags: parseTags(rawTitle),
    description: "",
    plannedFor: null,
  });
  persist();
  render();
}

function toggleTask(id: string): void {
  const task = taskById(id);
  if (!task) return;
  task.done = !task.done;
  task.doneAt = task.done ? Date.now() : null;
  persist();
  render();
}

function toggleQuick(id: string): void {
  const task = taskById(id);
  if (!task) return;
  task.quick = !task.quick;
  persist();
  render();
}

function toggleToday(id: string): void {
  const task = taskById(id);
  if (!task) return;
  task.plannedFor = isTodayOpen(task) ? null : todayStart();
  persist();
  render();
}

function openDeferDialog(id: string): void {
  const task = taskById(id);
  if (!task) return;
  // Default to tomorrow's local midnight; computed via Date so DST-safe.
  const defaultDate =
    task.plannedFor && task.plannedFor > todayStart()
      ? task.plannedFor
      : startOfLocalDay(Date.now() + DAY_MS);

  const overlay = openDialog(`
    <h3>Defer task</h3>
    <p class="dialog-task">${escapeHtml(task.title)}</p>
    <label class="field">
      <span>Planned date</span>
      <input type="date" id="defer-date" value="${ymdForDate(defaultDate)}" />
    </label>
    <div class="dialog-actions">
      <button id="defer-clear" class="ghost">Clear plan</button>
      <button id="defer-cancel" class="ghost">Cancel</button>
      <button id="defer-ok" class="primary">Save</button>
    </div>`);

  overlay.querySelector("#defer-cancel")!.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#defer-clear")!.addEventListener("click", () => {
    task.plannedFor = null;
    persist();
    overlay.remove();
    render();
  });
  overlay.querySelector("#defer-ok")!.addEventListener("click", () => {
    const value = overlay.querySelector<HTMLInputElement>("#defer-date")?.value;
    if (value) {
      const [y, m, d] = value.split("-").map(Number);
      const date = new Date(y, (m ?? 1) - 1, d ?? 1);
      task.plannedFor = startOfLocalDay(date.getTime());
    }
    persist();
    overlay.remove();
    render();
  });
}

function confirmDeleteTask(id: string): void {
  const task = taskById(id);
  if (!task) return;
  const overlay = openDialog(`
    <h3>Delete task?</h3>
    <p class="dialog-text">${escapeHtml(task.title)}. Session history for this task is kept but will be shown as "deleted task".</p>
    <div class="dialog-actions">
      <button id="del-task-cancel" class="ghost">Cancel</button>
      <button id="del-task-ok" class="danger-btn">Delete</button>
    </div>`);
  overlay.querySelector("#del-task-cancel")!.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#del-task-ok")!.addEventListener("click", () => {
    deleteTask(id);
    overlay.remove();
  });
}

function deleteTask(id: string): void {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  persist();
  render();
}

function confirmDeleteSession(sessionId: string): void {
  const session = state.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  const task = taskById(session.taskId);
  const overlay = openDialog(`
    <h3>Delete this session?</h3>
    <p class="dialog-text">${escapeHtml(task?.title ?? "Session")} · ${techniqueLabel(session.technique)} · ${formatDuration(sessionWorkMs(session, settings))}. This cannot be undone.</p>
    <div class="dialog-actions">
      <button id="del-cancel" class="ghost">Cancel</button>
      <button id="del-ok" class="danger-btn">Delete</button>
    </div>`);
  overlay.querySelector("#del-cancel")!.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#del-ok")!.addEventListener("click", () => {
    state.sessions = state.sessions.filter((s) => s.id !== sessionId);
    state.notes = state.notes.filter((n) => n.sessionId !== sessionId);
    persist();
    overlay.remove();
    render();
  });
}

export function setEstimate(id: string, value: string): void {
  const task = taskById(id);
  if (!task) return;
  const raw = value.trim();
  const n = raw === "" ? null : Number(raw);
  task.estimatedMin = n != null && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  persist();
  render();
}

function openEditTask(id: string): void {
  const task = taskById(id);
  if (!task) return;

  const priorityOptions = [1, 2, 3, 4, 5]
    .map((p) => `<option value="${p}" ${task.priority === p ? "selected" : ""}>${p}</option>`)
    .join("");
  const quadrantOptions = (["q1", "q2", "q3", "q4"] as Quadrant[])
    .map(
      (q) =>
        `<option value="${q}" ${task.quadrant === q ? "selected" : ""}>${QUADRANT_LABEL[q]}</option>`,
    )
    .join("");

  const overlay = openDialog(`
    <h3>Edit task</h3>
    <form id="edit-form">
      <label class="field">
        <span>Title</span>
        <input type="text" id="edit-title" value="${escapeHtml(task.title)}" />
      </label>
      <div class="settings-grid">
        <label class="field">
          <span>Priority</span>
          <select id="edit-priority">${priorityOptions}</select>
        </label>
        <label class="field">
          <span>Quadrant</span>
          <select id="edit-quadrant">${quadrantOptions}</select>
        </label>
        ${
          settings.showEstimates
            ? `<label class="field">
                <span>Estimate (min)</span>
                <input type="number" id="edit-estimate" min="0" value="${task.estimatedMin ?? ""}" />
              </label>`
            : ""
        }
        <label class="field check-field">
          <span>Quick</span>
          <input type="checkbox" id="edit-quick" ${task.quick ? "checked" : ""} />
        </label>
      </div>
      <label class="field">
        <span>Tags (#tag)</span>
        <input type="text" id="edit-tags" value="${escapeHtml((task.tags ?? []).join(" "))}" placeholder="#work #home" />
      </label>
      <label class="field">
        <span>Description</span>
        <textarea id="edit-desc" rows="3" placeholder="Optional longer description">${escapeHtml(task.description ?? "")}</textarea>
      </label>
      <div class="dialog-actions">
        <button type="button" id="edit-cancel" class="ghost">Cancel</button>
        <button type="submit" class="primary">Save</button>
      </div>
    </form>`);

  const form = overlay.querySelector<HTMLFormElement>("#edit-form")!;
  overlay.querySelector("#edit-cancel")!.addEventListener("click", () => overlay.remove());

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const titleField = overlay.querySelector<HTMLInputElement>("#edit-title")!.value;
    const tagsField = overlay.querySelector<HTMLInputElement>("#edit-tags")?.value ?? "";
    const cleanTitle = stripTags(titleField);
    if (!cleanTitle && !titleField.trim()) return;
    const estRaw = overlay.querySelector<HTMLInputElement>("#edit-estimate")?.value.trim() ?? "";
    const est = estRaw === "" ? null : Number(estRaw);

    task.title = cleanTitle || titleField.trim();
    task.priority = Math.min(
      5,
      Math.max(1, Number(overlay.querySelector<HTMLSelectElement>("#edit-priority")!.value)),
    );
    task.quadrant = overlay.querySelector<HTMLSelectElement>("#edit-quadrant")!.value as Quadrant;
    task.estimatedMin = est != null && Number.isFinite(est) && est > 0 ? Math.round(est) : null;
    task.quick = overlay.querySelector<HTMLInputElement>("#edit-quick")?.checked ?? false;
    task.tags = parseTags(`${titleField} ${tagsField}`);
    task.description = overlay.querySelector<HTMLTextAreaElement>("#edit-desc")!.value;
    persist();
    overlay.remove();
    render();
  });
}

/* ------------------------------------------------------------------ */
/* Settings / data management                                          */
/* ------------------------------------------------------------------ */

function toggleTheme(): void {
  settings.theme = settings.theme === "night" ? "day" : "night";
  saveSettings(settings);
  applyTheme(settings.theme);
  render();
}

function openSettings(): void {
  const overlay = openDialog(`
    <h3>Settings</h3>
    <form id="settings-form">
      <div class="settings-grid">
        <label class="field">
          <span>Pomodoro focus (min)</span>
          <input type="number" id="set-work" min="1" max="120" value="${settings.pomodoroWorkMin}" />
        </label>
        <label class="field">
          <span>Short break (min)</span>
          <input type="number" id="set-short" min="1" max="60" value="${settings.pomodoroShortBreakMin}" />
        </label>
        <label class="field">
          <span>Long break (min)</span>
          <input type="number" id="set-long" min="1" max="90" value="${settings.pomodoroLongBreakMin}" />
        </label>
        <label class="field">
          <span>Long break after (#)</span>
          <input type="number" id="set-long-every" min="1" max="12" value="${settings.pomodoroLongBreakEvery}" />
        </label>
        <label class="field">
          <span>Flowtime break (% of focus)</span>
          <input type="number" id="set-break-ratio" min="0" max="100" step="5" value="${Math.round(settings.flowtimeBreakRatio * 100)}" />
        </label>
        <label class="field">
          <span>Max flowtime (min, 0 = off)</span>
          <input type="number" id="set-max-flowtime" min="0" max="1440" value="${settings.maxFlowtimeMin}" />
        </label>
        <label class="field">
          <span>Sound preset</span>
          <div class="field-row">
            <select id="set-preset">
              <option value="chime" ${settings.soundPreset === "chime" ? "selected" : ""}>Chime</option>
              <option value="soft" ${settings.soundPreset === "soft" ? "selected" : ""}>Soft</option>
              <option value="breeze" ${settings.soundPreset === "breeze" ? "selected" : ""}>Breeze</option>
            </select>
            <button type="button" id="btn-preview-sound" class="ghost">Preview</button>
          </div>
        </label>
        <label class="field check-field">
          <span>Sound cues</span>
          <input type="checkbox" id="set-sound" ${settings.soundEnabled ? "checked" : ""} />
        </label>
        <label class="field check-field">
          <span>Auto-start break</span>
          <input type="checkbox" id="set-auto-break" ${settings.autoBreak ? "checked" : ""} />
        </label>
        <label class="field check-field">
          <span>Task estimates</span>
          <input type="checkbox" id="set-estimates" ${settings.showEstimates ? "checked" : ""} />
        </label>
        <label class="field check-field">
          <span>Browser notifications</span>
          <input type="checkbox" id="set-notifications" ${settings.notificationsEnabled ? "checked" : ""} />
        </label>
      </div>

      <h4 class="dialog-section">Data</h4>
      <div class="data-actions">
        <button type="button" id="btn-export" class="ghost">Export data</button>
        <button type="button" id="btn-export-md" class="ghost">Export history (Markdown)</button>
        <button type="button" id="btn-import" class="ghost">Import data</button>
        <button type="button" id="btn-restore" class="ghost">Restore last backup</button>
      </div>

      <h4 class="dialog-section danger">Danger zone</h4>
      <div class="data-actions">
        <button type="button" id="btn-clear" class="danger-btn">Clear data</button>
      </div>

      <div class="dialog-actions">
        <button type="button" id="settings-cancel" class="ghost">Cancel</button>
        <button type="submit" class="primary">Save</button>
      </div>
    </form>`);

  const form = overlay.querySelector<HTMLFormElement>("#settings-form")!;
  const cancel = overlay.querySelector<HTMLButtonElement>("#settings-cancel")!;
  const exportBtn = overlay.querySelector<HTMLButtonElement>("#btn-export")!;
  const exportMdBtn = overlay.querySelector<HTMLButtonElement>("#btn-export-md")!;
  const importBtn = overlay.querySelector<HTMLButtonElement>("#btn-import")!;
  const restoreBtn = overlay.querySelector<HTMLButtonElement>("#btn-restore")!;
  const clearBtn = overlay.querySelector<HTMLButtonElement>("#btn-clear")!;
  const previewBtn = overlay.querySelector<HTMLButtonElement>("#btn-preview-sound")!;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const readNum = (sel: string, fallback: number): number => {
      const raw = Number((overlay.querySelector<HTMLInputElement>(sel)?.value ?? "").trim());
      return Number.isFinite(raw) ? raw : fallback;
    };
    const ratioPercent = Math.min(
      100,
      Math.max(0, readNum("#set-break-ratio", Math.round(settings.flowtimeBreakRatio * 100))),
    );
    const preset = overlay.querySelector<HTMLSelectElement>("#set-preset")
      ?.value as Settings["soundPreset"];

    const wantNotifications =
      overlay.querySelector<HTMLInputElement>("#set-notifications")?.checked ?? false;
    let notificationsEnabled = wantNotifications;
    if (wantNotifications) {
      const granted = await requestPermission();
      if (!granted) {
        notificationsEnabled = false;
        showMessage(
          "Notifications off",
          "Notification permission was not granted, so notifications stay off.",
        );
      }
    }

    setSettings({
      ...settings,
      pomodoroWorkMin: Math.min(120, Math.max(1, readNum("#set-work", settings.pomodoroWorkMin))),
      pomodoroShortBreakMin: Math.min(
        60,
        Math.max(1, readNum("#set-short", settings.pomodoroShortBreakMin)),
      ),
      pomodoroLongBreakMin: Math.min(
        90,
        Math.max(1, readNum("#set-long", settings.pomodoroLongBreakMin)),
      ),
      pomodoroLongBreakEvery: Math.min(
        12,
        Math.max(1, Math.round(readNum("#set-long-every", settings.pomodoroLongBreakEvery))),
      ),
      flowtimeBreakRatio: ratioPercent / 100,
      maxFlowtimeMin: Math.min(
        1440,
        Math.max(0, Math.round(readNum("#set-max-flowtime", settings.maxFlowtimeMin))),
      ),
      soundEnabled: overlay.querySelector<HTMLInputElement>("#set-sound")?.checked ?? true,
      soundPreset: preset === "soft" || preset === "breeze" ? preset : "chime",
      autoBreak: overlay.querySelector<HTMLInputElement>("#set-auto-break")?.checked ?? true,
      showEstimates: overlay.querySelector<HTMLInputElement>("#set-estimates")?.checked ?? true,
      notificationsEnabled,
    });
    saveSettings(settings);
    overlay.remove();
    render();
  });

  cancel.addEventListener("click", () => overlay.remove());

  previewBtn.addEventListener("click", () => {
    const preset =
      (overlay.querySelector<HTMLSelectElement>("#set-preset")?.value as Settings["soundPreset"]) ??
      "chime";
    playCue("workStart", preset);
    window.setTimeout(() => playCue("finish", preset), 500);
  });

  exportBtn.addEventListener("click", () => {
    downloadTextFile(
      `pomoflow-export-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(buildExport(settings, state), null, 2),
      "application/json",
    );
  });

  exportMdBtn.addEventListener("click", () => {
    downloadTextFile(
      `pomoflow-history-${new Date().toISOString().slice(0, 10)}.md`,
      buildMarkdownHistory(),
      "text/markdown;charset=utf-8",
    );
  });

  importBtn.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = parseImport(String(reader.result ?? ""));
        if (!result.ok) {
          showImportError(result.error);
          return;
        }
        confirmImport(result.payload, overlay);
      };
      reader.readAsText(file);
    });
    input.click();
  });

  restoreBtn.addEventListener("click", () => {
    const backup = loadBackup();
    if (!backup) {
      showMessage("No backup", "There is no saved backup to restore.");
      return;
    }
    const confirm = openDialog(`
      <h3>Restore last backup?</h3>
      <p class="dialog-text">Replace current data with the last saved backup (${backup.data.tasks.length} tasks, ${backup.data.sessions.length} sessions)?</p>
      <div class="dialog-actions">
        <button id="restore-cancel" class="ghost">Cancel</button>
        <button id="restore-ok" class="primary">Restore</button>
      </div>`);
    confirm.querySelector("#restore-cancel")!.addEventListener("click", () => confirm.remove());
    confirm.querySelector("#restore-ok")!.addEventListener("click", () => {
      setState(backup.data);
      setSettings(backup.settings);
      persist();
      saveSettings(settings);
      applyTheme(settings.theme);
      resetTransientState();
      confirm.remove();
      overlay.remove();
      render();
    });
  });

  clearBtn.addEventListener("click", () => {
    const confirm = openDialog(`
      <h3>Clear all data?</h3>
      <p class="dialog-text">A backup will be saved first. This deletes all tasks, sessions, and notes. It cannot be undone. Settings are kept.</p>
      <div class="dialog-actions">
        <button id="clear-cancel" class="ghost">Cancel</button>
        <button id="clear-ok" class="danger-btn">Delete everything</button>
      </div>`);
    confirm.querySelector("#clear-cancel")!.addEventListener("click", () => confirm.remove());
    confirm.querySelector("#clear-ok")!.addEventListener("click", () => {
      clearAllData();
      confirm.remove();
      overlay.remove();
    });
  });
}

function confirmImport(
  payload: ReturnType<typeof buildExport>,
  settingsOverlay: HTMLElement,
): void {
  const overlay = openDialog(`
    <h3>Import data?</h3>
    <p class="dialog-text">
      A backup of your current data will be saved first. Replace current data with ${payload.data.tasks.length} task(s), ${payload.data.sessions.length} session(s)?
      Imported settings will also overwrite current settings.
    </p>
    <div class="dialog-actions">
      <button id="import-cancel" class="ghost">Cancel</button>
      <button id="import-ok" class="primary">Replace</button>
    </div>`);

  overlay.querySelector("#import-cancel")!.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#import-ok")!.addEventListener("click", () => {
    saveBackup(settings, state);
    setState(payload.data);
    setSettings(payload.settings);
    persist();
    saveSettings(settings);
    applyTheme(settings.theme);
    resetTransientState();
    settingsOverlay.remove();
    render();
  });
}

function resetTransientState(): void {
  setSubView(null);
  setFocusMode(false);
  setResumeHintVisible(true);
  setDescriptionHintVisible(true);
  setBreakState(null);
  setQuickRun(null);
  setLastWatch(null);
  setLastFinished(null);
  setOpenMenuTaskId(null);
  setHiddenAt(null);
  setHiddenSessionId(null);
  stopRepaint();
}

function clearAllData(): void {
  saveBackup(settings, state);
  setState(emptyState());
  resetTransientState();
  persist();
  render();
}

function buildMarkdownHistory(): string {
  const lines: string[] = ["# Pomoflow history", ""];
  const sessions = doneSessions(state);
  if (!sessions.length) {
    lines.push("No finished sessions yet.");
    return lines.join("\n");
  }
  const byTask = new Map<string, Session[]>();
  for (const s of sessions) {
    const arr = byTask.get(s.taskId) ?? [];
    arr.push(s);
    byTask.set(s.taskId, arr);
  }
  for (const [taskId, list] of byTask) {
    const task = taskById(taskId);
    lines.push(`## ${task?.title ?? "(deleted task)"}`, "");
    for (const s of list) {
      const date = new Date(s.endedAt ?? s.startedAt).toLocaleDateString();
      const work = sessionWorkMs(s, settings);
      const pomo =
        s.technique === "pomodoro" && s.completedPomodoros > 0
          ? `, ${s.completedPomodoros} pomodoro(s)`
          : "";
      lines.push(`- ${date} — ${techniqueLabel(s.technique)} — ${formatDuration(work)}${pomo}`);
    }
    const totals = taskTotals(taskId, state.sessions, settings);
    lines.push(
      "",
      `Total: ${formatDuration(totals.workMs)} across ${totals.sessionCount} session(s)`,
      "",
    );
  }
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

function startSession(taskId: string, technique: Technique): void {
  const now = Date.now();
  const config = timerConfig();
  const session: Session = {
    id: newId(),
    taskId,
    technique,
    plannedMs: technique === "pomodoro" ? config.pomodoroWorkMs : 0,
    startedAt: now,
    pausedAt: null,
    accumulatedPauseMs: 0,
    completedPomodoros: 0,
    endedAt: null,
    status: "running",
  };
  state.sessions.push(session);
  state.activeSessionId = session.id;
  setLastWatch(null);
  setFocusMode(false);
  setResumeHintVisible(true);
  setDescriptionHintVisible(true);
  setLastFinished(null);
  setHiddenAt(null);
  setHiddenSessionId(null);
  persist();
  startRepaint();
  render();
}

function promptStartSession(taskId: string): void {
  const task = taskById(taskId);
  if (!task) return;
  const workLabel = `${settings.pomodoroWorkMin} min`;

  const overlay = openDialog(`
    <h3>Start a session</h3>
    <p class="dialog-task">${escapeHtml(task.title)}</p>
    <button class="primary" data-tech="pomodoro">Pomodoro · ${workLabel}</button>
    <button class="primary" data-tech="flowtime">Flowtime · open</button>
    <button class="ghost" data-tech="cancel">Cancel</button>`);

  overlay.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("[data-tech]") as HTMLElement | null;
    if (!target) return;
    const tech = target.dataset.tech as Technique | "cancel";
    overlay.remove();
    if (tech === "cancel") return;
    startSession(taskId, tech);
  });
}

export function pauseSession(session: Session): void {
  if (session.status !== "running") return;
  session.pausedAt = Date.now();
  session.status = "paused";
  setHiddenAt(null);
  setHiddenSessionId(null);
  persist();
  render();
}

export function resumeSession(session: Session): void {
  if (session.status !== "paused" || session.pausedAt === null) return;
  session.accumulatedPauseMs += Date.now() - session.pausedAt;
  session.pausedAt = null;
  session.status = "running";
  persist();
  render();
}

export function beginFocusFromBreak(): void {
  if (!breakState) return;
  const { taskId, technique } = breakState;
  setBreakState(null);
  startSession(taskId, technique);
}

function skipBreak(): void {
  setBreakState(null);
  stopRepaint();
  render();
}

/* ------------------------------------------------------------------ */
/* Quick run (0018)                                                    */
/* ------------------------------------------------------------------ */

function nextQuickTask(excludeId: string): Task | null {
  return (
    state.tasks
      .filter((t) => t.quick && !t.done && t.id !== excludeId)
      .sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt)[0] ?? null
  );
}

function startQuickRun(taskId: string): void {
  setQuickRun({ startedAt: Date.now(), lastAdvance: Date.now(), taskId });
  setFocusMode(false);
  setLastFinished(null);
  startRepaint();
  render();
}

function recordQuickSession(task: Task, startedAt: number, endedAt: number): Session {
  const session: Session = {
    id: newId(),
    taskId: task.id,
    technique: "flowtime",
    plannedMs: 0,
    startedAt,
    pausedAt: null,
    accumulatedPauseMs: 0,
    completedPomodoros: 0,
    endedAt,
    status: "done",
  };
  state.sessions.push(session);
  return session;
}

function closeCurrentQuick(now: number): Session | null {
  const task = taskById(quickRun!.taskId);
  if (!task) return null;
  task.done = true;
  task.doneAt = now;
  return recordQuickSession(task, quickRun!.lastAdvance, now);
}

function endQuickRun(now: number, finalSession: Session, finalTask: Task): void {
  setQuickRun(null);
  stopRepaint();
  persist();
  if (settings.soundEnabled) playCue("finish", settings.soundPreset);
  setLastFinished({
    session: finalSession,
    status: "done",
    endedAt: now,
    activeId: null,
    completedPomodoros: 0,
    newlyCreated: true,
    taskId: finalTask.id,
    prevDone: false,
  });
  render();
  showFinishToast(finalSession, "Quick run finished.");
  window.setTimeout(() => {
    if (lastFinished?.session.id === finalSession.id) setLastFinished(null);
  }, 4000);
}

function advanceQuick(): void {
  const run = quickRun;
  if (!run) return;
  const now = Date.now();
  const closed = closeCurrentQuick(now);
  const next = nextQuickTask(run.taskId);
  if (!next) {
    if (closed) {
      const task = taskById(closed.taskId);
      if (task) {
        endQuickRun(now, closed, task);
        return;
      }
    }
    setQuickRun(null);
    stopRepaint();
    persist();
    render();
    return;
  }
  run.taskId = next.id;
  run.lastAdvance = now;
  persist();
  render();
}

export function finishQuick(): void {
  const now = Date.now();
  const closed = closeCurrentQuick(now);
  if (!closed) {
    setQuickRun(null);
    stopRepaint();
    persist();
    render();
    return;
  }
  const task = taskById(closed.taskId);
  if (!task) {
    setQuickRun(null);
    stopRepaint();
    persist();
    render();
    return;
  }
  endQuickRun(now, closed, task);
}

/* ------------------------------------------------------------------ */
/* Finish + undo                                                       */
/* ------------------------------------------------------------------ */

export function finishSession(session: Session): void {
  const now = Date.now();
  const config = timerConfig();
  const snap = snapshot(session, config, now);

  const record = {
    session,
    status: session.status,
    endedAt: session.endedAt,
    activeId: state.activeSessionId,
    completedPomodoros: session.completedPomodoros,
    newlyCreated: false,
  };

  if (session.technique === "pomodoro") {
    session.completedPomodoros = snap.completedPomodoros;
  }
  const workMs = sessionWorkMs(session, settings, now);
  const flowBreakMs =
    session.technique === "flowtime" ? Math.round(workMs * settings.flowtimeBreakRatio) : 0;

  let breakMs = 0;
  if (session.technique === "pomodoro") {
    const n = session.completedPomodoros;
    breakMs =
      n > 0 && n % settings.pomodoroLongBreakEvery === 0
        ? settings.pomodoroLongBreakMin * MIN
        : settings.pomodoroShortBreakMin * MIN;
  } else {
    breakMs = flowBreakMs;
  }

  session.status = "done";
  session.endedAt = now;
  state.activeSessionId = null;
  setLastWatch(null);
  setFocusMode(false);
  setHiddenAt(null);
  setHiddenSessionId(null);
  persist();
  stopRepaint();
  if (settings.soundEnabled) playCue("finish", settings.soundPreset);
  if (settings.notificationsEnabled) {
    const task = taskById(session.taskId);
    notify("Session finished", task ? task.title : "Session complete");
  }

  setLastFinished(record);
  if (settings.autoBreak && breakMs > 0) {
    setBreakState({
      endsAt: now + breakMs,
      taskId: session.taskId,
      technique: session.technique,
      done: false,
    });
    startRepaint();
  }
  render();

  let line: string;
  if (session.technique === "pomodoro") {
    line = `${session.completedPomodoros} pomodoro(s) · ${formatDuration(workMs)} of focus.`;
  } else {
    line = `${formatDuration(workMs)} of flowtime.`;
    if (flowBreakMs > 0) line += ` Suggested break: ~${formatDuration(flowBreakMs)}.`;
  }
  announce(`Session finished. ${line}`);
  showFinishToast(session, line);
  window.setTimeout(() => {
    if (lastFinished?.session.id === session.id) setLastFinished(null);
  }, 4000);
}

function undoFinish(): void {
  const record = lastFinished;
  if (!record) return;
  setLastFinished(null);
  setBreakState(null);

  if (record.newlyCreated) {
    state.sessions = state.sessions.filter((s) => s.id !== record.session.id);
    if (record.taskId) {
      const t = taskById(record.taskId);
      if (t) {
        t.done = record.prevDone ?? false;
        t.doneAt = record.prevDone ? t.doneAt : null;
      }
    }
    persist();
    stopRepaint();
    render();
    return;
  }

  const s = record.session;
  s.status = record.status;
  s.endedAt = record.endedAt;
  s.completedPomodoros = record.completedPomodoros;
  state.activeSessionId = record.activeId;
  setFocusMode(false);
  persist();
  if (record.activeId && record.status !== "done") startRepaint();
  render();
}

function showFinishToast(session: Session, line: string): void {
  const task = taskById(session.taskId);
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <span class="toast-text"><strong>Finished</strong> · ${escapeHtml(task?.title ?? "task")} · ${escapeHtml(line)}</span>
    <button id="undo-finish" class="primary">Undo</button>`;
  document.body.appendChild(toast);

  const dismiss = (): void => {
    if (lastFinished?.session.id === session.id) setLastFinished(null);
    toast.remove();
  };
  toast.querySelector("#undo-finish")!.addEventListener("click", (e) => {
    e.stopPropagation();
    undoFinish();
    dismiss();
  });
  window.setTimeout(dismiss, 4000);
}

/* ------------------------------------------------------------------ */
/* Notes management (0032)                                             */
/* ------------------------------------------------------------------ */

function editNote(noteId: string): void {
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) return;
  const overlay = openDialog(`
    <h3>Edit note</h3>
    <form id="note-edit-form">
      <textarea id="note-edit-text" rows="4">${escapeHtml(note.text)}</textarea>
      <div class="dialog-actions">
        <button type="button" id="note-edit-cancel" class="ghost">Cancel</button>
        <button type="submit" class="primary">Save</button>
      </div>
    </form>`);
  overlay.querySelector("#note-edit-cancel")!.addEventListener("click", () => overlay.remove());
  overlay.querySelector<HTMLFormElement>("#note-edit-form")!.addEventListener("submit", (e) => {
    e.preventDefault();
    note.text = overlay.querySelector<HTMLTextAreaElement>("#note-edit-text")!.value;
    persist();
    overlay.remove();
    render();
  });
}

function deleteNote(noteId: string): void {
  state.notes = state.notes.filter((n) => n.id !== noteId);
  persist();
  render();
}

export function addNote(sessionId: string, text: string): void {
  if (!text.trim()) return;
  state.notes.push({
    id: newId(),
    sessionId,
    text: text.trim(),
    createdAt: Date.now(),
  });
  persist();
}

/* ------------------------------------------------------------------ */
/* Idle nudge (0035)                                                   */
/* ------------------------------------------------------------------ */

export function showIdleToast(session: Session): void {
  const task = taskById(session.taskId);
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <span class="toast-text"><strong>Session still running</strong> · ${escapeHtml(task?.title ?? "task")}</span>
    <button id="idle-pause" class="ghost">Pause</button>
    <button id="idle-finish" class="primary">Finish</button>`;
  document.body.appendChild(toast);

  const dismiss = (): void => toast.remove();
  toast.querySelector("#idle-pause")!.addEventListener("click", (e) => {
    e.stopPropagation();
    pauseSession(session);
    dismiss();
  });
  toast.querySelector("#idle-finish")!.addEventListener("click", (e) => {
    e.stopPropagation();
    finishSession(session);
    dismiss();
  });
  window.setTimeout(dismiss, 8000);
}

/* ------------------------------------------------------------------ */
/* Dispatcher for `data-action` clicks                                 */
/* ------------------------------------------------------------------ */

export function handleAction(action: string | undefined, id: string | undefined): void {
  const session = activeSession();

  switch (action) {
    case "toggle":
      if (id) toggleTask(id);
      break;
    case "toggle-quick":
      if (id) toggleQuick(id);
      break;
    case "today":
      if (id) toggleToday(id);
      break;
    case "defer":
      if (id) openDeferDialog(id);
      break;
    case "delete":
      if (id) confirmDeleteTask(id);
      break;
    case "delete-session":
      if (id) confirmDeleteSession(id);
      break;
    case "edit-note":
      if (id) editNote(id);
      break;
    case "delete-note":
      if (id) deleteNote(id);
      break;
    case "open-menu":
      if (id) {
        setOpenMenuTaskId(openMenuTaskId === id ? null : id);
      }
      render();
      break;
    case "start":
      if (id) promptStartSession(id);
      break;
    case "edit":
      if (id) openEditTask(id);
      break;
    case "quick-run":
      if (id) startQuickRun(id);
      break;
    case "quick-next":
      if (quickRun) advanceQuick();
      break;
    case "quick-finish":
      if (quickRun) finishQuick();
      break;
    case "task-history":
      if (id) {
        setSubView({ kind: "taskHistory", taskId: id });
        render();
      }
      break;
    case "view-history":
      setSubView({ kind: "history" });
      render();
      break;
    case "view-dashboard":
      setSubView({ kind: "dashboard" });
      render();
      break;
    case "back-to-board":
      setSubView(null);
      render();
      break;
    case "toggle-theme":
      toggleTheme();
      break;
    case "open-settings":
      openSettings();
      break;
    case "toggle-focus":
      setFocusMode(!focusMode);
      render();
      break;
    case "dismiss-hint":
      setResumeHintVisible(false);
      render();
      break;
    case "dismiss-desc-hint":
      setDescriptionHintVisible(false);
      render();
      break;
    case "start-next":
      beginFocusFromBreak();
      break;
    case "skip-break":
    case "end-break":
      skipBreak();
      break;
    case "pause":
      if (session) pauseSession(session);
      break;
    case "resume":
      if (session) resumeSession(session);
      break;
    case "finish":
      if (session) finishSession(session);
      break;
  }
}
