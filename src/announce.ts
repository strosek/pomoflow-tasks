/**
 * Announce a status change to assistive technology via a visually-hidden
 * aria-live region. Used for phase transitions and session/break events that
 * otherwise only produce sound or visual changes.
 */
export function announce(message: string): void {
  let region = document.getElementById("app-announcer");
  if (!region) {
    region = document.createElement("div");
    region.id = "app-announcer";
    region.className = "sr-only";
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
  }
  // Reset then set to guarantee the text is re-announced even if unchanged.
  region.textContent = "";
  window.setTimeout(() => {
    region!.textContent = message;
  }, 0);
}
