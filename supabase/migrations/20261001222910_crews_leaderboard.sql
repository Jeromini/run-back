create table public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.crew_members (
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);
create index crew_members_user_idx on public.crew_members(user_id);

alter table public.crews enable row level security;
alter table public.crew_members enable row level security;

-- membership check used by policies; security definer avoids recursive RLS on crew_members
create or replace function public.is_crew_member(p_crew uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.crew_members m where m.crew_id = p_crew and m.user_id = (select auth.uid()));
$$;

create policy "members read crew" on public.crews for select to authenticated using (public.is_crew_member(id));
create policy "members read members" on public.crew_members for select to authenticated using (public.is_crew_member(crew_id));
create policy "leave crew" on public.crew_members for delete to authenticated using (user_id = (select auth.uid()));
create policy "rename self" on public.crew_members for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select on public.crews to authenticated;
grant select, update (display_name), delete on public.crew_members to authenticated;
revoke all on public.crews, public.crew_members from anon;

create or replace function public.create_crew(p_name text, p_display text)
returns public.crews language plpgsql security definer set search_path = '' as $$
declare c public.crews; v_code text; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  loop
    v_code := upper(substr(translate(encode(extensions.gen_random_bytes(8), 'base64'), '+/=0O1Il', ''), 1, 6));
    exit when char_length(v_code) = 6 and not exists (select 1 from public.crews where code = v_code);
  end loop;
  insert into public.crews (name, code, created_by) values (trim(p_name), v_code, me) returning * into c;
  insert into public.crew_members (crew_id, user_id, display_name) values (c.id, me, trim(p_display));
  return c;
end $$;

create or replace function public.join_crew(p_code text, p_display text)
returns public.crews language plpgsql security definer set search_path = '' as $$
declare c public.crews; me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into c from public.crews where code = upper(trim(p_code));
  if not found then raise exception 'No crew with that code'; end if;
  if (select count(*) from public.crew_members where crew_id = c.id) >= 50 then raise exception 'That crew is full'; end if;
  insert into public.crew_members (crew_id, user_id, display_name) values (c.id, me, trim(p_display))
    on conflict (crew_id, user_id) do update set display_name = excluded.display_name;
  return c;
end $$;

-- weekly totals for each member of a crew the caller belongs to; never exposes raw logs
create or replace function public.crew_board(p_crew uuid, p_from date, p_to date)
returns table (user_id uuid, display_name text, runs int, run_sec int, dist_m int, strength int, cross_days int, is_me boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_crew_member(p_crew) then raise exception 'Not a member of this crew'; end if;
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

revoke execute on function public.create_crew(text, text), public.join_crew(text, text), public.crew_board(uuid, date, date), public.is_crew_member(uuid) from public, anon;
grant execute on function public.create_crew(text, text), public.join_crew(text, text), public.crew_board(uuid, date, date), public.is_crew_member(uuid) to authenticated;
