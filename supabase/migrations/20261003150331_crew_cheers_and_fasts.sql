-- One cheer per person, per teammate, per week.
create table public.crew_cheers (
  crew_id uuid not null references public.crews(id) on delete cascade,
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  primary key (crew_id, from_user, to_user, week_start),
  check (from_user <> to_user)
);
alter table public.crew_cheers enable row level security;
create policy "members read cheers" on public.crew_cheers for select to authenticated using (private.is_crew_member(crew_id));
create policy "members cheer teammates" on public.crew_cheers for insert to authenticated
  with check (from_user = (select auth.uid()) and private.is_crew_member(crew_id)
    and exists (select 1 from public.crew_members m where m.crew_id = crew_cheers.crew_id and m.user_id = crew_cheers.to_user));
create policy "undo own cheer" on public.crew_cheers for delete to authenticated using (from_user = (select auth.uid()));
grant select, insert, delete on public.crew_cheers to authenticated;
revoke all on public.crew_cheers from anon;

drop function public.crew_board(uuid, date, date);
create function public.crew_board(p_crew uuid, p_from date, p_to date)
returns table (user_id uuid, display_name text, runs int, run_sec int, dist_m int, strength int, cross_days int, fast_days int, cheers int, cheered_by_me boolean, is_me boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_crew_member(p_crew) then raise exception 'Not a member of this crew'; end if;
  if p_to - p_from > 31 then raise exception 'Range too long'; end if;
  return query
  with members as (select m.user_id, m.display_name from public.crew_members m where m.crew_id = p_crew),
  days as (
    select d.user_id, d.data,
      coalesce((d.data->>'runDone')::boolean, false) as run_done,
      coalesce((select sum(coalesce((a->>'min')::numeric, 0)) from jsonb_array_elements(case when jsonb_typeof(d.data->'acts') = 'array' then d.data->'acts' else '[]'::jsonb end) a
                where a->>'type' in ('run-out', 'run-tread', 'trail-run', 'tread-intervals', 'tread-curved', 'track')), 0) as run_act_min,
      exists (select 1 from jsonb_array_elements(case when jsonb_typeof(d.data->'acts') = 'array' then d.data->'acts' else '[]'::jsonb end) a
              where a->>'type' not in ('run-out', 'run-tread', 'trail-run', 'tread-intervals', 'tread-curved', 'track')) as other_act,
      jsonb_typeof(d.data->'fasts') = 'array' and jsonb_array_length(d.data->'fasts') > 0 as fasted
    from public.day_logs d
    where d.date between p_from and p_to and d.user_id in (select mm.user_id from members mm)
  )
  select m.user_id, m.display_name,
    coalesce(count(x.*) filter (where x.run_done or x.run_act_min > 0), 0)::int,
    coalesce(sum(case when x.run_done then coalesce((x.data->>'runDur')::numeric, (x.data->>'runMin')::numeric * 60, 0) else 0 end + coalesce(x.run_act_min, 0) * 60), 0)::int,
    coalesce(sum(coalesce((x.data->>'runDistM')::numeric,
      (x.data->>'dist')::numeric * case when p.data->>'dunit' = 'km' then 1000 else 1609.344 end, 0)) filter (where x.run_done), 0)::int,
    coalesce(count(x.*) filter (where jsonb_typeof(x.data->'strength') = 'array' and exists (
      select 1 from jsonb_array_elements(x.data->'strength') e, jsonb_array_elements(case when jsonb_typeof(e->'sets') = 'array' then e->'sets' else '[]'::jsonb end) s
      where (s->>'done')::boolean)), 0)::int,
    coalesce(count(x.*) filter (where coalesce((x.data->>'crossDone')::boolean, false) or x.other_act), 0)::int,
    coalesce(count(x.*) filter (where x.fasted), 0)::int,
    (select count(*) from public.crew_cheers c where c.crew_id = p_crew and c.to_user = m.user_id and c.week_start = p_from)::int,
    exists (select 1 from public.crew_cheers c where c.crew_id = p_crew and c.to_user = m.user_id and c.week_start = p_from and c.from_user = (select auth.uid())),
    m.user_id = (select auth.uid())
  from members m
  left join days x on x.user_id = m.user_id
  left join public.profiles p on p.user_id = m.user_id
  group by m.user_id, m.display_name, p.data;
end $$;
revoke execute on function public.crew_board(uuid, date, date) from public, anon;
grant execute on function public.crew_board(uuid, date, date) to authenticated;
