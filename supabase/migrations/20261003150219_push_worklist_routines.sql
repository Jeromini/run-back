create or replace function public.push_worklist()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'vapid_public', (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_public'),
    'vapid_private', (select decrypted_secret from vault.decrypted_secrets where name = 'vapid_private'),
    'cron_secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret'),
    'people', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', p.user_id,
        'fast', p.data->'fastActive',
        'routine', p.data->'routine',
        'tz', coalesce(p.data->>'tz', 'UTC'),
        'last_fast_start', (select max((f->>'s')::bigint) from public.day_logs d,
                              jsonb_array_elements(case when jsonb_typeof(d.data->'fasts') = 'array' then d.data->'fasts' else '[]'::jsonb end) f
                            where d.user_id = p.user_id and d.date >= current_date - 2),
        'subs', (select jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
                 from public.push_subscriptions s where s.user_id = p.user_id)))
      from public.profiles p
      where (jsonb_typeof(p.data->'fastActive') = 'object' or coalesce((p.data->'routine'->>'on')::boolean, false))
        and exists (select 1 from public.push_subscriptions s where s.user_id = p.user_id)), '[]'::jsonb)
  );
$$;
revoke execute on function public.push_worklist() from public, anon, authenticated;
grant execute on function public.push_worklist() to service_role;
