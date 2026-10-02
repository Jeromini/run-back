import { describe, it, expect } from "vitest";
import { FOODS, CATS, foodById, nutrition, searchFoods } from "../src/domain/foods.js";

describe("food database", () => {
  it("has unique ids, valid categories and at least one portion each", () => {
    const ids = new Set(), cats = new Set(CATS.map(c => c[0]));
    for (const f of FOODS) {
      expect(ids.has(f.id)).toBe(false); ids.add(f.id);
      expect(cats.has(f.cat)).toBe(true);
      expect(f.portions.length).toBeGreaterThan(0);
      expect(f.k).toBeGreaterThanOrEqual(0);
      expect(f.p).toBeLessThanOrEqual(f.k / 4 + 0.5); // protein can't supply more energy than the food has
      f.portions.forEach(pt => expect(pt.g).toBeGreaterThan(0));
    }
    expect(FOODS.length).toBeGreaterThan(400);
  });
  it("2 large eggs = 143 kcal, 12.6 g protein", () => {
    expect(nutrition(foodById("egg"), 0, 2)).toEqual({ g: 100, k: 143, p: 12.6 });
  });
  it("1 fist of white rice is about 205 kcal", () => {
    expect(nutrition(foodById("rice-white"), 0, 1).k).toBe(205);
  });
  it("half portions work", () => {
    expect(nutrition(foodById("chk-breast-grill"), 1, 0.5)).toEqual({ g: 85, k: 140, p: 26.4 });
  });
  it("covers world dishes", () => {
    for (const q of ["jollof", "biryani", "pad thai", "pho", "falafel", "taco", "paella", "ramen", "injera", "arepa"]) expect(searchFoods(q).length).toBeGreaterThan(0);
  });
  it("adds a 100 g portion to every food", () => {
    expect(FOODS.every(f => f.portions.some(p => p.g === 100))).toBe(true);
  });
  it("finds foods by name and alias, best match first", () => {
    expect(searchFoods("egg")[0].id).toBe("egg");
    expect(searchFoods("wing").map(f => f.id)).toContain("chk-wing");
    expect(searchFoods("red peas").map(f => f.id)).toContain("beans-kidney");
    expect(searchFoods("chicken thigh").every(f => /thigh/i.test(f.name + f.aliases))).toBe(true);
    expect(searchFoods("")).toEqual([]);
  });
});

import { drinkNutrition, drinkLabel, defaults } from "../src/domain/drinks.js";
import { ACTIVITIES, activityKcal, activityById, legacyType } from "../src/domain/activities.js";
import { burned, weekCounts } from "../src/domain/metrics.js";

describe("drink builder", () => {
  const sb = (drink, milk, size = 2) => ({ ...defaults(drink, "starbucks"), milk, size, sweet: "none" });
  it("matches published Starbucks figures within about 10%", () => {
    const near = (v, ref) => expect(Math.abs(v - ref) / ref).toBeLessThan(0.1);
    near(drinkNutrition(sb("latte", "2pc")).k, 190);       // Grande latte, 2%
    near(drinkNutrition(sb("cappuccino", "2pc")).k, 140);  // Grande cappuccino, 2%
    near(drinkNutrition(sb("chai", "2pc")).k, 240);        // Grande chai latte, 2%
    near(drinkNutrition({ ...sb("mocha", "2pc"), whip: true }).k, 370);
  });
  it("black coffee is nearly zero; sugar and milk add up", () => {
    const black = { ...defaults("brewed", "home"), milk: "none", sweet: "none" };
    expect(drinkNutrition(black).k).toBeLessThan(10);
    const sweet = { ...black, milk: "whole", splash: 0, sweet: "sugar", sweetQty: 2 };
    expect(drinkNutrition(sweet).k).toBe(drinkNutrition(black).k + 18 + 32);
  });
  it("tea with no sugar stays near zero, and the label says so", () => {
    const t = { ...defaults("tea", "home"), milk: "none", sweet: "none" };
    expect(drinkNutrition(t).k).toBeLessThan(5);
    expect(drinkLabel(t)).toMatch(/no sugar/);
  });
  it("bubble tea scales with sugar level and pearls", () => {
    const base = { ...defaults("bubble"), sugarLevel: 0, pearls: false };
    expect(drinkNutrition({ ...base, sugarLevel: 1 }).k - drinkNutrition(base).k).toBe(120);
    expect(drinkNutrition({ ...base, pearls: true }).k - drinkNutrition(base).k).toBe(150);
  });
  it("chain sizes change the volume", () => {
    expect(drinkNutrition({ ...defaults("latte", "starbucks"), size: 3 }).ml).toBe(591);
    expect(drinkNutrition({ ...defaults("latte", "dunkin"), size: 0 }).ml).toBe(296);
  });
});

describe("activities", () => {
  it("has unique ids and increasing intensity", () => {
    expect(new Set(ACTIVITIES.map(a => a.id)).size).toBe(ACTIVITIES.length);
    ACTIVITIES.forEach(a => { expect(a.mets[0]).toBeLessThanOrEqual(a.mets[1]); expect(a.mets[1]).toBeLessThanOrEqual(a.mets[2]); });
    expect(ACTIVITIES.length).toBeGreaterThan(70);
    expect(ACTIVITIES.filter(a => a.group === "machine").length).toBeGreaterThan(25);
  });
  it("30 min moderate elliptical at 95 kg is about 309 kcal", () => {
    expect(activityKcal(activityById("elliptical"), 1, 30, 95)).toBe(309);
  });
  it("extra activities add to calories burned and the weekly rings", () => {
    const d = { acts: [{ id: "a", type: "rower", min: 20, int: 1 }, { id: "b", type: "run-tread", min: 30, int: 0 }] };
    expect(burned(d, 95)).toBe(Math.round(7 * 95 / 3) + Math.round(8.3 * 95 / 2));
    const wc = weekCounts({ "2026-10-01": d }, new Date(2026, 9, 1));
    expect(wc.runs).toBe(1); expect(wc.cross).toBe(1);
  });
  it("maps old free-text cardio types", () => {
    expect(legacyType("Cycling")).toBe("cycle-out");
    expect(legacyType("Brisk walk")).toBe("walk-out");
  });
});
