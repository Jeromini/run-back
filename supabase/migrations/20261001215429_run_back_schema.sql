create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.day_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.profiles enable row level security;
alter table public.day_logs enable row level security;

create policy "own profile select" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "own profile insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own profile delete" on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy "own logs select" on public.day_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy "own logs insert" on public.day_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own logs update" on public.day_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own logs delete" on public.day_logs for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.profiles, public.day_logs to authenticated;
revoke all on public.profiles, public.day_logs from anon;
