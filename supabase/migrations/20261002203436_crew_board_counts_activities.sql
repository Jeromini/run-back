create or replace function public.crew_board(p_crew uuid, p_from date, p_to date)
returns table (user_id uuid, display_name text, runs int, run_sec int, dist_m int, strength int, cross_days int, is_me boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_crew_member(p_crew) then raise exception 'Not a member of this crew'; end if;
  if p_to - p_from > 31 then raise exception 'Range too long'; end if;
  return query
  with days as (
    select d.user_id, d.data,
      coalesce((d.data->>'runDone')::boolean, false) as run_done,
      coalesce((select sum(coalesce((a->>'min')::numeric, 0)) from jsonb_array_elements(case when jsonb_typeof(d.data->'acts') = 'array' then d.data->'acts' else '[]'::jsonb end) a
                where a->>'type' in ('run-out', 'run-tread', 'trail-run')), 0) as run_act_min,
      exists (select 1 from jsonb_array_elements(case when jsonb_typeof(d.data->'acts') = 'array' then d.data->'acts' else '[]'::jsonb end) a
              where a->>'type' not in ('run-out', 'run-tread', 'trail-run')) as other_act
    from public.day_logs d
    where d.date between p_from and p_to
  )
  select m.user_id, m.display_name,
    coalesce(count(*) filter (where x.run_done or x.run_act_min > 0), 0)::int,
    coalesce(sum(case when x.run_done then coalesce((x.data->>'runDur')::numeric, (x.data->>'runMin')::numeric * 60, 0) else 0 end + x.run_act_min * 60), 0)::int,
    coalesce(sum(coalesce((x.data->>'runDistM')::numeric,
      (x.data->>'dist')::numeric * case when p.data->>'dunit' = 'km' then 1000 else 1609.344 end, 0)) filter (where x.run_done), 0)::int,
    coalesce(count(*) filter (where jsonb_typeof(x.data->'strength') = 'array' and exists (
      select 1 from jsonb_array_elements(x.data->'strength') e, jsonb_array_elements(case when jsonb_typeof(e->'sets') = 'array' then e->'sets' else '[]'::jsonb end) s
      where (s->>'done')::boolean)), 0)::int,
    coalesce(count(*) filter (where coalesce((x.data->>'crossDone')::boolean, false) or x.other_act), 0)::int,
    m.user_id = (select auth.uid())
  from public.crew_members m
  left join days x on x.user_id = m.user_id
  left join public.profiles p on p.user_id = m.user_id
  where m.crew_id = p_crew
  group by m.user_id, m.display_name, p.data;
end $$;
