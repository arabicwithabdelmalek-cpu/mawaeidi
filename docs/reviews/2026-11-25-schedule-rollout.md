# Schedule safe synchronization rollout

Based on current production main 0d43b198fec9600e0a552e68c195cdd4571922fa, selectively ports prior CAS review rather than merging stale review branches. Production schema inspected read-only: mawaeidi_data has UUID primary key, JSONB lessons and finance, timestamptz updated_at, owner RLS and history/trash triggers. Finance has a non-null default; CAS writes lessons and updated_at only. No production SQL or deployment yet.

Tests include synthetic finance preservation, first-write and stale-write races, history, trash and RLS. New web clients require the reviewed RPC; never fall back to unsafe upsert. Old Android and web clients remain capable of direct writes, so full rollout needs an Android port, device tests, and a separate migration plan for direct write restrictions. A conflict draft is in memory and should be downloaded before leaving. The browser warning is best-effort, especially on mobile.

Deployment order: verify CI; verify exact live trigger behavior and backups; install additive RPC in correct database; validate permissions; deploy web and Android clients; only consider retiring direct writes once compatible clients have been rolled out. Do not alter finance, auth or hosting. Keep existing logo navigation.
