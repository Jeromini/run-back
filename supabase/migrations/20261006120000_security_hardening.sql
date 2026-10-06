-- Security hardening from the October review.

-- 1. push-tick checks its shared secret before it reads any other secret or anyone's data.
create or replace function public.push_check_secret(p_secret text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(p_secret, '') <> '' and p_secret = (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret');
$$;
revoke execute on function public.push_check_secret(text) from public, anon, authenticated;
grant execute on function public.push_check_secret(text) to service_role;

-- 2. Push endpoints must be https URLs of a sane length (the edge function also allowlists push hosts).
alter table public.push_subscriptions
  add constraint push_subscriptions_endpoint_https check (endpoint ~ '^https://' and char_length(endpoint) <= 1000);

-- 3. Error reports: at most 30 per user per hour. Extra rows are dropped quietly, so the app never errors.
create or replace function private.client_errors_rate_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.client_errors e where e.user_id = new.user_id and e.at > now() - interval '1 hour') >= 30 then
    return null;
  end if;
  return new;
end;
$$;
revoke execute on function private.client_errors_rate_limit() from public, anon, authenticated;
drop trigger if exists client_errors_rate_limit on public.client_errors;
create trigger client_errors_rate_limit before insert on public.client_errors
  for each row execute function private.client_errors_rate_limit();
