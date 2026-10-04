# Scheduled jobs and Vault secrets

Exported read-only from project `bxmjxupypptofjrcofcb` on 2026-10-04.

## pg_cron jobs

| jobid | name | schedule | active |
|---|---|---|---|
| 1 | push-tick | `*/5 * * * *` (every 5 minutes) | yes |

Command (as stored in `cron.job`):

```sql
select net.http_post(
  url := 'https://bxmjxupypptofjrcofcb.supabase.co/functions/v1/push-tick',
  headers := jsonb_build_object('Content-Type', 'application/json',
    'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')),
  body := '{}'::jsonb,
  timeout_milliseconds := 20000);
```

The job is created by migration `20261003150258_schedule_push_tick.sql`, which also enables
the `pg_cron` and `pg_net` extensions. It posts to the `push-tick` edge function with the
cron secret read from Vault at run time, so no secret is stored in the job text.

If the project URL ever changes (new project), edit the URL in that migration before running it.

## Vault secrets (names only)

Values are never exported. They must be created by hand in a new project
(Dashboard > Project Settings > Vault, or `select vault.create_secret('<value>', '<name>');`).

| name | used by | purpose |
|---|---|---|
| `push_cron_secret` | cron job `push-tick`, `public.push_worklist()` | Shared secret sent as `x-cron-secret`; `push-tick` rejects calls without it. Any long random string. |
| `vapid_public` | `public.push_worklist()` -> `push-tick` | Web Push VAPID public key. Must equal `VAPID_PUBLIC` in `src/config.js`. |
| `vapid_private` | `public.push_worklist()` -> `push-tick` | Web Push VAPID private key paired with the public key above. |

`public.push_worklist()` reads these from `vault.decrypted_secrets` and is executable by
`service_role` only.
