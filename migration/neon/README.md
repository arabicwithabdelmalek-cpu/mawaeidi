# Mawaeidi → Neon migration
Status: preparation only. No production cutover, no source database export, no destination connection yet.

Source baseline: 0d43b198fec9600e0a552e68c195cdd4571922fa (main).
Nhost pilot is not the data source; it contains only test accounts and synthetic test data. Do not import it as production.

## Required sequence
1. Connect the Neon integration; inspect actual project permissions and plan before provisioning. Use a separate pilot with synthetic records.
2. Restore the original Supabase project (nvefdkkjkyalpsrgoffj) via the authorized owner. If the free limit blocks restoration, resolve organization ownership or plan first; do not stop another live project without owner approval.
3. Securely export the original application schema, records, identity mappings and storage files. Verify row counts, file hashes and recovery backups. Never commit exports, credentials, or personal data to GitHub.
4. Assess Neon Import Data Assistant or pg_dump/pg_restore for application tables; do not blindly restore provider-managed auth/storage schemas. Inspect extensions, dependencies, triggers, functions, roles and policies.
5. Adapt managed authentication; preserve a verified mapping between original user UUIDs and new auth identities. Validate password hash compatibility or use secure password resets. Keep public sign-up disabled and privilege assignment server-side.
6. Adapt Data API/RLS using verified JWT identity; never trust a browser-supplied owner ID. Test read/write/delete isolation between two users and anonymous denial.
7. Port and test storage authorization, schedule changes, real-time sync, admin and reminder functions; check free-plan limits and mobile session flows.
8. Only after complete backup, acceptance tests and approval, update the web and Android/PWA production configuration and publish. Retain rollback path.

## Source code inventory
- app-main.js: Supabase session, password recovery, sign-out, realtime, mawaeidi_data, mawaeidi_trash, world-clock RPCs, restore RPC, backup and notification flows.
- students/student-registry.js, students/student-workspace-upgrade.js: registry, photo bucket, follow-ups, trash.
- account.js / account-page.js: profile, avatar, password change events.
- activity-tracker.js, admin-dashboard.js, admin-accounts.js, admin-support.js, admin-vault.js, admin-credentials.js: administrative features; do not port any plaintext password access; preserve least privilege and audit.
- supabase/migrations and functions: auth.uid(), provider-specific RLS/storage/realtime, schedule history and reminders. Review actual source schema before translation.
- Android Capacitor/PWA: test mobile auth, notification scheduling, and asset cache versions.

## References
- https://neon.com/migration
- https://neon.com/tools
- https://neon.com/blog/neon-backend-is-ga
