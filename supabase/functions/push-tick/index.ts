// Fasting reminders. Called every 5 minutes by pg_cron with a shared secret (verify_jwt is off;
// the secret check below is the authentication). Each reminder is sent once (push_mark).
//   During a fast: each new stage from 12 h, 1 hour to go, goal reached, daily check-ins on long fasts.
//   With a routine and not fasting: 30 minutes before the start, and at the start.
// Routine rules match the app: a fast belongs to a "fast day"; with startMode "before" it starts
// the evening before. Skipped days and per-day start times are honoured.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import webpush from "npm:web-push@3.6.7";

const H = 3600000, WINDOW = 30 * 60000;
const STAGES: [number, string, string][] = [
  [12, "Fat burning", "Insulin is low and more of your energy now comes from fat. An easy walk fits well."],
  [18, "Ketosis", "Your liver is making ketones, a fuel for your muscles and brain."],
  [24, "Autophagy ramps up", "Glycogen is largely used up. Cell clean-up (autophagy) is thought to increase, mostly shown in animal studies. Add electrolytes."],
  [36, "Deep ketosis", "Fat and ketones are your main fuel now. Keep salt and water up."],
  [48, "Growth hormone peak", "Human studies show growth hormone rising several-fold around now, helping protect muscle."],
  [56, "Insulin sensitivity rises", "Insulin is at its lowest. Keep activity gentle."],
  [72, "Immune renewal (research)", "Three days in. Beyond this, fast only with medical supervision, and refeed gently."],
];

function parts(ts: number, tz: string) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const o: Record<string, number> = {};
  for (const p of f.formatToParts(new Date(ts))) if (p.type !== "literal") o[p.type] = Number(p.value);
  return o;
}
function zoned(y: number, m: number, d: number, hh: number, mm: number, tz: string) {
  let t = Date.UTC(y, m - 1, d, hh, mm);
  for (let i = 0; i < 2; i++) { const p = parts(t, tz); const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute); t -= asUtc - Date.UTC(y, m - 1, d, hh, mm); }
  return t;
}
const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const dayNum = (y: number, m: number, d: number) => Math.round(Date.UTC(y, m - 1, d) / 86400000);
function onPattern(r: any, y: number, m: number, d: number) {
  if (r.pattern === "daily") return true;
  if (r.pattern === "days") return (r.days || []).includes(new Date(Date.UTC(y, m - 1, d)).getUTCDay());
  if (r.pattern === "alternate") { const [ay, am, ad] = String(r.anchor || "").split("-").map(Number); return ay ? (dayNum(y, m, d) - dayNum(ay, am, ad)) % 2 === 0 : false; }
  return false;
}
const fmt12 = (hh: number, mm: number) => (hh % 12 || 12) + ":" + pad(mm) + (hh < 12 ? " am" : " pm");
const DAYL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: w, error } = await sb.rpc("push_worklist");
  if (error || !w) return new Response(JSON.stringify({ error: "worklist failed" }), { status: 500 });
  if (!w.cron_secret || req.headers.get("x-cron-secret") !== w.cron_secret) return new Response("Forbidden", { status: 403 });
  webpush.setVapidDetails("mailto:support@runback.app", w.vapid_public, w.vapid_private);

  const now = Date.now();
  let sent = 0, dropped = 0;
  for (const row of (w.people || []) as any[]) {
    const events: { kind: string; ref: string; at: number; title: string; body: string }[] = [];
    const f = row.fast;
    if (f && f.s && f.h) {
      const goal = f.s + f.h * H;
      for (const [h, name, body] of STAGES) if (h < f.h) events.push({ kind: "stage", ref: f.s + ":stage" + h, at: f.s + h * H, title: `Now: ${name}`, body });
      if (f.h >= 12) events.push({ kind: "soon", ref: f.s + ":soon", at: goal - H, title: "1 hour to go", body: `Your ${f.h} h fast hits its goal in an hour. Plan a protein-first meal.` });
      events.push({ kind: "goal", ref: f.s + ":goal", at: goal, title: "Fasting goal reached", body: `${f.h} hours done. Break your fast with protein first, or keep going if you feel good.` });
      if (f.h >= 36) for (let d = 1; d * 24 < f.h; d++) events.push({ kind: "day", ref: f.s + ":day" + d, at: f.s + d * 24 * H, title: `Day ${d + 1} of your fast`, body: "Drink water and add electrolytes. Keep activity easy, and stop if you feel dizzy or faint." });
    } else if (row.routine && row.routine.on) {
      const r = row.routine, tz = row.tz || "UTC", skip: string[] = Array.isArray(r.skip) ? r.skip : [];
      for (const offset of [-1, 0, 1, 2]) { // fast days around today, in the person's time zone
        const p = parts(now + offset * 86400000, tz), key = keyOf(p.year, p.month, p.day);
        if (!onPattern(r, p.year, p.month, p.day) || skip.includes(key)) continue;
        const [hh, mm] = String((r.times && r.times[key]) || r.start || "20:00").split(":").map(Number);
        const sd = new Date(Date.UTC(p.year, p.month - 1, p.day - (r.startMode === "before" ? 1 : 0)));
        const at = zoned(sd.getUTCFullYear(), sd.getUTCMonth() + 1, sd.getUTCDate(), hh, mm, tz);
        if (row.last_fast_start && Math.abs(row.last_fast_start - at) < 6 * H) continue; // already fasting or done for this day
        const dayName = DAYL[new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()];
        events.push({ kind: "pre", ref: key + ":pre", at: at - 30 * 60000, title: "Your fast starts in 30 minutes", body: `${dayName}'s ${r.hours} h fast starts at ${fmt12(hh, mm)}. Finish your last meal with some protein.` });
        events.push({ kind: "start", ref: key + ":start", at, title: "Time to start your fast", body: `${dayName}'s ${r.hours} h fast starts now. Tap to start the timer.` });
      }
    }
    for (const ev of events) {
      if (now < ev.at || now - ev.at > WINDOW) continue;
      const { data: fresh } = await sb.rpc("push_mark", { p_user: row.user_id, p_kind: ev.kind, p_ref: ev.ref });
      if (!fresh) continue;
      const payload = JSON.stringify({ title: ev.title, body: ev.body, url: "/#fast", tag: "fast-" + ev.kind });
      for (const s of row.subs || []) {
        try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 }); sent++; }
        catch (e: any) { if (e && (e.statusCode === 404 || e.statusCode === 410)) { await sb.rpc("push_drop", { p_endpoint: s.endpoint }); dropped++; } }
      }
    }
  }
  return new Response(JSON.stringify({ ok: true, people: (w.people || []).length, sent, dropped }), { headers: { "Content-Type": "application/json" } });
});
