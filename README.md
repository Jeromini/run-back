# Run Back (working name)

Fasting, training and food in one coach. A mobile-first PWA built with Vite and plain ES modules,
synced through Supabase (row-level security on every table).

## Structure
- `src/domain/` pure logic (plan, fasting + coach, metrics, achievements, guides), unit-tested in `tests/`
- `src/core/` state, offline-first sync, auth, Premium entitlement
- `src/views/` the five tabs plus profile
- `src/features/` workout, strength, water, activity, paywall, guides, calendar, share
- `public/sw.js` offline support

## Premium
`public.entitlements` is written only by the server: today via access codes (`redeem_premium_code`),
later by a Stripe webhook. Codes live in `private.premium_codes`.

## Commands
`npm run dev`, `npm test`, `npm run build`. Render runs tests and builds on every push to main.
To rename the app, change `APP_NAME` in `src/config.js`, the `<title>` and meta tags in `index.html`, and `public/manifest.webmanifest`.
