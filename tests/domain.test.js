import { describe, it, expect } from "vitest";
import { runFor, sessionFor, weekOf, blocksTotal } from "../src/domain/plan.js";
import { stageAt, coach, windowFor, fastStats, planById } from "../src/domain/fasting.js";
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
    expect(stageAt(2).name).toBe("Digesting");
    expect(stageAt(13).name).toBe("Fat-burning shift");
    expect(stageAt(13).nextIn).toBe(5);
    expect(stageAt(30).next).toBe(null);
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
