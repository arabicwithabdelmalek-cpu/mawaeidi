# UI and motion review — 28 October 2026

This branch refines the existing navy and gold identity across schedules, students, the world clock, account settings, and sign-in.

## Changes

- Shared spacing, larger Arabic text, clearer cards, and more comfortable controls.
- Icon navigation stays at the bottom of phone screens; desktop navigation stays near the top while scrolling.
- Short entrance, dialog, hover, and press animations. The operating system's reduced-motion preference disables them.
- Better phone forms, student rows, time-zone cards, and horizontally scrollable tables.
- Closed custom dialogs are inert. Open dialogs prevent background interaction, contain keyboard focus, and restore focus when closed.
- The service worker caches the new stylesheet under cache version 48.

## Review without an account

Run `npm run preview:design`. Serve the generated `dist/` directory with any static server and open `index.html` or `responsive.html`.

The generated copy includes six synthetic students and sample lessons. Network connections, form submission, and workers are blocked by its Content Security Policy. The database/authentication client is replaced with an offline fixture that rejects writes. Production does not load this fixture. `index.html?signin` shows the sign-in design without requiring credentials.

An optional output filename can be passed to `node scripts/build-design-preview.cjs /path/to/preview.html`. The accompanying `responsive.html` points to that filename.

## Validation

- All eight existing suites in `npm run test:students` pass, covering students, integration, backups, trash, summary metrics, and world-clock synchronization.
- Inline scripts in the production page and generated preview parse successfully.
- Browser review at 320, 360, 390, 768, 1024, and 1440 CSS-pixel widths; schedules, students, and world-clock content remain within the page width.
- Checked student search, status filters, profile dialogs, the add-lesson drawer, weekly navigation, session-status dialog, and keyboard focus restoration.
- Phone and desktop screenshots reviewed with synthetic data.

The browser review uses a responsive iframe in Chromium, not physical iOS/Android devices. Authenticated cloud writes and real account changes are outside this visual review; existing automated tests remain the regression coverage for those flows. Reduced-motion handling is implemented in CSS; OS-level emulation was not available in this browser.

This branch is for review and has not been merged into the production branch.
