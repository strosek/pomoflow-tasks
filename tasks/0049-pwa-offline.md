# 0049 — PWA offline support

Status: done

## Goal

Make Pomoflow installable and fully usable offline with a service worker, so it feels like a
real app and keeps working without a connection.

## Requirements

- Register a service worker that precaches the built assets (precache on install) and serves
  them cache-first, so the app loads offline.
- Keep the existing `manifest.webmanifest` and extend it with proper 192/512 icons if possible
  (SVG fallback is acceptable).
- Version the cache by build hash so deploys bust stale caches (update flow: skipWaiting +
  clients.claim).
- No server APIs to handle — data stays in localStorage; the worker only serves static files.
- Respect the "clear data" action (0019): also clear any extra caches the worker created.

## Acceptance criteria

- After first visit, the app opens and functions offline (add tasks, run timer).
- Installing as a PWA works on Chromium/Android with the existing manifest.
- Deploying a new version updates the cached assets for returning users.

## Nice to have

- An offline indicator when the network is down (cosmetic only).
