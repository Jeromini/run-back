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
