# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Busy professionals and executives aged roughly 35 to 55 who are getting back in shape. Typical case: the founder, 40, in the Cayman Islands, who ran a 1:28 half marathon in 2021 and now wants to lose weight and rebuild speed. They are time-poor, check the app in short bursts on their phone (morning, before and after training, at meals), and are willing to pay for a premium coach rather than juggle several apps.

## Product Purpose
A fasting, training and nutrition coach in one app. It plans and tracks fasting (daily plans to multi-day fasts, routines on chosen days), training (a 12-week run plan, any cardio or gym machine, strength sets), food (portion-based logging from a global database, branded coffee and tea), water and weight, and ties them into a Journey with a daily score, diary and milestones. Success: the user follows their plan most days, sees steady progress, and keeps paying for Premium.

## Positioning
One coach for all of it. Rivals each own one slice (Zero for fasting, MyFitnessPal for food, Strava for training); this product joins them and times training around the fast (for example, easy runs late in a fast, hard sessions in the eating window, eat first past 24 hours).

## Operating Context
- Installed as a phone PWA, used one-handed, often outdoors or in heat; works offline and syncs later.
- Short check-ins: start or end a fast, log a meal, start a guided workout, weigh in, write a one-line note.
- Fasting stage pop-ups and push reminders reach the user while the app is closed.
- Crews: friends compare weekly totals and cheer each other.

## Capabilities and Constraints
- Vite + plain ES modules, Supabase (auth, sync, RLS, edge functions, cron push), hosted on Render as a static site. Name "Run Back" is a working name; rename planned via APP_NAME.
- Premium tier with server-side entitlements and redeem codes; Stripe checkout not yet connected.
- Fasting stages carry evidence levels (well established, human studies, early research); claims must stay within that evidence.
- Undecided: final product name, pricing, AI features (planned, provider-agnostic).

## Brand Commitments
- Voice: calm expert coach. Plain, direct, honest about evidence; never hype, guilt or fear. Safety guidance (extended fasts, pain, refeeding) is stated clearly, not buried.
- No em or en dashes anywhere in copy.

## Evidence on Hand
No testimonials, customer counts, press or clinical claims exist. Do not fabricate any. Fasting science copy lives in src/domain/fasting.js with evidence tags.

## Product Principles
1. One plan, not five apps: every feature should connect to the Journey, the fast and the training day.
2. The next action is always obvious: what to do now outranks history and stats.
3. Honest coaching: evidence levels and safety first, no inflated promises.
4. Quick in, quick out: common logs take one or two taps, one-handed.
5. Premium means calm and precise, never cluttered.

## Accessibility & Inclusion
Readable outdoors in bright light and in dark mode; comfortable touch targets; respects reduced motion.
