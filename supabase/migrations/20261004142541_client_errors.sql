-- Crash and error reports from the app. Signed-in users can add rows for themselves; nobody can read them through the API (review in the dashboard).
create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  at timestamptz not null default now(),
  message text not null check (char_length(message) <= 500),
  source text check (char_length(source) <= 300),
  stack text check (char_length(stack) <= 4000),
  view text check (char_length(view) <= 40),
  app_version text check (char_length(app_version) <= 40),
  ua text check (char_length(ua) <= 300)
);
alter table public.client_errors enable row level security;
create policy "insert own errors" on public.client_errors for insert to authenticated with check (user_id = (select auth.uid()));
revoke all on public.client_errors from anon;
grant insert on public.client_errors to authenticated;
create index if not exists client_errors_at_idx on public.client_errors (at desc);
create index if not exists client_errors_user_idx on public.client_errors (user_id);
