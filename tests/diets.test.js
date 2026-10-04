import { describe, it, expect } from "vitest";
import { DIETS, dietById, entryMacros, dayTotals, carbCap, itemReason, dayCompliance, dietReport } from "../src/domain/diets.js";

const eggs = { n: "Eggs, 2", k: 156, p: 12.6, c: 1.1, f: 10.6, fb: 0, t: ["egg"] };
const steak = { n: "Ribeye steak", k: 520, p: 50, c: 0, f: 35, fb: 0, t: ["meat"] };
const rice = { n: "White rice", k: 206, p: 4.3, c: 45, f: 0.4, fb: 0.6, t: ["grain"] };
const salad = { n: "Greek salad", k: 180, p: 5, c: 8, f: 15, fb: 3, t: ["veg", "dairy", "oil"] };
const soda = { n: "Cola", k: 140, p: 0, c: 39, f: 0, fb: 0, t: ["sugar", "sweetened"] };

describe("diets", () => {
  it("has the major diets with unique ids", () => {
    expect(new Set(DIETS.map(d => d.id)).size).toBe(DIETS.length);
    ["keto", "no-carb", "low-carb", "atkins", "paleo", "mediterranean", "vegan", "vegetarian", "dash", "gluten-free", "calories"].forEach(id => expect(dietById(id)).toBeTruthy());
  });
  it("estimates macros for old entries with only kcal and protein", () => {
    const m = entryMacros({ k: 400, p: 20 });
    expect(m.est).toBe(true);
    expect(m.c).toBeGreaterThan(0);
    expect(dayTotals([eggs, rice]).net).toBeCloseTo(1.1 + 45 - 0.6, 1);
  });
  it("keto: a steak-and-eggs day is kept, rice breaks it", () => {
    const keto = dietById("keto");
    expect(dayCompliance(keto, {}, [eggs, steak, salad]).status).toBe("kept");
    const r = dayCompliance(keto, {}, [eggs, steak, rice]);
    expect(r.status).not.toBe("kept");
    expect(r.breaks.map(b => b.name)).toEqual(["White rice"]);
    expect(itemReason(keto, {}, rice)).toMatch(/net carbs/);
  });
  it("carb cap follows the person's setting and Atkins phases", () => {
    expect(carbCap(dietById("keto"), { carbLimit: 40 })).toBe(40);
    expect(carbCap(dietById("atkins"), { phase: 2 })).toBe(80);
    expect(carbCap(dietById("vegan"), {})).toBe(null);
  });
  it("vegan and paleo check food types, not numbers", () => {
    expect(dayCompliance(dietById("vegan"), {}, [eggs]).breaks[0].reason).toBe("Has egg");
    expect(dayCompliance(dietById("paleo"), {}, [steak, salad]).breaks[0].reason).toBe("Has dairy");
    expect(dayCompliance(dietById("sugar-free"), {}, [soda]).status).toBe("off");
  });
  it("calorie counting and high protein use the person's targets", () => {
    expect(dayCompliance(dietById("calories"), {}, [steak, rice], { kcalTarget: 500 }).status).not.toBe("kept");
    expect(dayCompliance(dietById("high-protein"), {}, [steak, eggs], { proteinTarget: 60 }).status).toBe("kept");
  });
  it("low carb judges the day's total, not one portion of rice", () => {
    expect(itemReason(dietById("low-carb"), {}, rice)).toBe(null);
    expect(dayCompliance(dietById("low-carb"), {}, [eggs, steak, rice]).status).toBe("kept");
  });
  it("an empty day is not counted", () => {
    expect(dayCompliance(dietById("keto"), {}, []).status).toBe("empty");
  });
  it("report: adherence, streak and top breakers", () => {
    const keto = dietById("keto");
    const days = {
      "2026-10-01": { food: [eggs, steak] }, "2026-10-02": { food: [eggs, rice] },
      "2026-10-03": { food: [steak, salad] }, "2026-10-04": { food: [eggs, steak] }
    };
    const r = dietReport(keto, {}, days, "2026-10-01", "2026-10-05");
    expect(r.logged).toBe(4);
    expect(r.kept).toBe(3);
    expect(r.adherence).toBeCloseTo(0.75);
    expect(r.streak).toBe(2);   // today (5th) not logged yet does not break it
    expect(r.best).toBe(2);
    expect(r.breakers[0][0]).toBe("White rice");
  });
});
