import {
  activeSession,
  breakState,
  descriptionHintVisible,
  filterPriority,
  filterQuadrant,
  focusMode,
  notesFor,
  openMenuTaskId,
  quickRun,
  resumeHintVisible,
  searchQuery,
  settings,
  sortBy,
  state,
  subView,
  taskById,
  timerConfig,
} from "./state";
import { formatDay, startOfWeek } from "./dates";
import { escapeHtml } from "./escape";
import { icon } from "./icons";
import {
  dailyFocus,
  doneSessions,
  focusByQuadrant,
  focusByTag,
  focusStreak,
  sessionWorkMs,
  tagAttention,
  taskTotals,
  todayTotals,
  weekdayAverages,
  weekDayCount,
  weekTotals,
} from "./stats";
import {
  formatDuration,
  formatElapsed,
  formatMs,
  phaseLabel,
  snapshot,
  techniqueLabel,
} from "./timer";
import { isFutureOpen, isOverdueOpen, isTodayOpen } from "./tasks";
import type { Quadrant, Session, Task } from "./types";
import { QUADRANT_LABEL } from "./types";

const app = document.querySelector<HTMLDivElement>("#app")!;

/** Keep the browser tab title useful during a session (countdown / elapsed). */
export function updateDocumentTitle(clockText: string | null): void {
  document.title = clockText ? `${clockText} · Pomoflow` : "Pomoflow";
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

export function render(): void {
  if (breakState) {
    renderBreak();
    return;
  }
  if (quickRun) {
    renderQuickRun();
    return;
  }
  const session = activeSession();
  if (session && session.status !== "done") {
    renderSession(session);
    return;
  }
  if (subView?.kind === "history") {
    renderHistory(null);
  } else if (subView?.kind === "taskHistory") {
    renderHistory(subView.taskId);
  } else if (subView?.kind === "dashboard") {
    renderDashboard();
  } else {
    renderBoard();
  }
}

function pageHeaderHtml(): string {
  const targetLabel = settings.theme === "night" ? "day" : "night";
  return `
    <header class="app-header">
      <div class="app-title">
        <h1>Pomoflow</h1>
        <p class="tagline">Focus on one thing at a time.</p>
      </div>
      <nav class="header-actions">
        <button class="icon-btn" data-action="toggle-theme" title="Switch to ${targetLabel} mode" aria-label="Switch to ${targetLabel} mode" aria-pressed="${settings.theme === "night" ? "true" : "false"}">${icon(settings.theme === "night" ? "sun" : "moon")}</button>
        <button class="icon-btn" data-action="view-dashboard" title="Dashboard" aria-label="Dashboard">${icon("dashboard")}</button>
        <button class="icon-btn" data-action="view-history" title="History" aria-label="History">${icon("history")}</button>
        <button class="icon-btn" data-action="open-settings" title="Settings" aria-label="Settings">${icon("settings")}</button>
      </nav>
    </header>`;
}

function summaryBarHtml(): string {
  const today = todayTotals(state.sessions, settings);
  const week = weekTotals(state.sessions, settings);
  const weekDays = weekDayCount(state.sessions);
  const streak = focusStreak(state.sessions);

  let text: string;
  if (today.workMs === 0) {
    text = "No focus yet today";
  } else {
    text = `Today: ${formatDuration(today.workMs)}`;
    if (today.pomodoroCount > 0) {
      text += ` · ${today.pomodoroCount} pomodoro${today.pomodoroCount === 1 ? "" : "s"}`;
    }
  }
  if (weekDays >= 2) text += ` · This week: ${formatDuration(week.workMs)}`;

  const leaf =
    streak > 0
      ? `<span class="leaf" title="Focus streak: ${streak} day${streak === 1 ? "" : "s"}" style="--lv:${Math.min(streak, 5)}"></span>`
      : "";
  return `<div class="summary-bar"><span class="summary-text">${escapeHtml(text)}</span>${leaf}</div>`;
}

function boardControlsHtml(): string {
  const priorityOptions = [1, 2, 3, 4, 5]
    .map((p) => `<option value="${p}" ${filterPriority === p ? "selected" : ""}>${p}</option>`)
    .join("");
  return `
    <div class="board-controls">
      <input type="search" id="task-search" data-search class="search-input" placeholder="Search ( / )" value="${escapeHtml(searchQuery)}" aria-label="Search tasks" />
      <label>Priority
        <select data-filter-priority>
          <option value="">All</option>
          ${priorityOptions}
        </select>
      </label>
      <label>Type
        <select data-filter-quadrant>
          <option value="">All</option>
          <option value="q1" ${filterQuadrant === "q1" ? "selected" : ""}>Urgent · Important</option>
          <option value="q2" ${filterQuadrant === "q2" ? "selected" : ""}>Not urgent · Important</option>
          <option value="q3" ${filterQuadrant === "q3" ? "selected" : ""}>Urgent · Not important</option>
          <option value="q4" ${filterQuadrant === "q4" ? "selected" : ""}>Not urgent · Not important</option>
        </select>
      </label>
      <label>Sort
        <select data-sort>
          <option value="priority" ${sortBy === "priority" ? "selected" : ""}>Priority</option>
          <option value="type" ${sortBy === "type" ? "selected" : ""}>Type</option>
          <option value="newest" ${sortBy === "newest" ? "selected" : ""}>Newest</option>
        </select>
      </label>
    </div>`;
}

const QUADRANT_ORDER: Record<Quadrant, number> = { q1: 0, q2: 1, q3: 2, q4: 3 };

function matchesFilters(t: Task): boolean {
  if (filterPriority !== null && t.priority !== filterPriority) return false;
  if (filterQuadrant !== null && t.quadrant !== filterQuadrant) return false;
  return true;
}

function matchesSearch(t: Task): boolean {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return true;
  if (t.title.toLowerCase().includes(q)) return true;
  return (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
}

function sortedTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    switch (sortBy) {
      case "type":
        return (
          QUADRANT_ORDER[a.quadrant] - QUADRANT_ORDER[b.quadrant] ||
          a.priority - b.priority ||
          a.createdAt - b.createdAt
        );
      case "newest":
        return b.createdAt - a.createdAt;
      case "priority":
      default:
        return a.priority - b.priority || a.createdAt - b.createdAt;
    }
  });
}

function planListHtml(title: string, items: Task[], extraClass = ""): string {
  if (!items.length) return "";
  return `
    <section class="plan-section ${extraClass}">
      <h2 class="quick-title">${title}</h2>
      <ul class="quick-list">
        ${items
          .map((t) => {
            const unplan =
              extraClass === "deferred"
                ? `<button class="icon-btn" data-action="today" data-id="${t.id}" title="Bring to today" aria-label="Bring to today">${icon("calendar")}</button>`
                : `<button class="icon-btn" data-action="today" data-id="${t.id}" title="Remove from today" aria-label="Remove from today">${icon("x")}</button>`;
            const date =
              extraClass === "deferred"
                ? `<span class="later-date">${formatDay(t.plannedFor!)}</span>`
                : "";
            return `
              <li class="quick-item">
                <button class="check" data-action="toggle" data-id="${t.id}" aria-label="Toggle done" aria-pressed="${t.done ? "true" : "false"}"></button>
                ${date}
                <span class="task-title">${escapeHtml(t.title)}</span>
                ${unplan}
                <button class="primary icon-btn" data-action="start" data-id="${t.id}" title="Start session" aria-label="Start session">${icon("play")}</button>
              </li>`;
          })
          .join("")}
      </ul>
    </section>`;
}

/* ------------------------------------------------------------------ */
/* Task row / chart helpers (0041, 0038)                               */
/* ------------------------------------------------------------------ */

const PRIORITY_COLORS = [
  "",
  "var(--clay)",
  "var(--gold)",
  "var(--earth)",
  "var(--moss)",
  "var(--text-faint)",
];

function priorityLabel(priority: number): string {
  return `<span class="priority-pill" style="color:${PRIORITY_COLORS[priority]}" title="Priority ${priority} of 5" aria-label="Priority ${priority} of 5">P${priority}</span>`;
}

/** Horizontal proportion bars (label + track + value). */
function barRows(items: { label: string; value: number; display: string }[]): string {
  const max = Math.max(1, ...items.map((i) => i.value));
  return `<ul class="bar-list">${items
    .map(
      (i) => `<li>
        <span class="bar-label">${i.label}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${Math.round((i.value / max) * 100)}%" aria-hidden="true"></span></span>
        <strong class="bar-value">${i.display}</strong>
      </li>`,
    )
    .join("")}</ul>`;
}

function barHeight(ms: number, max: number): string {
  return ms > 0 ? `${Math.max(4, Math.round((ms / max) * 100))}%` : "3px";
}

/** Vertical bar columns for a time series (focus trend / weekday rhythm). */
function chartColumns(
  cols: { label: string; tooltip: string; ms: number }[],
  ariaLabel: string,
  todayIndex: number | null = null,
): string {
  const max = Math.max(1, ...cols.map((c) => c.ms));
  return `<div class="chart-bars" role="img" aria-label="${escapeHtml(ariaLabel)}">${cols
    .map(
      (
        c,
        i,
      ) => `<div class="chart-col ${i === todayIndex ? "today" : ""} ${c.ms === 0 ? "zero" : ""}" title="${escapeHtml(c.tooltip)}">
        <div class="chart-bar-area"><span class="chart-bar" style="height:${barHeight(c.ms, max)}"></span></div>
        <span class="chart-col-label">${escapeHtml(c.label)}</span>
      </div>`,
    )
    .join("")}</div>`;
}

function renderBoard(): void {
  updateDocumentTitle(null);

  const todayOpen = state.tasks.filter((t) => isTodayOpen(t) && matchesSearch(t));
  const laterOpen = state.tasks
    .filter((t) => isFutureOpen(t) && matchesSearch(t))
    .sort((a, b) => (a.plannedFor ?? 0) - (b.plannedFor ?? 0));
  const quickTasks = state.tasks.filter(
    (t) => t.quick && !t.done && !isTodayOpen(t) && matchesSearch(t),
  );
  const mainTasks = sortedTasks(
    state.tasks
      .filter((t) => !isTodayOpen(t) && !isFutureOpen(t) && !(t.quick && !t.done))
      .filter(matchesFilters)
      .filter(matchesSearch),
  );

  const totals = new Map<string, ReturnType<typeof taskTotals>>();
  for (const t of state.tasks) totals.set(t.id, taskTotals(t.id, state.sessions, settings));

  const rows = mainTasks
    .map((task) => {
      const t = totals.get(task.id)!;
      const bits: string[] = [];
      if (settings.showEstimates && task.estimatedMin != null) {
        bits.push(`est ${formatDuration(task.estimatedMin * 60_000)}`);
      }
      if (t.workMs > 0) bits.push(formatDuration(t.workMs));
      if (t.sessionCount > 0)
        bits.push(`${t.sessionCount} session${t.sessionCount === 1 ? "" : "s"}`);
      if (t.pomodoroCount > 0)
        bits.push(`${t.pomodoroCount} pomodoro${t.pomodoroCount === 1 ? "" : "s"}`);

      return `
      <li class="task ${task.quadrant} ${task.done ? "done" : ""} ${isOverdueOpen(task) ? "overdue" : ""}">
        <button class="check" data-action="toggle" data-id="${task.id}" aria-label="Toggle done" aria-pressed="${task.done ? "true" : "false"}">${task.done ? "✓" : ""}</button>
        <div class="task-body">
          <span class="task-title">${escapeHtml(task.title)}${isOverdueOpen(task) ? `<span class="overdue-badge">overdue</span>` : ""}</span>
          <span class="task-meta">
            <span class="quadrant ${task.quadrant}">${QUADRANT_LABEL[task.quadrant]}</span>
            ${priorityLabel(task.priority)}
            ${
              (task.tags ?? []).length
                ? `<span class="tag-chips">${(task.tags ?? [])
                    .map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`)
                    .join("")}</span>`
                : ""
            }
            ${
              settings.showEstimates
                ? `<input type="number" class="est-input" data-estimate="${task.id}" value="${task.estimatedMin ?? ""}" min="0" placeholder="est" aria-label="Estimated minutes" />`
                : ""
            }
          </span>
        </div>
        ${bits.length ? `<span class="task-stats">${bits.join(" · ")}</span>` : ""}
        <div class="task-actions">
          <button class="primary icon-btn" data-action="start" data-id="${task.id}" title="Start a session" aria-label="Start a session">${icon("play")}</button>
          <button class="icon-btn ${task.quick ? "on" : ""}" data-action="toggle-quick" data-id="${task.id}" title="${task.quick ? "Remove quick mark" : "Mark as quick"}" aria-label="${task.quick ? "Remove quick mark" : "Mark as quick"}" aria-pressed="${task.quick ? "true" : "false"}">${icon("bolt")}</button>
          <button class="icon-btn" data-action="open-menu" data-id="${task.id}" title="More actions" aria-label="More actions">${icon("dots")}</button>
          ${
            openMenuTaskId === task.id
              ? `<div class="row-menu" data-menu>
                  <button data-action="today" data-id="${task.id}">${isTodayOpen(task) ? "Unplan today" : "Plan today"}</button>
                  <button data-action="defer" data-id="${task.id}">Defer…</button>
                  <button data-action="edit" data-id="${task.id}">Edit</button>
                  <button data-action="task-history" data-id="${task.id}">History</button>
                  <button data-action="delete" data-id="${task.id}">Delete</button>
                </div>`
              : ""
          }
        </div>
      </li>`;
    })
    .join("");

  const quickSection = quickTasks.length
    ? `<section class="quick-section">
        <h2 class="quick-title">Quick tasks</h2>
        <ul class="quick-list">
          ${quickTasks
            .map(
              (t) => `
            <li class="quick-item">
              <button class="check" data-action="toggle" data-id="${t.id}" aria-label="Toggle done" aria-pressed="${t.done ? "true" : "false"}"></button>
              <span class="task-title">${escapeHtml(t.title)}</span>
              <button class="icon-btn" data-action="toggle-quick" data-id="${t.id}" title="Unmark as quick" aria-label="Unmark as quick" aria-pressed="true">${icon("bolt")}</button>
              <button class="primary" data-action="quick-run" data-id="${t.id}">Run</button>
            </li>`,
            )
            .join("")}
        </ul>
      </section>`
    : "";

  const hasFilters =
    filterPriority !== null || filterQuadrant !== null || searchQuery.trim() !== "";
  const emptyMsg =
    state.tasks.length === 0
      ? "No tasks yet. Add one above."
      : hasFilters &&
          !mainTasks.length &&
          !todayOpen.length &&
          !laterOpen.length &&
          !quickTasks.length
        ? "No tasks match the current search or filters."
        : "No more tasks here.";

  app.innerHTML = `
    ${pageHeaderHtml()}
    <div class="toolbar">
      ${summaryBarHtml()}
    </div>
    <section class="add-task">
      <input id="task-title" type="text" placeholder="What do you need to do? #tag" autocomplete="off" />
      <div class="add-task-row">
        <label>Priority
          <select id="task-priority">
            <option value="1">1 · highest</option>
            <option value="2" selected>2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5 · lowest</option>
          </select>
        </label>
        <label>Quadrant
          <select id="task-quadrant">
            <option value="q1">Urgent · Important</option>
            <option value="q2" selected>Not urgent · Important</option>
            <option value="q3">Urgent · Not important</option>
            <option value="q4">Not urgent · Not important</option>
          </select>
        </label>
        <label class="check-field">Quick
          <input type="checkbox" id="task-quick" />
        </label>
        <button id="add-task" class="primary">Add task</button>
      </div>
    </section>

    ${boardControlsHtml()}

    ${planListHtml("Today", todayOpen)}

    <main class="board">
      ${mainTasks.length === 0 ? `<p class="empty">${emptyMsg}</p>` : `<ul class="task-list">${rows}</ul>`}
    </main>

    ${planListHtml("Later", laterOpen, "deferred")}
    ${quickSection}
    <p class="shortcut-hint">N new task · / search · Space pause/resume · F finish · Esc close</p>`;
}

function renderHistory(taskId: string | null): void {
  updateDocumentTitle(null);

  const sessions = doneSessions(state).filter((s) => (taskId ? s.taskId === taskId : true));
  const scopedTask = taskId ? taskById(taskId) : undefined;
  const title = taskId ? `History · ${scopedTask?.title ?? "deleted task"}` : "Session history";

  const rows = sessions
    .map((s) => {
      const work = sessionWorkMs(s, settings);
      const task = taskById(s.taskId);
      const date = new Date(s.endedAt ?? s.startedAt).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const pomoBit =
        s.technique === "pomodoro" && s.completedPomodoros > 0
          ? ` · ${s.completedPomodoros} pomodoro${s.completedPomodoros === 1 ? "" : "s"}`
          : "";
      const innerNotes = notesFor(s.id);

      return `
      <li class="hist-item">
        <div class="hist-top">
          <span class="hist-title">${escapeHtml(task?.title ?? "(deleted task)")}</span>
          <span class="hist-date">${date}</span>
          <button class="icon-btn hist-delete" data-action="delete-session" data-id="${s.id}" title="Delete session" aria-label="Delete session">${icon("x")}</button>
        </div>
        <div class="hist-sub">${techniqueLabel(s.technique)} · ${formatDuration(work)}${pomoBit}</div>
        ${
          innerNotes.length
            ? `<ul class="hist-notes">${innerNotes
                .map(
                  (n) => `<li>
                    <span class="note-text">${escapeHtml(n.text)}</span>
                    <button class="icon-btn" data-action="edit-note" data-id="${n.id}" title="Edit note" aria-label="Edit note">${icon("edit")}</button>
                    <button class="icon-btn" data-action="delete-note" data-id="${n.id}" title="Delete note" aria-label="Delete note">${icon("x")}</button>
                  </li>`,
                )
                .join("")}</ul>`
            : ""
        }
      </li>`;
    })
    .join("");

  app.innerHTML = `
    ${pageHeaderHtml()}
    <main class="board">
      <button class="back-btn" data-action="back-to-board">${icon("back")} Back</button>
      <h2 class="page-title">${escapeHtml(title)}</h2>
      ${
        sessions.length === 0
          ? `<p class="empty">${taskId ? "No sessions for this task yet." : "No finished sessions yet."}</p>`
          : `<ul class="hist-list">${rows}</ul>`
      }
    </main>`;
}

function renderDashboard(): void {
  updateDocumentTitle(null);

  const total = state.tasks.length;
  const open = state.tasks.filter((t) => !t.done).length;

  const weekStartMs = startOfWeek(Date.now());
  const doneThisWeek = state.tasks.filter(
    (t) => t.done && t.doneAt != null && t.doneAt >= weekStartMs,
  ).length;

  const quadrantOpen: Record<Quadrant, number> = { q1: 0, q2: 0, q3: 0, q4: 0 };
  for (const t of state.tasks) if (!t.done) quadrantOpen[t.quadrant] += 1;

  const today = todayTotals(state.sessions, settings);
  const week = weekTotals(state.sessions, settings);
  const streak = focusStreak(state.sessions);
  const tags = tagAttention(state.tasks);

  const plannedToday = state.tasks.filter((t) => isTodayOpen(t));
  const quadFocus = focusByQuadrant(state.sessions, state.tasks, settings);
  const tagFocus = focusByTag(state.sessions, state.tasks, settings);
  const quadLabel: Record<string, string> = {
    q1: "Urgent · Important",
    q2: "Not urgent · Important",
    q3: "Urgent · Not important",
    q4: "Not urgent · Not important",
    deleted: "Deleted tasks",
  };

  const hasSessions = state.sessions.some((s) => s.status === "done");
  const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekdayShort = ["M", "T", "W", "T", "F", "S", "S"];

  const trendHtml = hasSessions
    ? chartColumns(
        dailyFocus(state.sessions, settings, 14).map((d) => {
          const date = new Date(d.dayStart);
          return {
            label: date.toLocaleDateString([], { weekday: "narrow" }),
            tooltip: `${date.toLocaleDateString([], { month: "short", day: "numeric" })} · ${formatDuration(d.workMs)}`,
            ms: d.workMs,
          };
        }),
        "Focus time for the last 14 days",
        13,
      )
    : null;

  const weekdayHtml = hasSessions
    ? chartColumns(
        weekdayAverages(state.sessions, settings).map((avg, i) => ({
          label: weekdayShort[i],
          tooltip: `${weekdayNames[i]} · avg ${formatDuration(avg)}`,
          ms: avg,
        })),
        "Average focus per weekday",
        (new Date().getDay() + 6) % 7,
      )
    : null;

  const quadrantBars =
    total === 0
      ? null
      : barRows(
          (["q1", "q2", "q3", "q4"] as Quadrant[]).map((q) => ({
            label: QUADRANT_LABEL[q],
            value: quadrantOpen[q],
            display: String(quadrantOpen[q]),
          })),
        );

  const tagBars = tags.length
    ? barRows(
        tags.map((t) => ({
          label: `#${escapeHtml(t.tag)}`,
          value: t.open,
          display: String(t.open),
        })),
      )
    : null;

  const quadFocusBars = quadFocus.length
    ? barRows(
        quadFocus.map((b) => ({
          label: quadLabel[b.key] ?? escapeHtml(b.key),
          value: b.workMs,
          display: formatDuration(b.workMs),
        })),
      )
    : null;

  const tagFocusBars = tagFocus.length
    ? barRows(
        tagFocus.map((b) => ({
          label: `#${escapeHtml(b.key)}`,
          value: b.workMs,
          display: formatDuration(b.workMs),
        })),
      )
    : null;

  const recent = doneSessions(state).slice(0, 8);
  const recentHtml = recent.length
    ? `<table class="dash-table">
        <thead>
          <tr><th>Task</th><th>Technique</th><th>Duration</th><th>Ended</th></tr>
        </thead>
        <tbody>
          ${recent
            .map((s) => {
              const work = sessionWorkMs(s, settings);
              const task = taskById(s.taskId);
              const ended = new Date(s.endedAt ?? s.startedAt).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const pomoBit =
                s.technique === "pomodoro" && s.completedPomodoros > 0
                  ? ` · ${s.completedPomodoros}×`
                  : "";
              const taskCell = task
                ? `<button class="table-task" data-action="task-history" data-id="${task.id}" title="View history">${escapeHtml(task.title)}</button>`
                : `<span class="table-muted">(deleted task)</span>`;
              return `<tr>
                <td>${taskCell}</td>
                <td>${techniqueLabel(s.technique)}</td>
                <td>${formatDuration(work)}${pomoBit}</td>
                <td>${ended}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>`
    : null;

  app.innerHTML = `
    ${pageHeaderHtml()}
    <main class="board">
      <button class="back-btn" data-action="back-to-board">${icon("back")} Back</button>
      <h2 class="page-title">Dashboard</h2>
      <div class="dash-grid">
        <section class="dash-card">
          <h3>Overview</h3>
          <ul class="dash-stats">
            <li><span>Total tasks</span><strong>${total}</strong></li>
            <li><span>Open</span><strong>${open}</strong></li>
            <li><span>Done this week</span><strong>${doneThisWeek}</strong></li>
          </ul>
        </section>
        <section class="dash-card">
          <h3>Focus</h3>
          <ul class="dash-stats">
            <li><span>Today</span><strong>${formatDuration(today.workMs)}</strong></li>
            <li><span>This week</span><strong>${formatDuration(week.workMs)}</strong></li>
            <li><span>Streak</span><strong>${streak} day${streak === 1 ? "" : "s"}</strong></li>
          </ul>
        </section>
        <section class="dash-card">
          <h3>Today</h3>
          ${plannedToday.length ? `<ul class="quick-list">${plannedToday.map((t) => `<li class="quick-item"><span class="task-title">${escapeHtml(t.title)}</span><button class="primary icon-btn" data-action="start" data-id="${t.id}" title="Start session" aria-label="Start session">${icon("play")}</button></li>`).join("")}</ul>` : `<p class="dialog-text">Nothing planned for today.</p>`}
        </section>
        <section class="dash-card wide">
          <h3>Focus trend</h3>
          ${trendHtml ?? `<p class="dialog-text">No finished sessions yet.</p>`}
        </section>
        <section class="dash-card">
          <h3>Week rhythm</h3>
          ${weekdayHtml ?? `<p class="dialog-text">No finished sessions yet.</p>`}
        </section>
        <section class="dash-card">
          <h3>Open tasks by quadrant</h3>
          ${quadrantBars ?? `<p class="dialog-text">No tasks yet.</p>`}
        </section>
        <section class="dash-card">
          <h3>Areas needing attention</h3>
          ${tagBars ?? `<p class="dialog-text">No open tags yet. Add tasks with #tags to see areas here.</p>`}
        </section>
        <section class="dash-card">
          <h3>Focus by quadrant</h3>
          ${quadFocusBars ?? `<p class="dialog-text">No finished sessions yet.</p>`}
        </section>
        <section class="dash-card">
          <h3>Focus by tag</h3>
          ${tagFocusBars ?? `<p class="dialog-text">No finished sessions yet.</p>`}
        </section>
        <section class="dash-card wide">
          <div class="dash-card-head">
            <h3>Recent sessions</h3>
            <button class="icon-btn" data-action="view-history" title="View all history" aria-label="View all history">${icon("history")}</button>
          </div>
          ${recentHtml ?? `<p class="dialog-text">No finished sessions yet.</p>`}
        </section>
      </div>
    </main>`;
}

function resumeHintFor(session: Session): { notes: string[] } | null {
  const finished = state.sessions
    .filter(
      (s) =>
        s.taskId === session.taskId &&
        s.status === "done" &&
        s.id !== session.id &&
        s.endedAt != null,
    )
    .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0));
  const recent = finished[0];
  if (!recent) return null;
  const notes = notesFor(recent.id).map((n) => n.text);
  return notes.length ? { notes } : null;
}

function renderSession(session: Session): void {
  const task = taskById(session.taskId);
  const snap = snapshot(session, timerConfig());
  const title = escapeHtml(task?.title ?? "Untitled task");
  const clockText =
    session.technique === "pomodoro" ? formatMs(snap.remainingMs) : formatElapsed(snap.elapsedMs);

  if (focusMode) {
    const countBit =
      session.technique === "pomodoro"
        ? `<div class="pomodoro-count">${snap.completedPomodoros} completed</div>`
        : "";
    updateDocumentTitle(clockText);
    app.innerHTML = `
      <main class="session-main focus">
        <header class="session-header">
          <h2 class="session-task-title">${title}</h2>
        </header>
        <div class="clock">${clockText}</div>
        ${countBit}
        <button class="ghost focus-exit" data-action="toggle-focus">Exit focus · Esc</button>
      </main>`;
    return;
  }

  updateDocumentTitle(clockText);

  const hint = resumeHintVisible ? resumeHintFor(session) : null;
  const hintBlock =
    hint && !task?.done
      ? `<section class="resume-hint">
          <div>
            <h3>Pick up where you left off</h3>
            <ul class="note-list">${hint.notes
              .map((n) => `<li>${escapeHtml(n)}</li>`)
              .join("")}</ul>
          </div>
          <button class="icon-btn" data-action="dismiss-hint" title="Dismiss" aria-label="Dismiss hint">${icon("x")}</button>
        </section>`
      : "";
  const desc = (task?.description ?? "").trim();
  const descBlock =
    desc && descriptionHintVisible
      ? `<section class="resume-hint">
          <div>
            <h3>Task description</h3>
            <p class="desc-text">${escapeHtml(desc)}</p>
          </div>
          <button class="icon-btn" data-action="dismiss-desc-hint" title="Dismiss" aria-label="Dismiss description">${icon("x")}</button>
        </section>`
      : "";
  const notes = notesFor(session.id);

  app.innerHTML = `
    <header class="session-header">
      <h2 class="session-task-title">${title}</h2>
      <span class="session-phase">${phaseLabel(snap.phase)} · ${techniqueLabel(session.technique)}</span>
    </header>

    <main class="session-main">
      ${descBlock}
      ${hintBlock}
      <div class="clock">${clockText}</div>
      ${session.technique === "pomodoro" ? `<div class="pomodoro-count">${snap.completedPomodoros} completed</div>` : `<div class="elapsed">elapsed ${formatDuration(snap.elapsedMs)}</div>`}

      <div class="session-controls">
        ${
          session.status === "running"
            ? `<button class="primary" data-action="pause">${icon("pause")} Pause</button>`
            : `<button class="primary" data-action="resume">${icon("play")} Resume</button>`
        }
        <button class="ghost" data-action="toggle-focus">Focus</button>
        <button class="ghost" data-action="finish">${icon("check")} Finish</button>
      </div>

      <section class="notes">
        <h3>Notes for restarting later</h3>
        <form id="note-form">
          <textarea id="note-text" placeholder="What should you remember when you come back?" rows="3"></textarea>
          <button type="submit" class="primary">Add note</button>
        </form>
        ${
          notes.length
            ? `<ul class="note-list">${notes
                .map((n) => `<li>${escapeHtml(n.text)}</li>`)
                .join("")}</ul>`
            : ""
        }
      </section>
    </main>
    <p class="shortcut-hint">Space pause/resume · F finish · Esc close</p>`;
}

function renderBreak(): void {
  if (!breakState) return;
  if (breakState.done) {
    updateDocumentTitle(null);
    app.innerHTML = `
      <main class="session-main">
        <header class="session-header">
          <h2 class="session-task-title">Break over</h2>
          <span class="session-phase">Ready to focus again</span>
        </header>
        <div class="session-controls">
          <button class="primary" data-action="start-next">Start focusing</button>
          <button class="ghost" data-action="end-break">Done</button>
        </div>
      </main>`;
    return;
  }

  const remaining = Math.max(0, breakState.endsAt - Date.now());
  updateDocumentTitle(formatMs(remaining));
  app.innerHTML = `
    <main class="session-main">
      <header class="session-header">
        <h2 class="session-task-title">Break</h2>
        <span class="session-phase">Rest · ${techniqueLabel(breakState.technique)}</span>
      </header>
      <div class="clock">${formatMs(remaining)}</div>
      <div class="session-controls">
        <button class="primary" data-action="start-next">Start now</button>
        <button class="icon-btn" data-action="skip-break" title="Skip break" aria-label="Skip break">${icon("skip")}</button>
      </div>
    </main>
    <p class="shortcut-hint">F start focusing</p>`;
}

function renderQuickRun(): void {
  if (!quickRun) return;
  const task = taskById(quickRun.taskId);
  const left = state.tasks.filter((t) => t.quick && !t.done).length;
  const clockText = formatElapsed(Date.now() - quickRun.startedAt);
  updateDocumentTitle(clockText);
  app.innerHTML = `
    <main class="session-main">
      <header class="session-header">
        <h2 class="session-task-title">${escapeHtml(task?.title ?? "Untitled task")}</h2>
        <span class="session-phase">Quick run · ${left} left</span>
      </header>
      <div class="clock">${clockText}</div>
      <div class="session-controls">
        <button class="primary" data-action="quick-next">Close & next</button>
        <button class="ghost" data-action="quick-finish">Finish run</button>
      </div>
    </main>
    <p class="shortcut-hint">F finish run</p>`;
}
