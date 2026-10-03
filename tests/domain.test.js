import { describe, it, expect } from "vitest";
import { runFor, sessionFor, weekOf, blocksTotal } from "../src/domain/plan.js";
import { stageAt, coach, windowFor, fastStats, planById, planFor, STAGES, zoneHours, EVIDENCE, hourNote, isScheduled, nextStart, dueStart, adherence, ROUTINE_PRESETS } from "../src/domain/fasting.js";
import { bmi, bmiClass, waterTarget, burned, buckets, series, weeklyTrend, avg7, weekCounts, streakWeeks } from "../src/domain/metrics.js";
import { context, evaluate, nextUp } from "../src/domain/achievements.js";
import { iso, addDays, parse } from "../src/lib/dates.js";

const H = 3600000;
const profile = { startDate: "2026-10-01", weekOffset: 0, unit: "lb", dunit: "mi", startWeight: 210 };

describe("plan", () => {
  it("starts on Thursday 1 Oct with week 1 intervals", () => {
    expect(weekOf("2026-10-01", profile)).toBe(1);
    expect(weekOf("2026-10-08", profile)).toBe(2);
    expect(weekOf("2026-09-30", profile)).toBe(0);
    const s = sessionFor("2026-10-01", profile);
    expect(s.kind).toBe("run");
    expect(s.title).toBe("8 x 1 min jog");
  });
  it("8 x 1 min with 7 walks plus warm-up and cool-down is 28.5 minutes", () => {
    expect(blocksTotal(runFor(1, 4).blocks)).toBe(300 + 8 * 60 + 7 * 90 + 300);
  });
  it("repeating a week holds the plan back", () => {
    expect(weekOf("2026-10-08", { ...profile, weekOffset: 1 })).toBe(1);
  });
  it("marks Wednesday speed sessions as hard from week 10", () => {
    expect(runFor(10, 3).hard).toBe(true);
    expect(runFor(10, 4).hard).toBe(false);
  });
  it("Friday is cardio + strength, Saturday rest", () => {
    expect(sessionFor("2026-10-02", profile).kind).toBe("cross");
    expect(sessionFor("2026-10-03", profile).kind).toBe("rest");
  });
});

describe("fasting", () => {
  it("names stages by hours", () => {
    expect(stageAt(2).name).toBe("Blood sugar rises");
    expect(stageAt(13).name).toBe("Fat burning");
    expect(stageAt(13).nextIn).toBe(5);
    expect(stageAt(30).name).toBe("Autophagy ramps up");
    expect(stageAt(50).name).toBe("Growth hormone peak");
    expect(stageAt(80).name).toBe("Immune renewal (research)");
    expect(stageAt(100).next).toBe(null);
  });
  it("offers multi-day and custom plans", () => {
    expect(planById("72h").hours).toBe(72);
    expect(planById("120h").hours).toBe(120);
    expect(planFor({ fastPlan: "custom", fastCustomH: 60 })).toMatchObject({ hours: 60, label: "60 h" });
    expect(planFor({ fastPlan: "custom", fastCustomH: 96 }).label).toBe("4 days");
    expect(planFor({ fastPlan: "custom", fastCustomH: 500 }).hours).toBe(168);
    expect(planFor({ fastPlan: "custom", fastCustomH: 2 }).hours).toBe(12);
  });
  it("labels evidence honestly", () => {
    STAGES.forEach(s => expect(EVIDENCE[s.ev]).toBeTruthy());
    expect(STAGES.find(s => /autophagy/i.test(s.name)).ev).toBe("early");
    expect(STAGES.find(s => /immune/i.test(s.name)).ev).toBe("early");
    expect(STAGES.find(s => /autophagy/i.test(s.name)).text).toMatch(/animal/);
  });
  it("gives a live note for every hour", () => {
    expect(hourNote(0).title).toBe("Your fast has started");
    expect(hourNote(16.5)).toMatchObject({ hour: 16, at: 16, next: { at: 18 } });
    expect(hourNote(120).next).toBe(null);
  });
  it("stages run in order and cover beyond three days", () => {
    STAGES.forEach((s, i) => { if (i) expect(s.from).toBeGreaterThan(STAGES[i - 1].from); expect(s.changes.length).toBeGreaterThan(0); });
    expect(STAGES[STAGES.length - 1].from).toBeGreaterThan(72);
  });
  it("allows a full day of eating after an extended fast", () => {
    const e = Date.UTC(2026, 9, 5, 12);
    expect(windowFor(null, { s: e - 72 * H, e, g: 72 }, 72, e).closesAt).toBe(e + 24 * H);
  });
  it("splits a fast into zones per calendar day", () => {
    // 20 h fast from 8 pm on 1 Oct to 4 pm on 2 Oct (local time)
    const s = new Date(2026, 9, 1, 20).getTime(), e = s + 20 * H;
    const days = { "2026-10-02": { date: "2026-10-02", fasts: [{ s, e, g: 16 }] } };
    const d1 = zoneHours(days, null, "2026-10-01"), d2 = zoneHours(days, null, "2026-10-02");
    expect(d1.zones).toEqual([4, 0, 0, 0]);
    expect(d2.zones).toEqual([8, 6, 2, 0]);
    expect(d2.goalHit).toBe(true);
    expect(d1.goalHit).toBe(null);
  });
  it("counts the fast in progress", () => {
    const now = new Date(2026, 9, 3, 12).getTime(), active = { s: now - 30 * H, h: 72 };
    const z = zoneHours({}, active, "2026-10-03", now).zones;
    expect(z[0] + z[1] + z[2] + z[3]).toBeCloseTo(12);
    expect(z[3]).toBeCloseTo(6);
  });
  it("falls back to 16:8 for unknown plans", () => {
    expect(planById("nope").hours).toBe(16);
    expect(planById("19:5").hours).toBe(19);
  });
  it("computes the eating window after a fast", () => {
    const e = Date.UTC(2026, 9, 2, 12);
    const w = windowFor(null, { s: e - 19 * H, e, g: 19 }, 19, e + H);
    expect(w.closesAt).toBe(e + 5 * H);
    expect(w.fasting).toBe(false);
  });
  const run = { kind: "run", hard: false };
  it("tells you to eat first past 24 hours", () => {
    const now = Date.now();
    expect(coach({ session: run, done: false, active: { s: now - 25 * H, h: 36 }, planHours: 36, now }).tone).toBe("stop");
  });
  it("suggests training near the end of a fast for easy runs", () => {
    const now = Date.now();
    const c = coach({ session: run, done: false, active: { s: now - 10 * H, h: 19 }, planHours: 19, now });
    expect(c.tone).toBe("good");
    expect(c.slot).toBe(now - 10 * H + 17.5 * H);
  });
  it("sends hard sessions to the eating window", () => {
    const now = Date.now();
    expect(coach({ session: { kind: "run", hard: true }, done: false, active: { s: now - 8 * H, h: 16 }, planHours: 16, now }).tone).toBe("caution");
  });
  it("rest days get rest-day advice", () => {
    expect(coach({ session: { kind: "rest" }, done: false, active: null, planHours: 16 }).tone).toBe("info");
  });
  it("summarises fast history", () => {
    const e = Date.now();
    const days = { a: { date: "a", fasts: [{ s: e - 16 * H, e, g: 16 }, { s: e - 30 * H, e: e - 20 * H, g: 16 }] } };
    const st = fastStats(days);
    expect(st.count).toBe(2);
    expect(st.longest).toBeCloseTo(16);
    expect(st.hitRate).toBe(0.5);
  });
});

describe("fasting routines", () => {
  const weekdays = { on: true, pattern: "days", days: [1, 2, 3, 4, 5], hours: 16, start: "20:00" };
  it("knows which days are scheduled", () => {
    expect(isScheduled(weekdays, "2026-10-05")).toBe(true);  // Monday
    expect(isScheduled(weekdays, "2026-10-04")).toBe(false); // Sunday
    const alt = { on: true, pattern: "alternate", anchor: "2026-10-01", hours: 36, start: "20:00" };
    expect(isScheduled(alt, "2026-10-03")).toBe(true);
    expect(isScheduled(alt, "2026-10-04")).toBe(false);
    expect(isScheduled({ ...weekdays, on: false }, "2026-10-05")).toBe(false);
  });
  it("finds the next start, skipping off days", () => {
    const sat = new Date(2026, 9, 3, 10).getTime(); // Saturday morning
    expect(nextStart(weekdays, sat)).toBe(new Date(2026, 9, 5, 20).getTime());
  });
  it("prompts when a scheduled fast is due and not started", () => {
    const mon = new Date(2026, 9, 5, 21).getTime();
    expect(dueStart(weekdays, null, null, mon)).toBe(new Date(2026, 9, 5, 20).getTime());
    expect(dueStart(weekdays, { s: mon - 3600000, h: 16 }, null, mon)).toBe(null);
    expect(dueStart(weekdays, null, { s: new Date(2026, 9, 5, 19, 30).getTime(), e: mon }, mon)).toBe(null);
  });
  it("scores the week", () => {
    const mon8 = new Date(2026, 9, 5, 20).getTime();
    const days = { "2026-10-06": { date: "2026-10-06", fasts: [{ s: mon8, e: mon8 + 16.2 * H, g: 16 }] } };
    const wk = adherence(weekdays, days, null, "2026-10-04", new Date(2026, 9, 7, 9).getTime());
    expect(wk.map(x => x.status)).toEqual(["off", "done", "missed", "upcoming", "upcoming", "upcoming", "off"]);
  });
  it("doesn't count days before the routine began", () => {
    const wk = adherence({ ...weekdays, since: "2026-10-07" }, {}, null, "2026-10-04", new Date(2026, 9, 8, 9).getTime());
    expect(wk.map(x => x.status)).toEqual(["off", "off", "off", "missed", "upcoming", "upcoming", "off"]);
  });
  it("ships sensible presets", () => {
    ROUTINE_PRESETS.forEach(p => { expect(p.hours).toBeGreaterThanOrEqual(12); expect(p.start).toMatch(/^\d\d:\d\d$/); });
  });
});

describe("metrics", () => {
  it("BMI matches the reference app: 210 lb at 157 cm is about 38.6", () => {
    const b = bmi(210, "lb", 157);
    expect(b).toBeGreaterThan(38); expect(b).toBeLessThan(39);
    expect(bmiClass(b).label).toBe("Obesity, class 2");
  });
  it("water target is about 30 ml/kg, plus 500 ml on training days", () => {
    expect(waterTarget(210, "lb", false)).toBe(2850);
    expect(waterTarget(210, "lb", true)).toBe(3350);
    expect(waterTarget(null, "lb", false)).toBe(2500);
  });
  it("estimates energy burned from intervals", () => {
    const kcal = burned({ runDone: true, ints: [{ k: "r", sec: 3600 }] }, 95);
    expect(kcal).toBe(665);
  });
  it("builds 7 daily, 8 weekly and 6 monthly buckets", () => {
    expect(buckets("D", "2026-10-02")).toHaveLength(7);
    expect(buckets("W", "2026-10-02")).toHaveLength(8);
    const m = buckets("M", "2026-10-02");
    expect(m).toHaveLength(6);
    expect(m[5].from).toBe("2026-10-01");
    expect(m[5].to).toBe("2026-10-31");
  });
  it("sums and averages series", () => {
    const days = { "2026-10-01": { weight: 210 }, "2026-10-02": { weight: 208 } };
    const b = buckets("D", "2026-10-02");
    const avg = series(days, b, d => d.weight, "avg");
    expect(avg[6]).toBe(208); expect(avg[5]).toBe(210); expect(avg[0]).toBe(null);
    const one = [{ from: "2026-10-01", to: "2026-10-02" }];
    expect(series(days, one, d => d.weight, "avg")[0]).toBe(209);
    expect(series(days, one, d => d.weight, "sum")[0]).toBe(418);
  });
  it("finds a losing trend", () => {
    const ref = "2026-10-28", list = [];
    for (let i = 0; i < 28; i += 2) list.push({ date: iso(addDays(parse("2026-10-01"), i)), w: 210 - i * (2 / 7) });
    expect(weeklyTrend(list, ref)).toBeCloseTo(-2, 1);
  });
  it("averages the last 7 days only", () => {
    const list = [{ date: "2026-09-20", w: 220 }, { date: "2026-10-01", w: 210 }, { date: "2026-10-02", w: 208 }];
    expect(avg7(list, "2026-10-02")).toBe(209);
  });
  it("counts plan weeks and streaks", () => {
    const days = { "2026-10-01": { runDone: true }, "2026-10-04": { runDone: true }, "2026-10-07": { runDone: true }, "2026-10-02": { weight: 210 } };
    expect(weekCounts(days, parse("2026-10-01")).runs).toBe(3);
    expect(streakWeeks(days, "2026-10-08")).toBe(1);
  });
});

describe("achievements", () => {
  it("awards first run and tracks the next badge", () => {
    const days = { "2026-10-01": { date: "2026-10-01", runDone: true, ints: [{ k: "r", sec: 60 }], weight: 210 } };
    const list = evaluate(context(days, profile, "2026-10-02"));
    expect(list.find(b => b.id === "run1").earned).toBe(true);
    expect(list.find(b => b.id === "run10").earned).toBe(false);
    expect(nextUp(list)).not.toBe(null);
  });
  it("counts weight lost from the starting weight", () => {
    const days = { a: { date: "2026-10-01", weight: 210 }, b: { date: "2026-10-20", weight: 204 } };
    const list = evaluate(context(days, profile, "2026-10-20"));
    expect(list.find(b => b.id === "lost5").earned).toBe(true);
    expect(list.find(b => b.id === "lost10").earned).toBe(false);
  });
});
