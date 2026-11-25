// Isolated browser client; not imported by production Mawaeidi.
// Official Neon Supabase-compatibility SDK, Auth + Data API only.
// Never put a Postgres URL/password or management API key in this file.
import { createClient } from '@neon/neon-js/supabase';
export const neonBaseUrl = 'https://ep-royal-sunset-bh71zbq5.c-10.eu-central-1.aws.neon.tech/neondb';
export const client = createClient(neonBaseUrl);
export { createScheduleAdapter } from './schedule-adapter.mjs';
