-- The reminder worker owns this operational table. Browser clients must never
-- read or write notification-delivery logs, even when signed in.
create policy "deny notification log access from browsers"
on public.mawaeidi_notification_log
for all
to anon, authenticated
using (false)
with check (false);
