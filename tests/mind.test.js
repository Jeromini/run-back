import { describe, it, expect } from "vitest";
import { QUADRANTS, quadrantOf, sortTasks, suggestTop, carryOver, daySummary, weekStats } from "../src/domain/mind.js";

const t = (id, imp, urg, extra = {}) => ({ id, text: "Task " + id, imp, urg, top: false, done: false, ...extra });

describe("mind", () => {
  it("sorts tasks into the four boxes", () => {
    expect(quadrantOf(t("a", true, true)).id).toBe("do");
    expect(quadrantOf(t("b", true, false)).id).toBe("plan");
    expect(quadrantOf(t("c", false, true)).id).toBe("shrink");
    expect(quadrantOf(t("d", false, false)).id).toBe("drop");
    const g = sortTasks([t("a", true, true, { done: true }), t("b", true, true)]);
    expect(g.map(q => q.id)).toEqual(QUADRANTS.map(q => q.id));
    expect(g[0].tasks.map(x => x.id)).toEqual(["b", "a"]);   // unfinished first
  });
  it("suggests three from the most pressing boxes", () => {
    const tasks = [t("d", false, false), t("p", true, false), t("x", true, true), t("s", false, true), t("y", true, true, { done: true })];
    expect(suggestTop(tasks)).toEqual(["x", "p", "s"]);
  });
  it("carries unfinished items forward without duplicates", () => {
    const prev = [t("a", true, true, { top: true }), t("b", true, false, { done: true }), t("c", false, true)];
    const out = carryOver(prev, "2026-10-04", [{ id: "z", text: "Task c" }]);
    expect(out.map(x => x.id)).toEqual(["a"]);
    expect(out[0]).toMatchObject({ top: false, done: false, from: "2026-10-04" });
  });
  it("summarises a day and a week", () => {
    expect(daySummary({ am: { level: 4 }, pm: { level: 2 }, tasks: [t("a", 1, 1, { top: true, done: true }), t("b", 1, 0, { top: true })] }))
      .toEqual({ before: 4, after: 2, total: 2, done: 1, top: 2, topDone: 1 });
    const days = {
      "2026-10-03": { mind: { am: { level: 4, causes: ["work", "sleep"] }, pm: { level: 3 }, tasks: [t("a", 1, 1, { top: true, done: true })] } },
      "2026-10-04": { mind: { am: { level: 5, causes: ["work"] }, pm: { level: 3 }, tasks: [t("b", 1, 1, { top: true })] } }
    };
    const w = weekStats(days, "2026-10-05");
    expect(w.checkins).toBe(2);
    expect(w.avgBefore).toBe(4.5);
    expect(w.drop).toBe(1.5);
    expect(w.topRate).toBe(0.5);
    expect(w.streak).toBe(2);   // today not checked in yet does not break it
    expect(w.causes[0]).toEqual(["work", 2]);
  });
});
