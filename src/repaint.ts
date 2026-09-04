import { finishSession } from "./actions";
import { announce } from "./announce";
import { notify } from "./notify";
import { playCue } from "./sound";
import {
  activeSession,
  breakState,
  lastWatch,
  quickRun,
  setBreakState,
  setLastWatch,
  settings,
  taskById,
  timerConfig,
} from "./state";
import {
  MIN,
  formatDuration,
  formatElapsed,
  formatMs,
  phaseLabel,
  snapshot,
  techniqueLabel,
} from "./timer";
import { render, updateDocumentTitle } from "./views";

let repaintHandle: number | undefined;

/**
 * Display-only tick. All time is derived from wall-clock timestamps so this
 * never drifts and pausing/refreshing is safe.
 */
function repaintTick(): void {
  if (breakState && !breakState.done) {
    const clock = document.querySelector<HTMLElement>(".clock");
    if (!clock) return;
    const remaining = breakState.endsAt - Date.now();
    if (remaining <= 0) {
      setBreakState({ ...breakState, done: true });
      if (settings.soundEnabled) playCue("workStart", settings.soundPreset);
      if (settings.notificationsEnabled) {
        const task = taskById(breakState.taskId);
        notify("Break over", task ? `Time to focus — ${task.title}` : "Time to focus");
      }
      announce("Break over. Time to focus.");
      render();
      return;
    }
    clock.textContent = formatMs(remaining);
    updateDocumentTitle(formatMs(remaining));
    return;
  }

  if (quickRun) {
    const clock = document.querySelector<HTMLElement>(".clock");
    const text = formatElapsed(Date.now() - quickRun.startedAt);
    if (clock) clock.textContent = text;
    updateDocumentTitle(text);
    return;
  }

  const session = activeSession();
  if (!session || session.status === "done") {
    stopRepaint();
    setLastWatch(null);
    return;
  }
  const clock = document.querySelector<HTMLElement>(".clock");
  const phase = document.querySelector<HTMLElement>(".session-phase");
  const count = document.querySelector<HTMLElement>(".pomodoro-count");
  const elapsed = document.querySelector<HTMLElement>(".elapsed");
  if (!clock) return;

  const config = timerConfig();
  const snap = snapshot(session, config);

  if (
    session.technique === "flowtime" &&
    settings.maxFlowtimeMin > 0 &&
    snap.elapsedMs >= settings.maxFlowtimeMin * MIN
  ) {
    finishSession(session);
    return;
  }

  const clockText =
    session.technique === "pomodoro" ? formatMs(snap.remainingMs) : formatElapsed(snap.elapsedMs);
  clock.textContent = clockText;
  updateDocumentTitle(clockText);
  if (phase) phase.textContent = `${phaseLabel(snap.phase)} · ${techniqueLabel(session.technique)}`;
  if (count) count.textContent = `${snap.completedPomodoros} completed`;
  if (elapsed) elapsed.textContent = `elapsed ${formatDuration(snap.elapsedMs)}`;

  const running = session.status === "running";
  if (lastWatch && lastWatch.sessionId === session.id && lastWatch.running && running) {
    const wasBreak = lastWatch.phase !== "work";
    const nowBreak = snap.phase !== "work";
    if (wasBreak !== nowBreak) {
      if (settings.soundEnabled) {
        playCue(nowBreak ? "breakStart" : "workStart", settings.soundPreset);
      }
      if (settings.notificationsEnabled) {
        const task = taskById(session.taskId);
        const title = task?.title ?? "Untitled task";
        if (nowBreak) notify("Pomodoro complete", `Time for a break — ${title}`);
        else notify("Break over", `Time to focus — ${title}`);
      }
      announce(nowBreak ? "Pomodoro complete. Time for a break." : "Break over. Time to focus.");
    }
  }
  setLastWatch({ sessionId: session.id, phase: snap.phase, running });
}

export function startRepaint(): void {
  if (repaintHandle !== undefined) return;
  repaintHandle = window.setInterval(repaintTick, 250);
}

export function stopRepaint(): void {
  if (repaintHandle !== undefined) {
    clearInterval(repaintHandle);
    repaintHandle = undefined;
  }
}
