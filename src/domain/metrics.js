// Numbers derived from the day records. Pure: everything is passed in.
import { iso, parse, addDays, daysBetween, weekStart, DOW, MON } from "../lib/dates.js";
import { UNIT_M, LB_PER_KG } from "../lib/format.js";
import { activityById, activityKcal, legacyType } from "./activities.js";

export const runDist = (d, dunit) => d.runDistM || (d.dist ? d.dist * UNIT_M[dunit] : 0);
export const runSecs = d => d.runDone ? (d.runDur || (d.runMin || 0) * 60) : 0;
export const crossSecs = d => d.crossDone ? (d.crossDur || (d.crossMin || 0) * 60) : 0;
export const actsOf = d => (d && Array.isArray(d.acts) ? d.acts : []);
export const runActs = d => actsOf(d).filter(x => { const a = activityById(x.type); return a && a.run; });
export const ranToday = d => !!(d && (d.runDone || runActs(d).length));
export const otherCardio = d => !!(d && (d.crossDone || actsOf(d).some(x => { const a = activityById(x.type); return a && !a.run; })));
export const strengthDone = d => !!(d && Array.isArray(d.strength) && d.strength.some(x => (x.sets || []).some(s => s.done)));
export function setCounts(items) { let t = 0, n = 0; (items || []).forEach(x => (x.sets || []).forEach(s => { t++; if (s.done) n++; })); return [n, t]; }
export const liftVolume = items => Math.round((items || []).reduce((a, x) => a + (x.sets || []).filter(t => t.done).reduce((b, t) => b + (Number(t.r) || 0) * (Number(t.w) || 0), 0), 0));

export function foodTotals(d) {
  const f = (d && d.food) || [];
  return { k: f.reduce((a, x) => a + (Number(x.k) || 0), 0), p: f.reduce((a, x) => a + (Number(x.p) || 0), 0), n: f.length };
}
export const fastsOf = d => (d && Array.isArray(d.fasts)) ? d.fasts : [];
export const fastHours = d => fastsOf(d).reduce((a, f) => a + (f.e - f.s) / 3600000, 0);

export function weights(days) {
  return Object.values(days).filter(d => d.weight).map(d => ({ date: d.date, w: Number(d.weight) })).sort((a, b) => (a.date < b.date ? -1 : 1));
}
export function avg7(list, endDate) {
  const end = parse(endDate), xs = list.filter(x => { const k = daysBetween(parse(x.date), end); return k >= 0 && k < 7; });
  return xs.length ? xs.reduce((a, x) => a + x.w, 0) / xs.length : null;
}
// Best current estimate: 7-day average, else the latest weigh-in.
export function currentWeight(days, ref) {
  const list = weights(days);
  if (!list.length) return null;
  return avg7(list, ref) ?? list[list.length - 1].w;
}
export const toKg = (w, unit) => (w == null ? null : unit === "kg" ? w : w / LB_PER_KG);

export function bmi(weight, unit, heightCm) {
  if (!weight || !heightCm) return null;
  const m = heightCm / 100;
  return toKg(weight, unit) / (m * m);
}
export function bmiClass(b) {
  if (b == null) return null;
  if (b < 18.5) return { label: "Underweight", tone: "info" };
  if (b < 25) return { label: "Healthy range", tone: "good" };
  if (b < 30) return { label: "Overweight", tone: "warn" };
  if (b < 35) return { label: "Obesity, class 1", tone: "warn" };
  if (b < 40) return { label: "Obesity, class 2", tone: "bad" };
  return { label: "Obesity, class 3", tone: "bad" };
}
// Weight (in the user's unit) at a given BMI for this height.
export const weightAtBmi = (b, heightCm, unit) => { const kg = b * (heightCm / 100) ** 2; return unit === "kg" ? kg : kg * LB_PER_KG; };

// About 30 ml per kg, plus 500 ml on training days (more sweat in the heat). Rounded to 50 ml.
export function waterTarget(weight, unit, trained) {
  const kg = toKg(weight, unit);
  const base = kg ? kg * 30 : 2500;
  return Math.round((base + (trained ? 500 : 0)) / 50) * 50;
}

// Rough energy cost from METs: kcal = MET x kg x hours. Labelled as an estimate in the UI.
const MET = { r: 7, h: 9.5, w: 3.5 };
export function burned(d, kg) {
  if (!d || !kg) return 0;
  let kcal = 0;
  if (d.runDone) {
    if (Array.isArray(d.ints) && d.ints.length) kcal += d.ints.reduce((a, x) => a + (MET[x.k] || 4) * kg * x.sec / 3600, 0);
    else if (d.runAct) kcal += activityKcal(activityById(d.runAct), d.runInt ?? 1, runSecs(d) / 60, kg);
    else kcal += 6 * kg * runSecs(d) / 3600;
  }
  if (d.crossDone) {
    const a = activityById(d.crossAct || legacyType(d.crossType) || "walk-out");
    kcal += activityKcal(a, d.crossInt ?? 1, crossSecs(d) / 60, kg);
  }
  actsOf(d).forEach(x => { kcal += activityKcal(activityById(x.type), x.int ?? 1, x.min || 0, kg); });
  if (strengthDone(d)) { const [n] = setCounts(d.strength); kcal += 5 * kg * (n * 2.5 * 60) / 3600; }
  return Math.round(kcal);
}

export function weekCounts(days, ws) {
  let runs = 0, cross = 0, weighs = 0, fasts = 0;
  for (let i = 0; i < 7; i++) {
    const d = days[iso(addDays(ws, i))]; if (!d) continue;
    if (ranToday(d)) runs++; if (otherCardio(d) || strengthDone(d)) cross++; if (d.weight) weighs++; if (fastsOf(d).length) fasts++;
  }
  return { runs, cross, weighs, fasts };
}
// Consecutive plan weeks with all 3 runs (this week counts once complete).
export function streakWeeks(days, ref) {
  let ws = weekStart(ref), n = 0;
  if (weekCounts(days, ws).runs >= 3) n++;
  ws = addDays(ws, -7);
  while (weekCounts(days, ws).runs >= 3) { n++; ws = addDays(ws, -7); }
  return n;
}

// Period buckets for Daily / Weekly / Monthly charts, oldest first.
export function buckets(period, ref) {
  const t = parse(ref), out = [];
  if (period === "D") for (let i = 6; i >= 0; i--) { const d = addDays(t, -i); out.push({ from: iso(d), to: iso(d), label: DOW[d.getDay()].slice(0, 2) }); }
  else if (period === "W") for (let i = 7; i >= 0; i--) { const s = addDays(weekStart(ref), -7 * i); out.push({ from: iso(s), to: iso(addDays(s, 6)), label: s.getDate() + " " + MON[s.getMonth()] }); }
  else for (let i = 5; i >= 0; i--) { const s = new Date(t.getFullYear(), t.getMonth() - i, 1), e = new Date(t.getFullYear(), t.getMonth() - i + 1, 0); out.push({ from: iso(s), to: iso(e), label: MON[s.getMonth()] }); }
  return out;
}
function daysIn(b, days) { const out = []; for (let d = parse(b.from); iso(d) <= b.to; d = addDays(d, 1)) out.push(days[iso(d)]); return out; }

// Metric values per bucket. agg: "sum" adds every day, "avg" averages days that have data.
export function series(days, bks, valueOf, agg) {
  return bks.map(b => {
    const vals = daysIn(b, days).map(d => (d ? valueOf(d) : null)).filter(v => v != null && v !== 0 && !isNaN(v));
    if (!vals.length) return agg === "sum" ? 0 : null;
    const s = vals.reduce((a, v) => a + v, 0);
    return agg === "sum" ? s : s / vals.length;
  });
}

// Linear trend over the last 28 days of weigh-ins: units per week (negative = losing).
export function weeklyTrend(list, ref) {
  const recent = list.filter(x => { const k = daysBetween(parse(x.date), parse(ref)); return k >= 0 && k <= 28; });
  if (recent.length < 5) return null;
  const t0 = parse(recent[0].date), xs = recent.map(x => daysBetween(t0, parse(x.date))), ys = recent.map(x => x.w);
  const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  let num = 0, den = 0; xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; });
  return den ? (num / den) * 7 : null;
}
