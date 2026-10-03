import { describe, it, expect } from "vitest";
import { newJourney, dayChecks, dayScore, weekProgress, journeyStats, journeyTotals, milestones, weightJourney, journeyEnd, dayNumber, activePillars } from "../src/domain/journey.js";

const H = 3600000;
const ctx = { waterTarget: () => 3000, kcalTarget: 2000, fastHours: 16, fastDay: null };
const at = (date, h) => new Date(date + "T00:00").getTime() + h * H;
const fast16 = date => ({ s: at(date, -4), e: at(date, 12), g: 16 });
// A full day: run, a 16 h fast, water, food within target, weigh-in and a note.
const full = (date, w = 210) => ({ date, runDone: true, runDur: 1800, fasts: [fast16(date)], water: 3000, food: [{ n: "Eggs", k: 300, p: 20, m: "Breakfast" }], weight: w, journal: { text: "Good day", mood: 4 } });

describe("journey", () => {
  const j = newJourney("comeback", "2026-10-05");
  it("builds a 12-week comeback package with every goal on", () => {
    expect(j.weeks).toBe(12);
    expect(activePillars(j).map(p => p.id)).toEqual(["train", "run", "strength", "fast", "water", "food", "weight", "note"]);
    expect(journeyEnd(j)).toBe("2026-12-27");
    expect(dayNumber(j, "2026-10-05")).toBe(1);
    expect(dayNumber(j, "2026-10-11")).toBe(7);
  });
  it("checks each goal for a day", () => {
    const c = dayChecks(j, full("2026-10-05"), "2026-10-05", ctx), m = Object.fromEntries(c.map(x => [x.id, x.done]));
    expect(m).toEqual({ train: true, run: true, strength: false, fast: true, water: true, food: true, weight: true, note: true });
    expect(dayScore(c)).toBe(1);
  });
  it("an empty day scores zero and food over target does not count", () => {
    expect(dayScore(dayChecks(j, undefined, "2026-10-05", ctx))).toBe(0);
    const d = { date: "2026-10-05", food: [{ n: "Pizza", k: 2500, m: "Dinner" }] };
    expect(dayChecks(j, d, "2026-10-05", ctx).find(x => x.id === "food").done).toBe(false);
  });
  it("routine rest days do not count against the fast goal", () => {
    const c = dayChecks(j, {}, "2026-10-06", { ...ctx, fastDay: () => "off" }).find(x => x.id === "fast");
    expect(c.applies).toBe(false);
    const d = dayChecks(j, {}, "2026-10-06", { ...ctx, fastDay: () => "done" }).find(x => x.id === "fast");
    expect(d.done).toBe(true);
  });
  it("counts the week against its targets", () => {
    const days = { "2026-10-05": full("2026-10-05"), "2026-10-06": full("2026-10-06") };
    const wp = Object.fromEntries(weekProgress(j, days, 1, "2026-10-06", ctx).map(x => [x.id, x]));
    expect(wp.run).toMatchObject({ n: 2, target: 3 });
    expect(wp.water).toMatchObject({ n: 2, target: 7, sofar: 2 });
  });
  it("stats: kept days, streak and score", () => {
    const days = { "2026-10-05": full("2026-10-05"), "2026-10-06": full("2026-10-06"), "2026-10-07": full("2026-10-07") };
    const st = journeyStats(j, days, "2026-10-07", ctx);
    expect(st.dayN).toBe(3);
    expect(st.kept).toBe(3);
    expect(st.streak).toBe(3);
    expect(st.score).toBeGreaterThan(0.8);
    // today not yet logged does not break the streak
    expect(journeyStats(j, days, "2026-10-08", ctx).streak).toBe(3);
    expect(journeyStats(j, days, "2026-10-09", ctx).streak).toBe(0);
  });
  it("before the start: practice day, nothing counted", () => {
    const st = journeyStats(j, {}, "2026-10-03", ctx);
    expect(st.before).toBe(true);
    expect(st.dayN).toBe(0);
  });
  it("totals, weight change and milestones", () => {
    const days = { "2026-10-05": full("2026-10-05", 210), "2026-10-06": { ...full("2026-10-06", 204), fasts: [{ s: at("2026-10-05", 12), e: at("2026-10-06", 14), g: 24 }] } };
    const tot = journeyTotals(j, days, "2026-10-06");
    expect(tot).toMatchObject({ sessions: 2, runs: 2, fasts: 2, notes: 2 });
    expect(weightJourney(j, days, "2026-10-06", 215)).toMatchObject({ from: 210, now: 204, change: -6 });
    const ms = Object.fromEntries(milestones(j, days, "2026-10-06", ctx, "lb").map(m => [m.id, m.date]));
    expect(ms.start).toBe("2026-10-05");
    expect(ms.f1).toBe("2026-10-05");
    expect(ms.f24).toBe("2026-10-06");
    expect(ms.loss5).toBe("2026-10-06");
    expect(ms.week1).toBe(null);
  });
});
