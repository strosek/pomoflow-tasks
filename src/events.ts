import {
  addNote,
  addTask,
  beginFocusFromBreak,
  finishQuick,
  finishSession,
  handleAction,
  pauseSession,
  resumeSession,
  setEstimate,
  showIdleToast,
} from "./actions";
import {
  activeSession,
  breakState,
  focusMode,
  hiddenAt,
  hiddenSessionId,
  openMenuTaskId,
  persist,
  quickRun,
  setFilterPriority,
  setFilterQuadrant,
  setFocusMode,
  setHiddenAt,
  setHiddenSessionId,
  setOpenMenuTaskId,
  setSearchQuery,
  setSortBy,
  searchQuery,
  subView,
} from "./state";
import { MIN } from "./timer";
import type { Quadrant } from "./types";
import { render } from "./views";

const IDLE_NUDGE_MS = 10 * MIN;

function isEditable(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target : null;
  if (!el) return false;
  return !!el.closest("input, textarea, select") || (el as HTMLElement).isContentEditable;
}

function handleShortcut(e: KeyboardEvent): void {
  const key = e.key;

  if (key === "Escape") {
    if (openMenuTaskId !== null) {
      setOpenMenuTaskId(null);
      render();
      return;
    }
    if (focusMode) {
      setFocusMode(false);
      render();
      return;
    }
    const overlays = document.querySelectorAll(".overlay");
    const top = overlays[overlays.length - 1];
    if (top) {
      top.remove();
      return;
    }
    (document.activeElement as HTMLElement | null)?.blur?.();
    return;
  }

  if (isEditable(e.target)) return;

  const session = activeSession();
  if (key === " ") {
    const el = e.target instanceof Element ? e.target : null;
    if (el?.closest("button")) return;
    if (session && session.status !== "done") {
      e.preventDefault();
      if (session.status === "running") pauseSession(session);
      else if (session.status === "paused") resumeSession(session);
    }
    return;
  }

  if (key === "/") {
    if (!session && !quickRun && !breakState) {
      e.preventDefault();
      document.querySelector<HTMLInputElement>("#task-search")?.focus();
    }
    return;
  }

  const lower = key.toLowerCase();
  if (lower === "n") {
    if (!session && !subView && !quickRun && !breakState) {
      document.querySelector<HTMLInputElement>("#task-title")?.focus();
    }
    return;
  }
  if (lower === "f") {
    if (breakState) {
      beginFocusFromBreak();
    } else if (quickRun) {
      finishQuick();
    } else if (session && session.status !== "done") {
      finishSession(session);
    }
  }
}

document.addEventListener("keydown", handleShortcut);

// Close the ⋯ row menu when clicking outside it (0037).
document.addEventListener("click", (e) => {
  if (openMenuTaskId === null) return;
  const el = e.target as Element;
  if (el.closest("[data-menu]")) return;
  if (el.closest('[data-action="open-menu"]')) return;
  setOpenMenuTaskId(null);
  render();
});

// Idle nudge: remember when the tab went hidden during a running session (0035).
document.addEventListener("visibilitychange", () => {
  const session = activeSession();
  if (document.hidden) {
    if (session && session.status === "running") {
      setHiddenAt(Date.now());
      setHiddenSessionId(session.id);
    } else {
      setHiddenAt(null);
      setHiddenSessionId(null);
    }
  } else if (hiddenAt != null && hiddenSessionId != null) {
    const s = activeSession();
    if (
      s &&
      s.id === hiddenSessionId &&
      s.status === "running" &&
      Date.now() - hiddenAt >= IDLE_NUDGE_MS
    ) {
      showIdleToast(s);
    }
    setHiddenAt(null);
    setHiddenSessionId(null);
  }
});

const app = document.querySelector<HTMLDivElement>("#app")!;

app.addEventListener("click", (e) => {
  const target = (e.target as HTMLElement).closest(
    "[data-action], #add-task",
  ) as HTMLElement | null;
  if (!target) return;

  if (target.id === "add-task") {
    addTask();
    return;
  }

  if (target.closest("[data-menu]")) setOpenMenuTaskId(null);

  handleAction(target.dataset.action, target.dataset.id);
});

app.addEventListener("input", (e) => {
  const input = e.target as HTMLInputElement;
  if (input.dataset?.search !== undefined) {
    setSearchQuery(input.value);
    render();
    const el = document.querySelector<HTMLInputElement>("#task-search");
    if (el) {
      el.focus();
      el.setSelectionRange(searchQuery.length, searchQuery.length);
    }
  }
});

app.addEventListener("change", (e) => {
  const target = e.target as HTMLElement;

  if (target.dataset?.estimate) {
    setEstimate(target.dataset.estimate, (target as HTMLInputElement).value);
    return;
  }
  if (target.dataset?.filterPriority !== undefined) {
    const raw = (target as HTMLSelectElement).value;
    setFilterPriority(raw === "" ? null : Number(raw));
    render();
    return;
  }
  if (target.dataset?.filterQuadrant !== undefined) {
    const raw = (target as HTMLSelectElement).value;
    setFilterQuadrant((raw === "" ? null : raw) as Quadrant | null);
    render();
    return;
  }
  if (target.dataset?.sort !== undefined) {
    const raw = (target as HTMLSelectElement).value;
    setSortBy(
      (raw === "type" || raw === "newest" ? raw : "priority") as "priority" | "type" | "newest",
    );
    render();
  }
});

app.addEventListener("submit", (e) => {
  const form = e.target as HTMLFormElement;
  if (form.id === "note-form") {
    e.preventDefault();
    const session = activeSession();
    const text = form.querySelector<HTMLTextAreaElement>("#note-text")?.value ?? "";
    if (session) {
      addNote(session.id, text);
      persist();
      render();
    }
  }
});

app.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.target as HTMLElement).id === "task-title") {
    addTask();
  }
});
