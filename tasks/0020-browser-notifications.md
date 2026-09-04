# 0020 — Browser notifications

Status: done

## Goal

Send browser notifications when a pomodoro focus phase ends (work → break) and when a break
ends (break → work / break countdown over), so the user notices even when the tab is hidden.

## Requirements

- Add a settings flag `notificationsEnabled` (default `false`) with a toggle in Settings.
- When toggled on, request `Notification.requestPermission()` from the user gesture; if denied,
  keep the setting off and inform the user.
- Send notifications at the same moments as the existing sound cues (0003) and break countdown
  (0014):
  - pomodoro work → break: "Pomodoro complete — take a break".
  - break → work: "Break over — time to focus".
  - break countdown reaching zero (0014): "Break over — time to focus".
  - session finished: "Session finished".
- Notification body includes the task title when available.
- Respect the existing sound/`Notification.permission` gating; do not request permission until
  the user opts in.

## Acceptance criteria

- Enabling notifications prompts for permission; granting allows notifications.
- A notification fires on pomodoro work → break and on break end.
- Notifications stop when the toggle is off or permission is denied.
- No notification permission request happens on first load.
