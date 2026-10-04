create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('push-tick', '*/5 * * * *', $job$
  select net.http_post(
    url := 'https://bxmjxupypptofjrcofcb.supabase.co/functions/v1/push-tick',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000);
$job$);
