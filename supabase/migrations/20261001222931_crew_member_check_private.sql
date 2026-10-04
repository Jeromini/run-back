create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_crew_member(p_crew uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.crew_members m where m.crew_id = p_crew and m.user_id = (select auth.uid()));
$$;
revoke execute on function private.is_crew_member(uuid) from public, anon;
grant execute on function private.is_crew_member(uuid) to authenticated;

drop policy "members read crew" on public.crews;
drop policy "members read members" on public.crew_members;
create policy "members read crew" on public.crews for select to authenticated using (private.is_crew_member(id));
create policy "members read members" on public.crew_members for select to authenticated using (private.is_crew_member(crew_id));

create or replace function public.crew_board(p_crew uuid, p_from date, p_to date)
returns table (user_id uuid, display_name text, runs int, run_sec int, dist_m int, strength int, cross_days int, is_me boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_crew_member(p_crew) then raise exception 'Not a member of this crew'; end if;
  if p_to - p_from > 31 then raise exception 'Range too long'; end if;
  return query
  select m.user_id, m.display_name,
    coalesce(count(*) filter (where (d.data->>'runDone')::boolean), 0)::int,
    coalesce(sum(coalesce((d.data->>'runDur')::numeric, (d.data->>'runMin')::numeric * 60, 0)) filter (where (d.data->>'runDone')::boolean), 0)::int,
    coalesce(sum(coalesce((d.data->>'runDistM')::numeric,
      (d.data->>'dist')::numeric * case when p.data->>'dunit' = 'km' then 1000 else 1609.344 end, 0)) filter (where (d.data->>'runDone')::boolean), 0)::int,
    coalesce(count(*) filter (where jsonb_typeof(d.data->'strength') = 'array' and exists (
      select 1 from jsonb_array_elements(d.data->'strength') e, jsonb_array_elements(case when jsonb_typeof(e->'sets') = 'array' then e->'sets' else '[]'::jsonb end) s
      where (s->>'done')::boolean)), 0)::int,
    coalesce(count(*) filter (where (d.data->>'crossDone')::boolean), 0)::int,
    m.user_id = (select auth.uid())
  from public.crew_members m
  left join public.day_logs d on d.user_id = m.user_id and d.date between p_from and p_to
  left join public.profiles p on p.user_id = m.user_id
  where m.crew_id = p_crew
  group by m.user_id, m.display_name, p.data;
end $$;

drop function public.is_crew_member(uuid);
