// My Journey: a package of goals (training, fasting, water, food, weigh-ins, a daily note) run
// over a fixed number of weeks. Pure: day records and context are passed in.
//   profile.journey = { on, template, name, start: "YYYY-MM-DD", weeks, why, goalWeight,
//                       pillars: { train: {on, target}, run: {...}, strength: {...}, fast: {on},
//                                  water: {on}, food: {on}, weight: {on, target}, note: {on} } }
//   day.journal = { text, mood: 1-5 }
import { iso, parse, addDays, daysBetween } from "../lib/dates.js";
import { ranToday, otherCardio, strengthDone, actsOf, fastsOf, foodTotals, setCounts } from "./metrics.js";

const H = 3600000;

// What each goal measures. "week" goals count days per week; "day" goals are checked every day.
export const PILLARS = [
  { id: "train", label: "Train", kind: "week", def: 5, max: 7, unit: "sessions", blurb: "Any run, cardio, strength or logged activity" },
  { id: "run", label: "Run", kind: "week", def: 3, max: 7, unit: "runs", blurb: "Runs, outdoors or on the treadmill" },
  { id: "strength", label: "Strength", kind: "week", def: 2, max: 7, unit: "sessions", blurb: "A strength session with sets ticked off" },
  { id: "fast", label: "Fast", kind: "day", blurb: "Follows your fasting routine, or your daily plan" },
  { id: "water", label: "Water", kind: "day", blurb: "Hit your daily water target" },
  { id: "food", label: "Food", kind: "day", blurb: "Keep your diet, or log what you eat within your calorie target" },
  { id: "weight", label: "Weigh-in", kind: "week", def: 7, max: 7, unit: "weigh-ins", blurb: "Step on the scale" },
  { id: "note", label: "Daily note", kind: "day", blurb: "One line on how the day went" }
];
export const pillarById = id => PILLARS.find(p => p.id === id);

const P = (on, target) => ({ on, ...(target ? { target } : {}) });
export const TEMPLATES = [
  { id: "comeback", name: "Comeback runner", weeks: 12, blurb: "Rebuild your running with fasting, food and weigh-ins alongside",
    pillars: { train: P(true, 5), run: P(true, 3), strength: P(true, 2), fast: P(true), water: P(true), food: P(true), weight: P(true, 7), note: P(true) } },
  { id: "lean", name: "Lean and strong", weeks: 8, blurb: "Fasting routine, three strength days and tight nutrition",
    pillars: { train: P(true, 5), run: P(false, 2), strength: P(true, 3), fast: P(true), water: P(true), food: P(true), weight: P(true, 7), note: P(true) } },
  { id: "reset", name: "30-day reset", weeks: 4, blurb: "Daily fasting, water and movement to build the habits",
    pillars: { train: P(true, 6), run: P(false, 2), strength: P(false, 2), fast: P(true), water: P(true), food: P(true), weight: P(true, 3), note: P(true) } },
  { id: "race", name: "Race build", weeks: 16, blurb: "Four runs a week with fuel first: lighter fasting, more food focus",
    pillars: { train: P(true, 6), run: P(true, 4), strength: P(true, 2), fast: P(false), water: P(true), food: P(true), weight: P(true, 3), note: P(true) } },
  { id: "custom", name: "Build my own", weeks: 12, blurb: "Pick exactly which goals go in your journey",
    pillars: { train: P(true, 4), run: P(false, 3), strength: P(false, 2), fast: P(false), water: P(true), food: P(false), weight: P(true, 3), note: P(true) } }
];
export const JOURNEY_WEEKS = [4, 8, 12, 16, 26, 52];

export function newJourney(templateId, start, extra = {}) {
  const t = TEMPLATES.find(x => x.id === templateId) || TEMPLATES[0];
  const pillars = {};
  PILLARS.forEach(p => { const v = t.pillars[p.id] || { on: false }; pillars[p.id] = { on: !!v.on, ...(p.kind === "week" ? { target: v.target || p.def } : {}) }; });
  return { on: true, template: t.id, name: t.id === "custom" ? "My journey" : t.name, start, weeks: t.weeks, why: "", goalWeight: null, pillars, ...extra };
}

export const activePillars = j => PILLARS.filter(p => j && j.pillars && j.pillars[p.id] && j.pillars[p.id].on);
export const journeyEnd = j => iso(addDays(parse(j.start), j.weeks * 7 - 1));
export const dayNumber = (j, date) => daysBetween(parse(j.start), parse(date)) + 1;
export const totalDays = j => j.weeks * 7;
export const weekNumber = (j, date) => Math.floor((dayNumber(j, date) - 1) / 7) + 1;
export const weekFirst = (j, n) => iso(addDays(parse(j.start), (n - 1) * 7));

const trained = d => !!(d && (ranToday(d) || otherCardio(d) || strengthDone(d) || actsOf(d).length));
// A fast counts for the day it ends on. "Long enough" is the plan length less half an hour.
const fastKept = (d, hours) => fastsOf(d).some(f => (f.e - f.s) / H >= Math.max(10, hours - 0.5));

// ctx: { waterTarget(date) -> ml, kcalTarget, fastHours, fastDay(date) -> null | "off" | "done" | "missed" | "pending",
//        dietStatus(date) -> null (no diet) | "kept" | "close" | "off" | "empty" }
// Returns, for one date, each active goal: { id, done, applies }.
export function dayChecks(j, d, date, ctx) {
  return activePillars(j).map(p => {
    let done = false, applies = true;
    if (p.id === "train") done = trained(d);
    else if (p.id === "run") done = ranToday(d);
    else if (p.id === "strength") done = strengthDone(d);
    else if (p.id === "weight") done = !!(d && d.weight);
    else if (p.id === "water") done = !!(d && d.water && d.water >= ctx.waterTarget(date));
    else if (p.id === "food") {
      // with a diet chosen, the food goal is keeping the diet; otherwise logging within the calorie target
      const ds = ctx.dietStatus ? ctx.dietStatus(date) : null;
      if (ds) done = ds === "kept";
      else { const t = foodTotals(d); done = t.n > 0 && (!ctx.kcalTarget || t.k <= ctx.kcalTarget * 1.05); }
    }
    else if (p.id === "note") done = !!(d && d.journal && (d.journal.text || "").trim());
    else if (p.id === "fast") {
      const s = ctx.fastDay ? ctx.fastDay(date) : null;
      if (s === "off") applies = false;
      done = s === "done" || (s == null && fastKept(d, ctx.fastHours || 16));
    }
    return { id: p.id, done, applies, kind: p.kind };
  });
}

// Day score 0-1: daily goals that apply, plus a training session as a bonus goal when one happened.
export function dayScore(checks) {
  const daily = checks.filter(c => c.kind === "day" && c.applies);
  const train = checks.find(c => c.kind === "week" && c.done) ? 1 : 0;
  const max = daily.length + train;
  return max ? (daily.filter(c => c.done).length + train) / max : 0;
}
export const KEPT = 0.7; // a "kept" day: most of the day's goals done

// Progress for journey week n (1-based) up to `upTo` (inclusive): per goal { id, n, target, sofar }.
// target is the full-week goal; sofar is how many applicable days have passed (for daily goals).
export function weekProgress(j, days, n, upTo, ctx) {
  const first = weekFirst(j, n), out = {};
  activePillars(j).forEach(p => (out[p.id] = { id: p.id, kind: p.kind, n: 0, target: p.kind === "week" ? j.pillars[p.id].target : 0, sofar: 0 }));
  for (let i = 0; i < 7; i++) {
    const date = iso(addDays(parse(first), i));
    dayChecks(j, days[date], date, ctx).forEach(c => {
      const o = out[c.id];
      if (c.kind === "day") { if (c.applies) { o.target++; if (date <= upTo) o.sofar++; } }
      if (c.done && date <= upTo) o.n++;
    });
  }
  return Object.values(out);
}
const weekPct = list => list.length ? list.reduce((a, x) => a + (x.target ? Math.min(1, x.n / x.target) : 1), 0) / list.length : 0;

// Headline numbers for the journey as of `ref`.
export function journeyStats(j, days, ref, ctx) {
  const total = totalDays(j), dn = Math.max(0, Math.min(total, dayNumber(j, ref)));
  const last = dn >= 1 ? iso(addDays(parse(j.start), dn - 1)) : null;
  let kept = 0, streak = 0, best = 0, run = 0, logged = 0;
  const scores = [];
  for (let i = 0; i < dn; i++) {
    const date = iso(addDays(parse(j.start), i)), d = days[date], s = dayScore(dayChecks(j, d, date, ctx));
    scores.push({ date, s });
    if (d && Object.keys(d).length > 1) logged++;
    if (s >= KEPT) { kept++; run++; best = Math.max(best, run); } else if (date !== ref) run = 0;
  }
  // current streak: back from today (today only breaks it once it is over)
  for (let i = scores.length - 1; i >= 0; i--) { if (scores[i].s >= KEPT) streak++; else if (scores[i].date !== ref) break; }
  const weeksDone = dn ? Math.ceil(dn / 7) : 0;
  let pct = 0;
  for (let w = 1; w <= weeksDone; w++) {
    // finished weeks count against their full goal; the current week against what is possible so far
    const wp = weekProgress(j, days, w, last, ctx), cur = w === weeksDone && dn % 7 !== 0;
    pct += cur ? weekPct(wp.map(x => x.kind === "day" ? { ...x, target: x.sofar } : { ...x, target: Math.ceil(x.target * ((dn - 1) % 7 + 1) / 7) })) : weekPct(wp);
  }
  return { dayN: dn, total, before: dayNumber(j, ref) < 1, finished: dayNumber(j, ref) > total, kept, streak, best, logged, score: weeksDone ? pct / weeksDone : 0, scores };
}

// Totals across the journey so far.
export function journeyTotals(j, days, ref) {
  let sessions = 0, runs = 0, fasts = 0, fastH = 0, longest = 0, meals = 0, water = 0, sets = 0, notes = 0;
  const end = ref < journeyEnd(j) ? ref : journeyEnd(j);
  for (let x = parse(j.start); iso(x) <= end; x = addDays(x, 1)) {
    const d = days[iso(x)]; if (!d) continue;
    if (trained(d)) sessions++;
    if (ranToday(d)) runs++;
    fastsOf(d).forEach(f => { const h = (f.e - f.s) / H; if (h >= 10) { fasts++; fastH += h; longest = Math.max(longest, h); } });
    meals += foodTotals(d).n; water += d.water || 0; sets += setCounts(d.strength)[0];
    if (d.journal && (d.journal.text || "").trim()) notes++;
  }
  return { sessions, runs, fasts, fastH, longest, meals, water, sets, notes };
}

// Weight change since the journey began: first weigh-in on or before the start (or the first after).
export function weightJourney(j, days, ref, startWeight) {
  const ws = Object.values(days).filter(d => d.weight && d.date <= ref).map(d => ({ date: d.date, w: Number(d.weight) })).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!ws.length) return null;
  const before = ws.filter(x => x.date <= j.start), after = ws.filter(x => x.date >= j.start);
  const from = before.length ? before[before.length - 1].w : after.length ? after[0].w : startWeight;
  const now = ws[ws.length - 1].w;
  return { from, now, change: now - from, goal: j.goalWeight || null };
}

// Milestones, with the date each was reached (null if not yet).
export function milestones(j, days, ref, ctx, unit = "lb") {
  const out = [], hit = (id, label, date) => out.push({ id, label, date });
  const total = totalDays(j), end = ref < journeyEnd(j) ? ref : journeyEnd(j);
  let sessions = 0, fasts = 0, run = 0, first24 = null, from = null, s10 = null, s25 = null, s50 = null, f1 = null, f10 = null, streak7 = null, notes = 0, n7 = null;
  const lossSteps = unit === "kg" ? [2, 5, 10] : [5, 10, 20], loss = {};
  for (let x = parse(j.start); iso(x) <= end; x = addDays(x, 1)) {
    const date = iso(x), d = days[date];
    if (d) {
      if (trained(d)) { sessions++; if (sessions === 10) s10 = date; if (sessions === 25) s25 = date; if (sessions === 50) s50 = date; }
      fastsOf(d).forEach(f => { const h = (f.e - f.s) / H; if (h >= 10) { fasts++; if (fasts === 1) f1 = date; if (fasts === 10) f10 = date; } if (h >= 24 && !first24) first24 = date; });
      if (d.weight) { if (from == null) from = Number(d.weight); lossSteps.forEach(s => { if (!loss[s] && from - Number(d.weight) >= s) loss[s] = date; }); }
      if (d.journal && (d.journal.text || "").trim()) { notes++; if (notes === 7) n7 = date; }
    }
    const sc = dayScore(dayChecks(j, d, date, ctx));
    run = sc >= KEPT ? run + 1 : 0; if (run === 7 && !streak7) streak7 = date;
  }
  const at = n => (n <= total ? iso(addDays(parse(j.start), n - 1)) : null), reached = n => { const a = at(n); return a && a <= ref ? a : null; };
  hit("start", "Day 1: journey started", j.start <= ref ? j.start : null);
  hit("week1", "First week complete", reached(7));
  hit("f1", "First fast in the journey", f1);
  hit("s10", "10 training sessions", s10);
  hit("streak7", "7 kept days in a row", streak7);
  hit("f10", "10 fasts", f10);
  hit("f24", "First 24 hour fast", first24);
  hit("n7", "7 daily notes written", n7);
  lossSteps.forEach(s => hit("loss" + s, `${s} ${unit} down`, loss[s] || null));
  hit("s25", "25 training sessions", s25);
  hit("half", "Halfway there", reached(Math.ceil(total / 2)));
  hit("s50", "50 training sessions", s50);
  hit("done", "Journey complete", reached(total));
  return out;
}

// Mood scale for the daily note.
export const MOODS = ["Rough", "Low", "Okay", "Good", "Great"];
