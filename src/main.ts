import "./style.css";
import "./events";
import { startRepaint } from "./repaint";
import { unlockAudio } from "./sound";
import { activeSession, applyTheme, breakState, quickRun, settings } from "./state";
import { render } from "./views";

// Unlock audio on first interaction (browser autoplay policy).
document.addEventListener("pointerdown", () => unlockAudio(), { once: true });

applyTheme(settings.theme);
render();

const active = activeSession();
if (
  active?.status === "running" ||
  active?.status === "paused" ||
  breakState !== null ||
  quickRun !== null
) {
  startRepaint();
}
