-- Owner-only support preview (read-only) with server-side audit.
-- No impersonation token is created. Passwords, contacts, finance and private notes
-- are excluded from the returned snapshot.
create table if not exists public.mawaeidi_admin_support_audit (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(btrim(reason)) between 8 and 240),
  event_type text not null default 'readonly_preview'
    check (event_type = 'readonly_preview'),
  created_at timestamptz not null default now()
);
create index if not exists mawaeidi_support_audit_actor_date_idx
  on public.mawaeidi_admin_support_audit(actor_user_id,created_at desc);
alter table public.mawaeidi_admin_support_audit enable row level security;
revoke all on public.mawaeidi_admin_support_audit from public,anon,authenticated;

create or replace function public.mawaeidi_admin_support_preview(
  p_target uuid, p_reason text
) returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_target_email text;
  v_target_name text;
  v_view_id uuid;
begin
  if v_actor is null or not exists (
    select 1 from public.mawaeidi_usage_admins a where a.user_id=v_actor
  ) then raise exception 'admin_only' using errcode='42501'; end if;
  if p_target is null or p_reason is null
     or char_length(btrim(p_reason)) not between 8 and 240 then
    raise exception 'reason_required' using errcode='22023';
  end if;
  if exists (
    select 1 from public.mawaeidi_usage_admins a
    where a.user_id=p_target and a.user_id<>v_actor
  ) then raise exception 'other_admin_protected' using errcode='42501'; end if;

  select u.email, coalesce(nullif(u.raw_user_meta_data->>'full_name',''),split_part(u.email,'@',1))
  into v_target_email,v_target_name
  from auth.users u where u.id=p_target;
  if not found then raise exception 'user_not_found' using errcode='22023'; end if;

  insert into public.mawaeidi_admin_support_audit(actor_user_id,target_user_id,reason)
  values(v_actor,p_target,btrim(p_reason)) returning id into v_view_id;

  return jsonb_build_object(
    'audit_id',v_view_id,
    'viewed_at',now(),
    'readonly',true,
    'user',jsonb_build_object('id',p_target,'name',v_target_name,'email',v_target_email),
    'lessons_count',(select jsonb_array_length(d.lessons) from public.mawaeidi_data d
                     where d.user_id=p_target),
    'lessons',(
      select coalesce(jsonb_agg(
         jsonb_build_object(
           'name',l.lesson->>'name',
           'subject',l.lesson->>'subject',
           'type',l.lesson->>'type',
           'duration',l.lesson->>'duration',
           'platform',l.lesson->>'platform',
           'schedules',(
             select coalesce(jsonb_agg(jsonb_build_object(
               'day',s.item->>'day','time',s.item->>'time'
             )),'[]'::jsonb)
             from jsonb_array_elements(
               case when jsonb_typeof(l.lesson->'schedules')='array'
                 then l.lesson->'schedules' else '[]'::jsonb end
             ) s(item)
           )
         ) order by l.ord),'[]'::jsonb)
      from (
        select el as lesson,ord
        from public.mawaeidi_data d,
        lateral jsonb_array_elements(d.lessons) with ordinality as entries(el,ord)
        where d.user_id=p_target
        order by ord limit 100
      ) l
    ),
    'students_count',(
      select count(*) from public.mawaeidi_students s
      where s.user_id=p_target and s.deleted_at is null
    ),
    'students',(
      select coalesce(jsonb_agg(jsonb_build_object(
         'name',concat_ws(' ',nullif(s.first_name,''),nullif(s.last_name,'')),
         'status',s.status,'level',s.current_level,'country',s.country
      ) order by s.first_name,s.last_name),'[]'::jsonb)
      from (
        select first_name,last_name,status,current_level,country
        from public.mawaeidi_students
        where user_id=p_target and deleted_at is null
        order by first_name,last_name limit 50
      ) s
    ),
    'clock',(
      select jsonb_build_object(
        'base_zone',c.base_zone,'zones',to_jsonb(c.zones),'updated_at',c.updated_at
      ) from public.mawaeidi_world_clock_settings c where c.user_id=p_target
    )
  );
end;
$$;
revoke all on function public.mawaeidi_admin_support_preview(uuid,text)
  from public,anon,authenticated;
grant execute on function public.mawaeidi_admin_support_preview(uuid,text)
  to authenticated;

create or replace function public.mawaeidi_admin_support_history(p_limit integer default 20)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare v_actor uuid := (select auth.uid());
begin
  if v_actor is null or not exists (
    select 1 from public.mawaeidi_usage_admins a where a.user_id=v_actor
  ) then raise exception 'admin_only' using errcode='42501'; end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'target_name',coalesce(nullif(u.raw_user_meta_data->>'full_name',''),split_part(u.email,'@',1)),
      'target_email',u.email,'reason',a.reason,'created_at',a.created_at
    ) order by a.created_at desc),'[]'::jsonb)
    from (
      select target_user_id,reason,created_at
      from public.mawaeidi_admin_support_audit
      where actor_user_id=v_actor order by created_at desc
      limit least(greatest(coalesce(p_limit,20),1),100)
    ) a join auth.users u on u.id=a.target_user_id
  );
end;
$$;
revoke all on function public.mawaeidi_admin_support_history(integer)
  from public,anon,authenticated;
grant execute on function public.mawaeidi_admin_support_history(integer)
  to authenticated;
