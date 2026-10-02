// Achievements are derived from the logs, so they can never drift out of sync with the data.
import { iso, addDays, weekStart, parse } from "../lib/dates.js";
import { UNIT_M, LB_PER_KG } from "../lib/format.js";
import { runDist, strengthDone, foodTotals, fastsOf, weights, weekCounts, streakWeeks, waterTarget } from "./metrics.js";

const H = 3600000;

export function context(days, profile, ref) {
  const all = Object.values(days);
  const runs = all.filter(d => d.runDone);
  // only timer-recorded runs know their walk breaks, so only they count toward non-stop badges
  const longestContinuous = Math.max(0, ...runs.flatMap(d => (d.ints || []).filter(x => x.k !== "w").map(x => x.sec)));
  const fasts = all.flatMap(d => fastsOf(d));
  const ws = weights(days);
  const start = profile.startWeight || (ws[0] && ws[0].w) || null;
  const lowest = ws.length ? Math.min(...ws.map(x => x.w)) : null;
  const lostLb = start && lowest ? (start - lowest) * (profile.unit === "kg" ? LB_PER_KG : 1) : 0;
  let weeksDone = 0;
  const first = parse(profile.startDate || "2026-10-01");
  for (let s = weekStart(iso(first)); iso(s) <= ref; s = addDays(s, 7)) if (weekCounts(days, s).runs >= 3) weeksDone++;
  return {
    runs: runs.length,
    distM: runs.reduce((a, d) => a + runDist(d, profile.dunit || "mi"), 0),
    longestRunM: Math.max(0, ...runs.map(d => runDist(d, profile.dunit || "mi"))),
    longestContinuous,
    strength: all.filter(strengthDone).length,
    weeksDone, streak: streakWeeks(days, ref),
    fasts: fasts.length,
    fastsHit: fasts.filter(f => (f.e - f.s) / H >= f.g - 0.01).length,
    longestFastH: Math.max(0, ...fasts.map(f => (f.e - f.s) / H)),
    foodDays: all.filter(d => foodTotals(d).n > 0).length,
    proteinDays: profile.proteinTarget ? all.filter(d => foodTotals(d).p >= profile.proteinTarget).length : 0,
    waterDays: all.filter(d => d.water && d.water >= waterTarget(d.weight || start, profile.unit, d.runDone || d.crossDone)).length,
    weighIns: ws.length,
    lostLb
  };
}

// cat: run | fast | body | habit. `got(c)` returns progress toward `goal`.
export const BADGES = [
  { id: "run1", cat: "run", mark: "1", title: "First steps", desc: "Log your first run", goal: 1, got: c => c.runs },
  { id: "run10", cat: "run", mark: "10", title: "Ten runs", desc: "Log 10 runs", goal: 10, got: c => c.runs },
  { id: "run50", cat: "run", mark: "50", title: "Fifty runs", desc: "Log 50 runs", goal: 50, got: c => c.runs },
  { id: "week1", cat: "run", mark: "W1", title: "Week one done", desc: "Complete all 3 runs in a plan week", goal: 1, got: c => c.weeksDone },
  { id: "week12", cat: "run", mark: "12", title: "Plan complete", desc: "Complete 12 plan weeks", goal: 12, got: c => c.weeksDone },
  { id: "streak4", cat: "run", mark: "4W", title: "Month of momentum", desc: "A 4-week streak of 3 runs", goal: 4, got: c => c.streak },
  { id: "cont20", cat: "run", mark: "20'", title: "Twenty non-stop", desc: "Run 20 minutes without a walk break", goal: 20, got: c => Math.floor(c.longestContinuous / 60) },
  { id: "cont30", cat: "run", mark: "30'", title: "Thirty non-stop", desc: "Run 30 minutes without a walk break", goal: 30, got: c => Math.floor(c.longestContinuous / 60) },
  { id: "5k", cat: "run", mark: "5K", title: "First 5K", desc: "Cover 5 km in a single run", goal: 5000, got: c => c.longestRunM, unit: "m" },
  { id: "dist100", cat: "run", mark: "100", title: "Hundred club", desc: "100 km in total", goal: 100000, got: c => c.distM, unit: "m" },
  { id: "str1", cat: "run", mark: "S", title: "Stronger", desc: "Finish a strength workout", goal: 1, got: c => c.strength },
  { id: "str20", cat: "run", mark: "S20", title: "Built to last", desc: "Finish 20 strength workouts", goal: 20, got: c => c.strength },
  { id: "fast1", cat: "fast", mark: "1", title: "First fast", desc: "Complete a fast", goal: 1, got: c => c.fasts },
  { id: "fastHit10", cat: "fast", mark: "10", title: "On target", desc: "Reach your fasting goal 10 times", goal: 10, got: c => c.fastsHit },
  { id: "fastHit30", cat: "fast", mark: "30", title: "Rhythm", desc: "Reach your fasting goal 30 times", goal: 30, got: c => c.fastsHit },
  { id: "fast18", cat: "fast", mark: "18h", title: "Deep fast", desc: "Complete an 18-hour fast", goal: 18, got: c => Math.floor(c.longestFastH) },
  { id: "food7", cat: "habit", mark: "7", title: "Honest week", desc: "Log your food on 7 days", goal: 7, got: c => c.foodDays },
  { id: "protein7", cat: "habit", mark: "P", title: "Protein first", desc: "Hit your protein target on 7 days", goal: 7, got: c => c.proteinDays },
  { id: "water7", cat: "habit", mark: "H2O", title: "Well watered", desc: "Hit your water target on 7 days", goal: 7, got: c => c.waterDays },
  { id: "weigh14", cat: "habit", mark: "14", title: "Data, not drama", desc: "Weigh in on 14 days", goal: 14, got: c => c.weighIns },
  { id: "lost5", cat: "body", mark: "-5", title: "First five", desc: "Lose 5 lb (2.3 kg)", goal: 5, got: c => c.lostLb },
  { id: "lost10", cat: "body", mark: "-10", title: "Double digits", desc: "Lose 10 lb (4.5 kg)", goal: 10, got: c => c.lostLb },
  { id: "lost20", cat: "body", mark: "-20", title: "Twenty down", desc: "Lose 20 lb (9 kg)", goal: 20, got: c => c.lostLb },
  { id: "lost40", cat: "body", mark: "-40", title: "New you", desc: "Lose 40 lb (18 kg)", goal: 40, got: c => c.lostLb }
];

export function evaluate(ctx) {
  return BADGES.map(b => { const v = Math.max(0, b.got(ctx)); return { ...b, value: v, earned: v >= b.goal, pct: Math.min(1, v / b.goal) }; });
}
// The closest unearned badge, for the "next up" progress bar.
export const nextUp = list => list.filter(b => !b.earned).sort((a, b) => b.pct - a.pct)[0] || null;
export const fmtBadgeProgress = (b, dunit) => b.unit === "m" ? `${(b.value / UNIT_M[dunit]).toFixed(1)} / ${(b.goal / UNIT_M[dunit]).toFixed(1)} ${dunit}` : `${Math.floor(b.value)} / ${b.goal}`;
