export function notificationsSupported(): boolean {
  return typeof Notification !== "undefined";
}

export function permissionGranted(): boolean {
  return notificationsSupported() && Notification.permission === "granted";
}

/** Ask for permission (must be called from a user gesture). Resolves to whether it was granted. */
export async function requestPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

export function notify(title: string, body: string): void {
  if (!permissionGranted()) return;
  try {
    new Notification(title, { body });
  } catch {
    // Some browsers restrict constructor use in some contexts; ignore.
  }
}
