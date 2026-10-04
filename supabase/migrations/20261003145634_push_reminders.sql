-- Web push subscriptions: each person manages only their own devices.
create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
create policy "own subs read" on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy "own subs insert" on public.push_subscriptions for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own subs update" on public.push_subscriptions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own subs delete" on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, update, delete on public.push_subscriptions to authenticated;
revoke all on public.push_subscriptions from anon;

-- One row per reminder sent, so nothing is sent twice.
create table private.push_log (
  user_id uuid not null,
  kind text not null,
  ref text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);

-- Everything the push function needs, in one call, for the service role only:
-- signing keys, the cron secret, active fasts and their subscriptions.
create or replace function public.push_worklist()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'vapid_public', (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_public'),
    'vapid_private', (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_private'),
    'cron_secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret'),
    'fasts', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', p.user_id, 'fast', p.data->'fastActive', 'subs', (
        select jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
        from public.push_subscriptions s where s.user_id = p.user_id)))
      from public.profiles p
      where jsonb_typeof(p.data->'fastActive') = 'object'
        and exists (select 1 from public.push_subscriptions s where s.user_id = p.user_id)), '[]'::jsonb)
  );
$$;
revoke execute on function public.push_worklist() from public, anon, authenticated;
grant execute on function public.push_worklist() to service_role;

create or replace function public.push_mark(p_user uuid, p_kind text, p_ref text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  insert into private.push_log (user_id, kind, ref) values (p_user, p_kind, p_ref);
  return true;
exception when unique_violation then
  return false;
end $$;
revoke execute on function public.push_mark(uuid, text, text) from public, anon, authenticated;
grant execute on function public.push_mark(uuid, text, text) to service_role;

create or replace function public.push_drop(p_endpoint text)
returns void language sql security definer set search_path = '' as $$
  delete from public.push_subscriptions where endpoint = p_endpoint;
$$;
revoke execute on function public.push_drop(text) from public, anon, authenticated;
grant execute on function public.push_drop(text) to service_role;
