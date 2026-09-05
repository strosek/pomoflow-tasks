# 0051 — E2E tests (Playwright)

Status: proposed

## Goal

Add end-to-end browser tests covering the core flows, beyond the current unit/happy-dom smoke
tests.

## Requirements

- Add Playwright (or an alternative, with a decision recorded in README) to devDependencies.
- Cover at least: create task → start pomodoro → pause/resume → finish → history shows session;
  quick run flow; recurring task reopen (0043); export/import round-trip; settings persist.
- Run against `vite preview` of a production build; keep the suite fast (< ~2 min) so it can run
  in CI (add a CI job to the GitHub Actions workflow).
- E2E config respects the existing vitest/prettier setup; scripts added to package.json
  (`test:e2e`).

## Acceptance criteria

- `npm run test:e2e` passes locally and in CI on push.
- Each flow asserts visible UI outcomes (rows, clock, toast), not implementation details.
