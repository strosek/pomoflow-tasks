# 0005 — Day / night mode toggle

Status: done

## Goal

Let the user switch between the biophilic night mode (current default) and a light day mode,
so the app remains comfortable in bright environments.

## Requirements

- Add a `theme` setting (`"night" | "day"`, default `"night"`) to the settings model from 0001,
  persisted with the other settings.
- Implement a day theme in `src/style.css` driven by CSS custom properties (redefine the `--*`
  tokens under a `[data-theme="day"]` scope or a `:root.day` class). Keep the same biophilic
  palette (greens/earths), just lightened.
- Provide a quick toggle (e.g. a sun/moon button near the settings gear) that flips the theme
  without a reload.
- Apply the theme attribute on `<html>` (or `#app`) so it takes effect app-wide immediately.
- Respect `prefers-color-scheme` only as an initial hint when no explicit theme has been saved.

## Acceptance criteria

- Toggling switches the whole app between dark and light instantly.
- The chosen theme persists across reloads.
- Default (no saved setting) remains night mode.
