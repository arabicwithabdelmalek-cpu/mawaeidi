# Mawaeidi cross-platform foundation — 25 November 2026

Baseline: main `205f32c68935ed5382885e52fcb6c7097eb55f94`; android-app `0e787e845a2fffe08a2620a854a17ddcf789ec3b`. 60 common paths, 35 exact blob matches, 25 differences. This is a path comparison, not a count of duplicated functions.

## Ownership
- Canonical shared modules: main. The manifest lists a conservative subset of identical files (backup crypto, schedule compare, account page, selected tests and assets). Keep these byte-identical on both branches; the Android build continues using vendored files, not fetching web code at runtime.
- Platform-specific paths are deliberately excluded from byte equality until reviewed. The Android app contains secure session storage, update installer, alarms and native backup I/O; the web has admin and additional PWA/student workspace features. Never bulk copy app-main.js, index.html or service workers.
- No shared runtime files changed by this PR. No production data changes.

## Workflow
For each future shared change: implement and test in main review branch; port the exact shared module plus corresponding asset versions/tests to Android review branch; run web and Android tests; verify both before release. Cross-branch comparison is initially a warning, since staged release steps temporarily differ. A maintainer can run strict mode manually or locally using two checkouts:
`node scripts/check-shared-platform-files.mjs /path/to/web /path/to/android --strict`.
The check does not auto-merge, push or copy files. CI runs on main PR/push and manual dispatch; it does not yet run on every Android-only push.

## Next safe extraction
Identify pure functions in app-main.js (time calculations, normalization and merge helpers) and extract a narrowly scoped module with equivalent behavior and fixtures. Keep UI, native bridge, login/session, network writes and platform alarm code outside that module. Compare current implementations first; preserve differences where intentional. The shared manifest will expand only after behavioral parity tests.
