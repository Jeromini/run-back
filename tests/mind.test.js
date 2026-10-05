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
    expect(suggestTop([t("d", false, false)])).toEqual([]);   // never the "Let go" box
  });
  it("carries unfinished items forward without duplicates", () => {
    const prev = [t("a", true, true, { top: true }), t("b", true, false, { done: true }), t("c", false, true)];
    const out = carryOver(prev, "2026-10-04", [{ id: "z", text: "Task c" }]);
    expect(out.map(x => x.id)).toEqual(["a"]);
    expect(out[0]).toMatchObject({ top: false, done: false, from: "2026-10-04" });
  });
  it("summarises a day and a week", () => {
    expect(daySummary({ am: { level: 4 }, pm: { level: 2 }, tasks: [t("a", 1, 1, { top: true, done: true }), t("b", 1, 0, { top: true })] }))
      .toEqual({ before: 4, after: 2, total: 2, done: 1, top: 2, topDone: 1, tools: [] });
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

import { parkedWorries, unloadSummary, focusQueue, BREATHS, TOOLS, THOUGHT_STEPS } from "../src/domain/mind.js";
describe("mind: unload, focus, worry time, what helps", () => {
  it("suggests today's items before this week's", () => {
    const tasks = [t("w", true, true, { when: "week" }), t("d", true, false, { when: "today" })];
    expect(suggestTop(tasks, 1)).toEqual(["d"]);
  });
  it("focus works through today's three in order, skipping done ones", () => {
    expect(focusQueue([t("a", 1, 1, { top: true, done: true }), t("b", 1, 1, { top: true }), t("c", 1, 1)]).map(x => x.id)).toEqual(["b"]);
  });
  it("collects parked worries until they've been reviewed", () => {
    const days = { "2026-10-03": { mind: { worries: [{ id: "a", text: "Money", outcome: "park" }, { id: "b", text: "x", outcome: "let" }] } },
      "2026-10-04": { mind: { worries: [{ id: "c", text: "Health", outcome: "park", reviewed: true }] } } };
    expect(parkedWorries(days, "2026-10-05").map(w => w.id)).toEqual(["a"]);
  });
  it("summarises an unload", () => {
    expect(unloadSummary({ tasks: [t("a", 1, 1, { when: "today", top: true }), t("b", 1, 0, { when: "week" })], worries: [{ outcome: "let" }, { outcome: "park" }] }))
      .toEqual({ total: 4, today: 1, later: 1, letGo: 1, parked: 1, top: 1 });
  });
  it("finds which tools went with calmer evenings", () => {
    const mk = (b, a, tools) => ({ mind: { am: { level: b }, pm: { level: a }, tools: tools.map(id => ({ id })) } });
    const days = { "2026-10-01": mk(4, 2, ["breathe"]), "2026-10-02": mk(4, 2, ["breathe"]), "2026-10-03": mk(4, 4, []), "2026-10-04": mk(4, 4, []) };
    const w = weekStats(days, "2026-10-05");
    expect(w.helped[0]).toMatchObject({ id: "breathe", diff: 2 });
  });
  it("has the toolkit content", () => {
    expect(TOOLS.length).toBeGreaterThanOrEqual(7);
    expect(BREATHS.map(b => b.id)).toEqual(["sigh", "calm", "box"]);
    expect(THOUGHT_STEPS.length).toBe(5);
  });
});

import { journalEntries } from "../src/domain/mind.js";
describe("mind: journal", () => {
  it("lists entries newest first with their open actions", () => {
    const days = {
      "2026-10-03": { mind: { entries: [{ id: "a", story: "Kids not sleeping", resolve: "Earlier bedtime", actions: [{ id: "1", text: "Lights out 7:30", done: true }, { id: "2", text: "No screens after dinner", done: false }] }] } },
      "2026-10-05": { mind: { entries: [{ id: "b", story: "Work pressure", actions: [] }, { id: "c", story: "Better day", actions: [] }] } }
    };
    const e = journalEntries(days, "2026-10-05");
    expect(e.map(x => x.id)).toEqual(["c", "b", "a"]);
    expect(e[2]).toMatchObject({ date: "2026-10-03", open: 1, total: 2 });
  });
});
