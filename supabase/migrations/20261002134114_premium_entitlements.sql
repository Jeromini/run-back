-- Premium status lives on the server. Clients can read their own row, never write it.
create table public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'pro' check (tier in ('pro')),
  source text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.entitlements enable row level security;
create policy "read own entitlement" on public.entitlements for select to authenticated using (user_id = (select auth.uid()));
grant select on public.entitlements to authenticated;
revoke all on public.entitlements from anon;

-- Access codes for testers, partners and VIPs until card checkout is connected. No client access at all.
create table private.premium_codes (
  code text primary key check (code = upper(code)),
  days int check (days is null or days > 0),
  max_uses int not null default 1 check (max_uses > 0),
  uses int not null default 0,
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
create table private.premium_redemptions (
  code text not null references private.premium_codes(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  primary key (code, user_id)
);
revoke all on private.premium_codes, private.premium_redemptions from public, anon, authenticated;

create or replace function public.redeem_premium_code(p_code text)
returns public.entitlements language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); c private.premium_codes; e public.entitlements; v_until timestamptz;
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into c from private.premium_codes where code = upper(trim(p_code)) for update;
  if not found or (c.expires_at is not null and c.expires_at < now()) then raise exception 'That code is not valid'; end if;
  if exists (select 1 from private.premium_redemptions r where r.code = c.code and r.user_id = me) then
    select * into e from public.entitlements where user_id = me; return e;
  end if;
  if c.uses >= c.max_uses then raise exception 'That code has been fully used'; end if;
  v_until := case when c.days is null then null else now() + make_interval(days => c.days) end;
  insert into public.entitlements (user_id, tier, source, expires_at)
    values (me, 'pro', 'code:' || c.code, v_until)
    on conflict (user_id) do update set
      source = excluded.source,
      -- never shorten an existing grant: lifetime wins, otherwise keep the later date
      expires_at = case when public.entitlements.expires_at is null or excluded.expires_at is null then null
                        else greatest(public.entitlements.expires_at, excluded.expires_at) end,
      updated_at = now()
    returning * into e;
  update private.premium_codes set uses = uses + 1 where code = c.code;
  insert into private.premium_redemptions (code, user_id) values (c.code, me);
  return e;
end $$;
revoke execute on function public.redeem_premium_code(text) from public, anon;
grant execute on function public.redeem_premium_code(text) to authenticated;
