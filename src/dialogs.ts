import { escapeHtml } from "./escape";

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

let dialogCounter = 0;

function focusableIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}

/**
 * Show a modal dialog. Returns the overlay element; call `overlay.remove()` to
 * close it. Focus is moved into the dialog and trapped there while open; on
 * close it is restored to the previously focused element.
 *
 * Dialogs containing a form do not close on a backdrop click, to avoid losing
 * edits.
 */
export function openDialog(bodyHtml: string): HTMLElement {
  const app = document.querySelector<HTMLDivElement>("#app");
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const dialog = document.createElement("div");
  dialog.className = "dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.innerHTML = bodyHtml;
  overlay.appendChild(dialog);

  (app ?? document.body).appendChild(overlay);

  const heading = dialog.querySelector<HTMLElement>("h1, h2, h3");
  if (heading) {
    dialogCounter += 1;
    heading.id = `dialog-title-${dialogCounter}`;
    dialog.setAttribute("aria-labelledby", heading.id);
  }

  const hasForm = dialog.querySelector("form") !== null;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay && !hasForm) overlay.remove();
  });

  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key !== "Tab") return;
    const els = focusableIn(dialog);
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  dialog.addEventListener("keydown", onKeydown);

  const origRemove = overlay.remove.bind(overlay);
  overlay.remove = () => {
    dialog.removeEventListener("keydown", onKeydown);
    previous?.focus();
    origRemove();
  };

  const first = focusableIn(dialog)[0] ?? dialog;
  if (first === dialog) {
    dialog.setAttribute("tabindex", "-1");
    dialog.focus();
  } else {
    first.focus();
  }

  return overlay;
}

export function showMessage(title: string, message: string): void {
  const overlay = openDialog(`
    <h3>${escapeHtml(title)}</h3>
    <p class="dialog-text">${escapeHtml(message)}</p>
    <div class="dialog-actions">
      <button id="msg-ok" class="primary">OK</button>
    </div>`);
  overlay.querySelector("#msg-ok")!.addEventListener("click", () => overlay.remove());
}

export function showImportError(message: string): void {
  showMessage("Import failed", message);
}

export function downloadTextFile(
  name: string,
  text: string,
  mime = "text/plain;charset=utf-8",
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
