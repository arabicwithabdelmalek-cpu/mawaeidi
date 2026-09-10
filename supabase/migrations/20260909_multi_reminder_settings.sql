begin;

alter table public.mawaeidi_push_subscriptions
  add column if not exists lead_minutes_list smallint[];

update public.mawaeidi_push_subscriptions
set lead_minutes_list = array[lead_minutes]::smallint[]
where lead_minutes_list is null
   or cardinality(lead_minutes_list) = 0;

alter table public.mawaeidi_push_subscriptions
  alter column lead_minutes_list set default array[60, 15]::smallint[],
  alter column lead_minutes_list set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mawaeidi_push_lead_minutes_list_check'
      and conrelid = 'public.mawaeidi_push_subscriptions'::regclass
  ) then
    alter table public.mawaeidi_push_subscriptions
      add constraint mawaeidi_push_lead_minutes_list_check
      check (
        cardinality(lead_minutes_list) between 1 and 3
        and lead_minutes_list <@ array[5, 10, 15, 30, 60]::smallint[]
      );
  end if;
end
$$;

grant select (lead_minutes_list)
  on public.mawaeidi_push_subscriptions to authenticated;
grant insert (lead_minutes_list)
  on public.mawaeidi_push_subscriptions to authenticated;
grant update (lead_minutes_list)
  on public.mawaeidi_push_subscriptions to authenticated;

commit;
