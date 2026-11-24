# Mawaeidi → Nhost pilot

This branch is not production and must not be merged yet. It does not change the existing website, Android app or any Supabase project.

## Scope and prerequisites
1. Owner creates a separate free Nhost test project and supplies only its public region and subdomain. Disable public sign-up before importing real accounts. No admin secrets in Git or browser.
2. Restore access to the old Supabase project first. Export database schema and rows, Auth user IDs and compatible password hashes (privately), storage object files and mapping, and verify backup integrity. Existing app backups are also useful. Do not upload personal data to GitHub. Do not delete or pause another production project without owner review.
3. In the empty Nhost test database, use the provisional schedule SQL only for synthetic testing. Track the table and apply the reference Hasura permissions through the Nhost dashboard. Never allow public access. Do not apply this SQL to the old database.
4. Test with two synthetic authenticated users. Each must read and write only their own schedule. Verify direct attempts to set another user's ID fail, and that unauthenticated access fails. Test empty schedule, import, update, network failure, sign-out, token refresh, and simultaneous updates across devices. Unit mocks are not integration tests.
5. Preserve source UUIDs during eventual migration where possible; map all foreign keys and storage paths. Validate imported password hashes; if unsupported, use a reset flow. Never copy plaintext passwords, admin vault contents, or Supabase JWT sessions into browser code. Keep privileged administration server-only.

## Work inventory (source: current main)
- app-main.js: auth, schedules, history, trash, world clock, realtime, notifications, backup; preserve normalization and session records.
- students/student-registry.js and student-workspace-upgrade.js: registry, photos, bulk operations, follow-ups and trash.
- account.js/account-page.js: profile, private avatar, email and password flows.
- activity-tracker.js and admin modules: activity, verified administrator role, audited support, server-side account management.
- supabase/migrations: source schema starting point only; inspect actual original schema, adapt auth.uid(), RLS, storage paths, realtime and RPCs to Nhost rather than importing blindly.
- supabase/functions: reminders, push testing, admin accounts need reimplementation and separate permissions/secret management. Never expose privileged secrets.
- sw.js and www/: versioned web and mobile assets; preserve old production versions until cutover.

## Acceptance gates before cutover
- Source export verified and privately retained; per-table counts, UUID relationships, file checksums and auth recovery checked.
- Hasura owner and storage access verified with two accounts; no public access to private records.
- All schedule/registry/trash/world clock/backup/admin/auth tests pass in the Nhost environment.
- Realtime, concurrent edits, password reset, Android/PWA notifications verified independently.
- User approves cutover and rollback plan. Keep old project intact until verification and final approval.

## Local unit checks
`node --test migration/nhost/schedule-client.test.mjs`

## References
- https://docs.nhost.io/platform/cloud/subdomain
- https://docs.nhost.io/products/graphql/permissions
- https://docs.nhost.io/products/auth/users
- https://docs.nhost.io/products/storage/permissions
