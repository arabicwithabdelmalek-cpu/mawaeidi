begin;

alter table public.mawaeidi_data
  add column if not exists finance jsonb;

update public.mawaeidi_data
set finance = '{"version":1,"agreements":[],"cycles":[],"payments":[],"monthCounts":[]}'::jsonb
where finance is null;

alter table public.mawaeidi_data
  alter column finance set default '{"version":1,"agreements":[],"cycles":[],"payments":[],"monthCounts":[]}'::jsonb,
  alter column finance set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mawaeidi_data_finance_shape_check'
      and conrelid = 'public.mawaeidi_data'::regclass
  ) then
    alter table public.mawaeidi_data
      add constraint mawaeidi_data_finance_shape_check
      check (
        jsonb_typeof(finance) = 'object'
        and jsonb_typeof(coalesce(finance -> 'agreements', '[]'::jsonb)) = 'array'
        and jsonb_typeof(coalesce(finance -> 'cycles', '[]'::jsonb)) = 'array'
        and jsonb_typeof(coalesce(finance -> 'payments', '[]'::jsonb)) = 'array'
        and jsonb_typeof(coalesce(finance -> 'monthCounts', '[]'::jsonb)) = 'array'
        and octet_length(finance::text) <= 5242880
      );
  end if;
end
$$;

alter table public.mawaeidi_history
  add column if not exists before_finance jsonb,
  add column if not exists after_finance jsonb;

update public.mawaeidi_history
set
  before_finance = coalesce(before_finance, '{"version":1,"agreements":[],"cycles":[],"payments":[],"monthCounts":[]}'::jsonb),
  after_finance = coalesce(after_finance, '{"version":1,"agreements":[],"cycles":[],"payments":[],"monthCounts":[]}'::jsonb)
where before_finance is null or after_finance is null;

alter table public.mawaeidi_history
  alter column before_finance set default '{"version":1,"agreements":[],"cycles":[],"payments":[],"monthCounts":[]}'::jsonb,
  alter column before_finance set not null,
  alter column after_finance set default '{"version":1,"agreements":[],"cycles":[],"payments":[],"monthCounts":[]}'::jsonb,
  alter column after_finance set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mawaeidi_history_before_finance_check'
      and conrelid = 'public.mawaeidi_history'::regclass
  ) then
    alter table public.mawaeidi_history
      add constraint mawaeidi_history_before_finance_check
      check (jsonb_typeof(before_finance) = 'object' and octet_length(before_finance::text) <= 5242880);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'mawaeidi_history_after_finance_check'
      and conrelid = 'public.mawaeidi_history'::regclass
  ) then
    alter table public.mawaeidi_history
      add constraint mawaeidi_history_after_finance_check
      check (jsonb_typeof(after_finance) = 'object' and octet_length(after_finance::text) <= 5242880);
  end if;
end
$$;

create or replace function private.log_mawaeidi_lessons_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_lessons jsonb;
  previous_finance jsonb;
begin
  if tg_op = 'INSERT' then
    previous_lessons := '[]'::jsonb;
    previous_finance := '{"version":1,"agreements":[],"cycles":[],"payments":[],"monthCounts":[]}'::jsonb;
  else
    previous_lessons := coalesce(old.lessons, '[]'::jsonb);
    previous_finance := coalesce(old.finance, '{"version":1,"agreements":[],"cycles":[],"payments":[],"monthCounts":[]}'::jsonb);
  end if;

  insert into public.mawaeidi_history (
    user_id,
    before_lessons,
    after_lessons,
    before_finance,
    after_finance
  )
  values (
    new.user_id,
    previous_lessons,
    coalesce(new.lessons, '[]'::jsonb),
    previous_finance,
    coalesce(new.finance, '{"version":1,"agreements":[],"cycles":[],"payments":[],"monthCounts":[]}'::jsonb)
  );

  delete from public.mawaeidi_history
  where id in (
    select id
    from public.mawaeidi_history
    where user_id = new.user_id
    order by created_at desc, id desc
    offset 50
  );

  return new;
end;
$$;

revoke all on function private.log_mawaeidi_lessons_change() from public, anon, authenticated;

drop trigger if exists mawaeidi_lessons_history on public.mawaeidi_data;
create trigger mawaeidi_lessons_history
after update of lessons, finance on public.mawaeidi_data
for each row
when (old.lessons is distinct from new.lessons or old.finance is distinct from new.finance)
execute function private.log_mawaeidi_lessons_change();

drop trigger if exists mawaeidi_lessons_initial_history on public.mawaeidi_data;
create trigger mawaeidi_lessons_initial_history
after insert on public.mawaeidi_data
for each row
when (
  jsonb_array_length(new.lessons) > 0
  or jsonb_array_length(coalesce(new.finance -> 'agreements', '[]'::jsonb)) > 0
  or jsonb_array_length(coalesce(new.finance -> 'payments', '[]'::jsonb)) > 0
)
execute function private.log_mawaeidi_lessons_change();

notify pgrst, 'reload schema';

commit;
