# Run Back backend (Supabase)

This folder holds everything that runs on the Supabase side of Run Back, exported from the
live project `bxmjxupypptofjrcofcb` so it can be rebuilt from git.

## What lives here

- `migrations/` - the nine applied migrations, exactly as recorded in
  `supabase_migrations.schema_migrations`. Together they create:
  - `public.profiles`, `public.day_logs` - per-user app data (JSON), owner-only RLS.
  - `public.crews`, `public.crew_members`, `public.crew_cheers` - crews and the weekly
    leaderboard (`public.crew_board`, `create_crew`, `join_crew`).
  - `public.entitlements` plus `private.premium_codes` / `private.premium_redemptions` -
    premium status and access codes (`public.redeem_premium_code`).
  - `public.push_subscriptions`, `private.push_log` and the service-role-only functions
    `push_worklist`, `push_mark`, `push_drop` used by push reminders.
  - The `pg_cron` job that calls `push-tick` every 5 minutes.
- `functions/food-search/` - proxies Open Food Facts search for the food picker.
- `functions/push-tick/` - sends fasting reminders via Web Push.
- `config.toml` - project id and per-function `verify_jwt` settings.
- `cron_and_vault.md` - the cron job and the Vault secret names it depends on.

## Redeploy

Install the Supabase CLI, then from `web/`:

```sh
supabase login
supabase link --project-ref bxmjxupypptofjrcofcb

# Database: applies any migrations not yet recorded on the remote
supabase db push

# Edge functions
supabase functions deploy food-search
supabase functions deploy push-tick --no-verify-jwt
```

`push-tick` must be deployed with `--no-verify-jwt` (pg_cron calls it without a user JWT;
the function checks the `x-cron-secret` header instead). `food-search` keeps JWT checking on.
`config.toml` records the same settings.

For a brand new project: create the Vault secrets below first (the cron job and
`push_worklist` read them at run time), change the project ref and the URL inside
`migrations/20261003150258_schedule_push_tick.sql`, then run the steps above.

## Secrets that must exist (names only)

Vault (database):

- `push_cron_secret`
- `vapid_public` (must match `VAPID_PUBLIC` in `src/config.js`)
- `vapid_private`

Edge function environment: `push-tick` uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`,
which Supabase provides automatically. No custom function secrets are needed.
