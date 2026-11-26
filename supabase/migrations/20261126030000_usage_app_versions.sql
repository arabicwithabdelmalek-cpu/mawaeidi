-- Additive, backwards-compatible activity version reporting. No hardware IDs.
begin;
alter table public.mawaeidi_usage_sessions add column if not exists app_version text;
alter table public.mawaeidi_usage_sessions
  add constraint mawaeidi_usage_app_version_format check (
    app_version is null or (
      client_type in ('android','ios') and length(app_version) <= 64
      and app_version ~ '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$'
    )
  ) not valid;
alter table public.mawaeidi_usage_sessions validate constraint mawaeidi_usage_app_version_format;

-- Separate RPC: do not overwrite the existing usage report or its permissions.
create or replace function public.mawaeidi_admin_usage_versions()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare actor uuid := (select auth.uid());
begin
  if actor is null or not exists (
    select 1 from public.mawaeidi_usage_admins a where a.user_id = actor
  ) then
    raise exception 'admin_only' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(to_jsonb(x) order by x.last_seen_at desc)
    from (
      select distinct on (s.user_id,s.client_type)
        s.user_id,s.client_type,s.last_seen_at,s.app_version
      from public.mawaeidi_usage_sessions s
      where s.last_seen_at >= now() - interval '90 days'
      order by s.user_id,s.client_type,s.last_seen_at desc,s.started_at desc,s.session_key
    ) x
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.mawaeidi_admin_usage_versions() from public, anon, authenticated;
grant execute on function public.mawaeidi_admin_usage_versions() to authenticated;
commit;
