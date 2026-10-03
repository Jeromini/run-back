// Fasting: plans, stages, history stats and the Fast + Train coach. Pure functions.
// Stages use the names people know (ketosis, autophagy, growth hormone...) and each carries an
// evidence level, so the app never presents early or animal-only research as settled fact.
import { FAST_PLANS, CUSTOM_FAST } from "../config.js";
import { clock, dayClock } from "../lib/dates.js";
import { fastsOf } from "./metrics.js";

const H = 3600000;
export const planById = id => FAST_PLANS.find(p => p.id === id) || FAST_PLANS.find(p => p.id === "16:8");
// The plan in force for a profile, resolving "custom" to the user's chosen length.
export function planFor(profile) {
  const r = profile.routine;
  if (r && r.on) return { id: "routine", hours: r.hours, label: routineLabel(r), pro: r.hours >= 19, routine: true };
  const p = planById(profile.fastPlan);
  if (p.id !== "custom") return p;
  const h = Math.max(CUSTOM_FAST.min, Math.min(CUSTOM_FAST.max, Math.round(profile.fastCustomH || 24)));
  return { ...p, hours: h, label: h % 24 === 0 && h >= 48 ? h / 24 + " days" : h + " h" };
}
export const EXTENDED_H = 36;        // from here the app shows the extended-fast checklist
export const SUPERVISED_H = 72;      // beyond this, medical super// What happens in the body as a fast goes on. Timings are typical for a healthy adult and vary
// with what you ate before, activity and body composition.
// ev: "strong" = well established in humans, "human" = shown in human studies but timing varies,
//     "early" = early research, mostly animal studies; human timing not established.
export const EVIDENCE = {
  strong: "Well established",
  human: "Human studies",
  early: "Early research"
};
export const STAGES = [
  { from: 0, name: "Blood sugar rises", ev: "strong", text: "Your last meal is being digested. Blood sugar and insulin rise and your body runs on that food.",
    changes: ["Insulin is raised, storing nutrients as glycogen and fat", "Water, black coffee and plain tea won't break your fast"] },
  { from: 4, name: "Blood sugar falls", ev: "strong", text: "Digestion is finishing. Insulin drifts back down and glucagon starts to rise.",
    changes: ["Insulin falling, glucagon rising", "Liver glycogen starts supplying your blood sugar", "Fat release from fat cells picks up"] },
  { from: 8, name: "Running on glycogen", ev: "strong", text: "Your liver's glycogen store is keeping blood sugar steady between meals.",
    changes: ["Blood sugar back to a steady baseline", "Hunger may show up at usual meal times: it passes in 15-20 minutes"] },
  { from: 12, name: "Fat burning", ev: "strong", text: "With glycogen running lower and insulin low, a growing share of your energy comes from fat.",
    changes: ["Fat becomes a larger share of the fuel mix", "A good window for an easy walk", "Keep sipping water"] },
  { from: 18, name: "Ketosis", ev: "strong", text: "Your liver turns fat into ketones, a fuel your muscles and brain can use.",
    changes: ["Ketones rising in the blood", "Many people notice steadier energy and focus", "Train easy, or eat first for hard sessions"] },
  { from: 24, name: "Autophagy ramps up", ev: "early", text: "Liver glycogen is largely used up. Autophagy, the body's cell clean-up and recycling process, is thought to increase from around here; this comes mostly from animal studies, and when it peaks in humans isn't yet known.",
    changes: ["Glycogen largely depleted (well established)", "Glucose now made from glycerol and amino acids (gluconeogenesis)", "Salt and water loss rise: add electrolytes", "Skip hard training"] },
  { from: 36, name: "Deep ketosis", ev: "strong", text: "Fat and ketones are now your main fuel and the brain is using ketones for a meaningful share of its energy.",
    changes: ["Ketones commonly 1 mmol/L or more", "Headaches or low energy usually mean you need more salt and water", "Sleep can be lighter"] },
  { from: 48, name: "Growth hormone peak", ev: "human", text: "Human studies of two-day fasts show growth hormone rising several-fold, which helps protect muscle while fat is used for fuel.",
    changes: ["Growth hormone markedly raised", "Many people find hunger eases as hunger hormones settle", "Dizziness on standing is a sign to break the fast"] },
  { from: 56, name: "Insulin sensitivity rises", ev: "human", text: "Insulin sits at its lowest and the body's sensitivity to it improves, part of why fasting is studied for metabolic health.",
    changes: ["Insulin at its lowest point", "Ketones often 2 mmol/L or more", "Keep electrolytes up"] },
  { from: 72, name: "Immune renewal (research)", ev: "early", text: "In mouse studies, fasting for 2-4 days was followed by immune cell renewal from stem cells once eating resumed. Human evidence is limited. Beyond 3 days, fast only with medical supervision.",
    changes: ["Deep ketosis: ketones often 2-4 mmol/L", "Medical supervision advised from here", "Break the fast gently with small, protein-led meals"] },
  { from: 96, name: "Prolonged fast", ev: "strong", text: "Medical supervision only. The longer the fast, the higher the risk from electrolyte imbalance and from refeeding too quickly.",
    changes: ["Electrolytes need monitoring", "Refeeding syndrome is a real risk after 5 or more days", "Reintroduce food over 1-2 days"] }
];

// Live hour-by-hour notes shown during a fast. Hours without their own note fall back to the stage.
export const HOURLY = [
  [0, "Your fast has started", "Water, black coffee and plain tea are all fine. Your body is still using your last meal."],
  [2, "Digestion under way", "Blood sugar is near its peak from your last meal and will start to ease soon."],
  [4, "Blood sugar coming down", "Insulin is falling and glucagon is rising, signalling your body to start using stored energy."],
  [6, "Switching to stored energy", "Your liver is releasing glycogen to keep your blood sugar steady."],
  [8, "First hunger wave?", "Hunger often arrives at your usual meal time and fades in 15-20 minutes. A glass of water helps."],
  [10, "Glycogen doing the work", "Your liver's glycogen store is carrying you. Fat release is gradually increasing."],
  [12, "Fat burning increasing", "Insulin is low and a larger share of your energy now comes from fat."],
  [14, "Good time for a walk", "Easy movement now uses fat well and helps hunger pass."],
  [16, "16 hours: the classic target", "This is where most daily fasting plans finish. Ketone production is picking up."],
  [18, "Ketosis", "Ketones are rising and becoming a real fuel for your muscles and brain."],
  [20, "Steady energy", "Many people feel clear-headed here. If you train today, keep it easy or eat first."],
  [22, "Top up salt and water", "Feeling flat or headachy? Have a glass of water with a pinch of salt."],
  [24, "One full day", "Liver glycogen is largely used up. Autophagy, the cell clean-up process, is thought to be increasing (mostly animal research)."],
  [28, "Making your own glucose", "Your body now makes the small amount of glucose it needs from glycerol and amino acids."],
  [32, "Hunger often settles", "For many people hunger is less intense on day two than day one."],
  [36, "Deep ketosis", "Ketones are commonly above 1 mmol/L and your brain is using them for a good share of its energy."],
  [42, "Electrolytes matter", "Sodium, potassium and magnesium help prevent headaches, cramps and dizziness."],
  [48, "Two days: growth hormone peak", "Human studies show growth hormone rising several-fold around now, helping protect muscle."],
  [56, "Insulin sensitivity rising", "Insulin is at its lowest and your sensitivity to it improves."],
  [64, "Stay gentle", "Keep activity easy, rest well and keep drinking. Break the fast if you feel unwell."],
  [72, "Three days", "Mouse studies link 2-4 day fasts with immune renewal after refeeding; human evidence is limited. Medical supervision is advised from here."],
  [96, "Four days", "Fast only under medical supervision. Plan a gentle refeed over 1-2 days."]
];
export function hourNote(hours) {
  let n = HOURLY[0];
  for (const x of HOURLY) if (hours >= x[0]) n = x;
  const i = HOURLY.indexOf(n), next = HOURLY[i + 1] || null;
  return { hour: Math.floor(hours), at: n[0], title: n[1], text: n[2], next: next ? { at: next[0], title: next[1] } : null };
}

export function stageAt(hours) {
  let s = STAGES[0];
  for (const st of STAGES) if (hours >= st.from) s = st;
  const next = STAGES[STAGES.indexOf(s) + 1] || null;
  return { ...s, next, nextIn: next ? next.from - hours : null };
}

// A completed fast is stored on the day it ended: day.fasts = [{ s, e, g }] (ms, ms, goal hours).
export function allFasts(days) {
  const out = [];
  Object.values(days).forEach(d => fastsOf(d).forEach(f => out.push({ ...f, date: d.date })));
  return out.sort((a, b) => b.e - a.e);
}
export function fastStats(days) {
  const fs = allFasts(days);
  if (!fs.length) return { count: 0, avg: 0, longest: 0, hitRate: 0, total: 0 };
  const hrs = fs.map(f => (f.e - f.s) / H);
  const total = hrs.reduce((a, b) => a + b, 0);
  return {
    count: fs.length, total, avg: total / fs.length, longest: Math.max(...hrs),
    hitRate: fs.filter(f => (f.e - f.s) / H >= f.g - 0.01).length / fs.length
  };
}

// Daily plans leave (24 - fast) hours to eat; after a fast of a day or more, allow a full day of eating.
const eatGap = h => (h >= 24 ? 24 : Math.max(1, 24 - h));
// When the eating window opens and closes, and when the next fast should start.
export function windowFor(active, lastFast, planHours, now = Date.now()) {
  if (active) {
    const goalAt = active.s + active.h * H;
    return { fasting: true, goalAt, opensAt: goalAt, closesAt: goalAt + eatGap(active.h) * H };
  }
  if (lastFast) {
    const closesAt = lastFast.e + eatGap(planHours) * H;
    return { fasting: false, opensAt: lastFast.e, closesAt, nextFastAt: closesAt, overdue: now > closesAt };
  }
  return { fasting: false, opensAt: null, closesAt: null, nextFastAt: null };
}

// The Fast + Train coach: when to train today, given the fast and the session.
// Returns { tone: "good" | "caution" | "stop" | "info", title, body, slot? }.
export function coach({ session, done, active, lastFast, planHours, now = Date.now() }) {
  const kind = session.kind, training = kind === "run" || kind === "cross";
  const hard = !!session.hard;
  const el = active ? (now - active.s) / H : 0;
  const w = windowFor(active, lastFast, planHours, now);

  if (!training) {
    if (kind === "rest") return { tone: "info", title: "Rest day: a good day for your full fast", body: "No training load today, so it's the easiest day to reach your fasting goal. Keep moving with an easy walk." };
    return { tone: "info", title: "Plan not started yet", body: "Once your plan starts, I'll time each session around your fast." };
  }
  if (done) return { tone: "good", title: "Session done. Now refuel well", body: "Make your next meal count: about 30-40 g of protein plus some carbs helps your legs recover for the next run." };

  if (active) {
    if (el >= 24) return { tone: "stop", title: "Eat before you train today", body: `You're ${Math.floor(el)} hours into a fast. Training this deep into a fast raises the risk of dizziness and poor recovery. Break the fast, wait 1-2 hours, then do your session.` };
    if (hard) return { tone: "caution", title: "Hard session: train in your eating window", body: `Today's session has faster efforts. Quality is better fed: train 2-3 hours after your first meal, around ${clock(w.opensAt + 2.5 * H)}.`, slot: w.opensAt + 2.5 * H };
    if (el >= 20) return { tone: "caution", title: "Keep it easy and short, or eat first", body: "You're 20+ hours in. An easy session is fine if you feel good, but stop if you feel light-headed and eat soon after." };
    if (now >= w.goalAt) return { tone: "good", title: "Fasting goal reached: a good time for easy training", body: "Do your easy session now and break the fast within an hour after it, with protein and carbs.", slot: now };
    const slot = Math.max(now, w.goalAt - 1.5 * H);
    return { tone: "good", title: `Best time to train: ${dayClock(slot, now)}`, body: `Easy work suits the last hour or two of your fast. Train around ${clock(slot)}, then break your fast at ${clock(w.goalAt)} with protein and carbs within an hour.`, slot };
  }
  // eating window
  if (w.closesAt && now < w.closesAt) {
    const latest = w.closesAt - 2 * H;
    return now < latest
      ? { tone: "good", title: "You're in your eating window: good time to train", body: `Eat 1-3 hours before if you can, and finish with a protein-rich meal before your window closes at ${clock(w.closesAt)}.`, slot: now }
      : { tone: "caution", title: "Window closes soon: eat after you train", body: `Your eating window closes at ${clock(w.closesAt)}. If you train now, have your recovery meal right after, even if it runs a little past the window.` };
  }
  return { tone: "info", title: hard ? "Hard session: train fed" : "Train when it suits you", body: hard ? "Have a meal 2-3 hours before today's faster efforts." : "Easy sessions work fasted or fed. Start a fast to get a timed recommendation." };
}

// Hours spent in each fasting zone on a given local day, across completed fasts and the one
// in progress. Zones follow the stage timeline: settling (0-12 h), fat-burning (12-18 h),
// ketosis (18-24 h) and deep fast (24 h+).
export const ZONES = [
  { from: 0, to: 12, name: "Settling" },
  { from: 12, to: 18, name: "Fat-burning" },
  { from: 18, to: 24, name: "Ketosis" },
  { from: 24, to: Infinity, name: "Deep fast" }
];
export function zoneHours(days, active, dateStr, now = Date.now()) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const d0 = new Date(y, m - 1, d).getTime(), d1 = new Date(y, m - 1, d + 1).getTime();
  const fasts = Object.values(days).flatMap(x => fastsOf(x)).map(f => ({ s: f.s, e: f.e, g: f.g }));
  if (active) fasts.push({ s: active.s, e: now, g: active.h });
  const out = ZONES.map(() => 0);
  let goalHit = null;
  for (const f of fasts) {
    if (f.e <= d0 || f.s >= d1) continue;
    ZONES.forEach((z, i) => {
      const a = Math.max(f.s + z.from * H, f.s, d0), b = Math.min(f.s + z.to * H, f.e, d1);
      if (b > a) out[i] += (b - a) / H;
    });
    // a fast that ended on this day decides the day's goal colour
    if (f.e >= d0 && f.e < d1 && !(active && f.s === active.s)) goalHit = (goalHit ?? true) && (f.e - f.s) / H >= f.g - 0.01;
  }
  return { zones: out, goalHit };
}

// ---------- routines ----------
// A routine names the days you fast on and when each fast starts:
//   { on, pattern: "daily" | "days" | "alternate", days: [0-6], anchor: "YYYY-MM-DD",
//     hours, start: "HH:MM", startMode: "before" | "same", since, skip: [dates], times: { date: "HH:MM" } }
// The "fast day" is the day the fast is for. With startMode "before", Monday's fast starts the
// evening before (Sunday at `start`); with "same" it starts on Monday at `start`.
export const ROUTINE_PRESETS = [
  { id: "daily-16", name: "16:8 every day", blurb: "Fast 8 pm to 12 pm, eat 12 to 8 pm", pattern: "daily", hours: 16, start: "20:00", startMode: "same" },
  { id: "daily-18", name: "18:6 every day", blurb: "Fast 7 pm to 1 pm", pattern: "daily", hours: 18, start: "19:00", startMode: "same" },
  { id: "daily-14", name: "14:10 every day", blurb: "A gentle daily rhythm", pattern: "daily", hours: 14, start: "20:00", startMode: "same" },
  { id: "weekdays-16", name: "16:8 on weekdays", blurb: "Weekends off", pattern: "days", days: [1, 2, 3, 4, 5], hours: 16, start: "20:00", startMode: "before" },
  { id: "mwf-24", name: "24 h on Mon, Wed, Fri", blurb: "Each fast runs 8 pm the evening before to 8 pm", pattern: "days", days: [1, 3, 5], hours: 24, start: "20:00", startMode: "before" },
  { id: "2x24", name: "24 h twice a week", blurb: "Monday and Thursday, dinner to dinner", pattern: "days", days: [1, 4], hours: 24, start: "19:00", startMode: "before" },
  { id: "omad", name: "OMAD on weekdays", blurb: "One meal a day, Monday to Friday", pattern: "days", days: [1, 2, 3, 4, 5], hours: 23, start: "19:00", startMode: "before" },
  { id: "adf", name: "Alternate-day fasting", blurb: "36 h fast every other day", pattern: "alternate", hours: 36, start: "20:00", startMode: "before" },
  { id: "weekly-36", name: "Weekly 36 h", blurb: "Monday's fast: Sunday 8 pm to Tuesday 8 am", pattern: "days", days: [1], hours: 36, start: "20:00", startMode: "before" }
];
const dateOf = ms => { const d = new Date(ms); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const dayMs = dateStr => { const [y, m, d] = dateStr.split("-").map(Number); return new Date(y, m - 1, d).getTime(); };
export const shiftDate = (dateStr, n) => { const [y, m, d] = dateStr.split("-").map(Number); return dateOf(new Date(y, m - 1, d + n).getTime()); };

// Is `dateStr` one of the routine's fast days (ignoring skips)?
export function onPattern(r, dateStr) {
  if (!r || !r.on) return false;
  if (r.pattern === "daily") return true;
  if (r.pattern === "days") return (r.days || []).includes(new Date(dayMs(dateStr)).getDay());
  if (r.pattern === "alternate") return Math.round((dayMs(dateStr) - dayMs(r.anchor || dateStr)) / 86400000) % 2 === 0;
  return false;
}
export const isSkipped = (r, dateStr) => !!(r && Array.isArray(r.skip) && r.skip.includes(dateStr));
export const isScheduled = (r, dateStr) => onPattern(r, dateStr) && !isSkipped(r, dateStr);
// When the fast for `fastDay` starts and ends.
export function startFor(r, fastDay) {
  const t = (r.times && r.times[fastDay]) || r.start || "20:00", [hh, mm] = t.split(":").map(Number);
  const sd = r.startMode === "before" ? shiftDate(fastDay, -1) : fastDay, [y, m, d] = sd.split("-").map(Number);
  return new Date(y, m - 1, d, hh, mm).getTime();
}
export const endFor = (r, fastDay) => startFor(r, fastDay) + r.hours * H;
export const startAt = startFor;
// The next scheduled fast that hasn't started yet: { day, start, end }.
export function nextFast(r, now = Date.now()) {
  if (!r || !r.on) return null;
  for (let i = -1; i < 16; i++) { const ds = shiftDate(dateOf(now), i); if (isScheduled(r, ds) && startFor(r, ds) >= now) return { day: ds, start: startFor(r, ds), end: endFor(r, ds) }; }
  return null;
}
export const nextStart = (r, now = Date.now()) => { const n = nextFast(r, now); return n ? n.start : null; };
// A scheduled start in the last few hours that hasn't been acted on (so the app can prompt).
export function dueFast(r, active, lastFast, now = Date.now(), graceH = 4) {
  if (!r || !r.on || active) return null;
  for (const i of [-1, 0, 1]) {
    const ds = shiftDate(dateOf(now), i);
    if (!isScheduled(r, ds)) continue;
    const t = startFor(r, ds);
    if (t <= now && now - t < graceH * H && !(lastFast && Math.abs(lastFast.s - t) < 6 * H)) return { day: ds, start: t, end: t + r.hours * H };
  }
  return null;
}
export const dueStart = (r, active, lastFast, now = Date.now(), graceH = 4) => { const d = dueFast(r, active, lastFast, now, graceH); return d ? d.start : null; };

// Status of each day from `firstDate` for `n` days: off | skipped | done | live | due | missed | short | upcoming.
export function routineDays(r, days, active, firstDate, n = 7, now = Date.now()) {
  const fasts = Object.values(days).flatMap(d => fastsOf(d));
  if (active) fasts.push({ s: active.s, e: now, g: active.h, live: true });
  return Array.from({ length: n }, (_, i) => {
    const ds = shiftDate(firstDate, i);
    if (!onPattern(r, ds) || (r.since && ds < r.since)) return { date: ds, status: "off" };
    const start = startFor(r, ds), end = start + r.hours * H, base = { date: ds, start, end };
    if (isSkipped(r, ds)) return { ...base, status: "skipped" };
    // the fast that belongs to this day started within 6 hours of the scheduled time
    const f = fasts.find(x => Math.abs(x.s - start) < 6 * H);
    if (f && f.live) return { ...base, status: "live", fast: f };
    if (f && (f.e - f.s) / H >= r.hours - 0.5) return { ...base, status: "done", fast: f };
    if (start > now) return { ...base, status: "upcoming" };
    if (!f && now - start < 4 * H) return { ...base, status: "due" };
    return { ...base, status: f ? "short" : "missed", fast: f };
  });
}
export const adherence = (r, days, active, weekFirstDate, now = Date.now()) => routineDays(r, days, active, weekFirstDate, 7, now);

const DAYN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export function routineLabel(r) { const h = r.hours; return h < 24 ? h + ":" + (24 - h) : h % 24 === 0 ? h / 24 + (h === 24 ? " day" : " days") : h + " h"; }
export const fmt12 = hhmm => { const [h, m] = (hhmm || "20:00").split(":").map(Number); return (h % 12 || 12) + ":" + String(m).padStart(2, "0") + (h < 12 ? " am" : " pm"); };
const tsLabel = ts => { const d = new Date(ts); return DAYN[d.getDay()] + " " + fmt12(String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0")); };
export function routineSummary(r) {
  const hrs = r.hours + " h";
  const when = r.pattern === "daily" ? "every day" : r.pattern === "alternate" ? "every other day"
    : (r.days || []).length === 5 && [1, 2, 3, 4, 5].every(d => r.days.includes(d)) ? "on weekdays" : "on " + (r.days || []).slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(d => DAYN[d]).join(", ");
  return `${hrs} fasts ${when}, starting ${fmt12(r.start)} ${r.startMode === "before" ? "the evening before" : "on the day"}`;
}
// "Monday's fast: Sun 8:00 pm to Mon 8:00 pm"
export function spanText(r, fastDay) {
  const s = startFor(r, fastDay), e = s + r.hours * H, d = new Date(dayMs(fastDay));
  return `${DAYL[d.getDay()]}'s fast: ${tsLabel(s)} to ${tsLabel(e)}`;
}
