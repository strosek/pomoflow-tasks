# 0053 — Feedback link

Status: done

## Goal

Give real users an easy way to report problems and ideas, closing the loop between the deployed
app and the repo.

## Requirements

- A subtle "Feedback" entry in the Settings dialog (next to export/import) linking to the
  repository's Issues page (opened in a new tab).
- The link URL is a single constant at the top of the settings code so it's easy to change.
- Include a tiny blurb inviting ideas and bug reports, matching the calm tone of the app.
- No telemetry, no tracking — a plain link only.

## Acceptance criteria

- Settings shows a Feedback item that opens the Issues page in a new tab.
- No external requests are made except when the user clicks the link.

## Nice to have

- Pre-fill the issue body with app version via the `?body=` parameter.
