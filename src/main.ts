import "./style.css";
import "./events";
import { startRepaint } from "./repaint";
import { unlockAudio } from "./sound";
import { activeSession, applyTheme, breakState, quickRun, settings, state } from "./state";
import { saveDailySnapshot } from "./storage";
import { render } from "./views";

// Unlock audio on first interaction (browser autoplay policy).
document.addEventListener("pointerdown", () => unlockAudio(), { once: true });

applyTheme(settings.theme);
saveDailySnapshot(settings, state);
render();

// Offline support via service worker (0050).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* offline support is progressive enhancement */
    });
  });
}

const active = activeSession();
if (
  active?.status === "running" ||
  active?.status === "paused" ||
  breakState !== null ||
  quickRun !== null
) {
  startRepaint();
}
