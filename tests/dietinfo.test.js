import { describe, it, expect } from "vitest";
import { DIETS, dietById, dayCompliance } from "../src/domain/diets.js";
import { DIET_INFO, CHECK_HELP } from "../src/domain/dietinfo.js";
import { foodById, nutrition } from "../src/domain/foods.js";

export const exampleEntries = day => day.map(([m, id, pi, q]) => {
  const f = foodById(id); if (!f) throw new Error("unknown food " + id);
  const n = nutrition(f, pi, q);
  return { n: f.name, m, k: n.k, p: n.p, c: n.c, f: n.f, fb: n.fb, t: f.t };
});

describe("diet guides", () => {
  it("every diet has a full guide", () => {
    for (const d of DIETS) {
      const g = DIET_INFO[d.id];
      expect(g, d.id).toBeTruthy();
      for (const k of ["what", "how", "suits", "careful", "evidence"]) expect(g[k], d.id + "." + k).toBeTruthy();
      expect(g.eat.length && g.avoid.length && g.day.length, d.id).toBeTruthy();
    }
  });
  it("every example day actually keeps its diet", () => {
    const ctx = { kcalTarget: 2000, proteinTarget: 120 };
    for (const d of DIETS) {
      const r = dayCompliance(d, {}, exampleEntries(DIET_INFO[d.id].day), ctx);
      expect(r.status, d.id + ": " + JSON.stringify(r.checks.filter(c => !c.ok)) + " " + JSON.stringify(r.breaks)).toBe("kept");
    }
  });
  it("every check has an explanation", () => {
    ["net", "fat", "carbp", "protp", "protein", "kcal", "foods", "favour", "cap"].forEach(k => expect(CHECK_HELP[k]).toBeTruthy());
  });
});
