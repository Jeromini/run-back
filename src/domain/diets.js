// Diets: the major eating patterns, each as checkable rules on a day's food log.
// Pure: food entries and context are passed in.
//   entry = { n, k, p, c?, f?, fb?, t?: [tags] }   (c, f, fb in grams; t from macros.js TAGS)
//   profile.diet = { id, carbLimit?, phase?, since: "YYYY-MM-DD" }
// Rules are tracking aids, not medical advice; the UI says so.

export const FAMILIES = [
  ["carb", "Low carb"], ["plant", "Plant-based"], ["whole", "Whole food"], ["heart", "Heart and longevity"], ["count", "Counting"], ["free", "Free-from"]
];

// limits: netCarbs / carbs (g max), fatPct / proteinPct ([min, max] share of calories), protein (g min, "target"), kcal ("target")
// avoid: tags that break the diet. cap: { tag group: max items a day }. favour: tags that count toward the diet's core foods.
export const DIETS = [
  { id: "no-carb", fam: "carb", name: "No carb (carnivore style)", blurb: "Meat, fish, eggs and some dairy. Carbs close to zero.",
    limits: { netCarbs: 10 }, avoid: ["grain", "legume", "starch", "fruit", "sugar", "sweetened"], adjust: [5, 30] },
  { id: "keto", fam: "carb", name: "Keto", blurb: "Very low carb, high fat, so the body runs on ketones.",
    limits: { netCarbs: 25, fatPct: [55, 90] }, avoid: ["sugar", "sweetened"], adjust: [15, 50] },
  { id: "low-carb", fam: "carb", name: "Low carb", blurb: "A moderate carb cap without going full keto.",
    limits: { netCarbs: 100 }, avoid: ["sugar", "sweetened"], adjust: [50, 150] },
  { id: "atkins", fam: "carb", name: "Atkins", blurb: "Low carb in phases, adding carbs back step by step.",
    phases: [["Phase 1: Induction", 20], ["Phase 2: Balancing", 40], ["Phase 3: Fine-tuning", 80], ["Phase 4: Maintenance", 100]], limits: { netCarbs: 20 }, avoid: ["sugar", "sweetened"] },
  { id: "paleo", fam: "whole", name: "Paleo", blurb: "Meat, fish, eggs, vegetables, fruit and nuts. No grains, legumes, dairy or added sugar.",
    limits: {}, avoid: ["grain", "legume", "dairy", "sugar", "processed", "sweetened", "soy", "alcohol"] },
  { id: "whole30", fam: "whole", name: "Whole30", blurb: "30 days of whole foods: no sugar, grains, legumes, dairy or alcohol.",
    limits: {}, avoid: ["grain", "legume", "dairy", "sugar", "alcohol", "soy", "processed", "sweetened"] },
  { id: "sugar-free", fam: "free", name: "No added sugar", blurb: "Everything except added sugar, sweets and sugary drinks.",
    limits: {}, avoid: ["sugar", "sweetened"] },
  { id: "mediterranean", fam: "heart", name: "Mediterranean", blurb: "Vegetables, fish, olive oil, legumes and whole grains; little red meat or sugar.",
    limits: {}, avoid: ["sweetened"], cap: { meat: 1, processed: 0, sugar: 1 }, favour: ["veg", "fruit", "fish", "legume", "nut", "oil", "grain"], favourMin: 4 },
  { id: "dash", fam: "heart", name: "DASH", blurb: "For blood pressure: fruit, vegetables, low-fat dairy, whole grains; little salt or sugar.",
    limits: { fatPct: [0, 30] }, avoid: ["sweetened"], cap: { processed: 0, sugar: 1, meat: 1 }, favour: ["veg", "fruit", "dairy", "grain", "legume", "nut"], favourMin: 4 },
  { id: "vegetarian", fam: "plant", name: "Vegetarian", blurb: "No meat, poultry or fish. Eggs and dairy are fine.",
    limits: {}, avoid: ["meat", "poultry", "fish", "shellfish"] },
  { id: "vegan", fam: "plant", name: "Vegan", blurb: "Plants only: no meat, fish, eggs or dairy.",
    limits: {}, avoid: ["meat", "poultry", "fish", "shellfish", "egg", "dairy"] },
  { id: "pescatarian", fam: "plant", name: "Pescatarian", blurb: "Vegetarian plus fish and seafood.",
    limits: {}, avoid: ["meat", "poultry"] },
  { id: "flexitarian", fam: "plant", name: "Flexitarian", blurb: "Mostly plants, with meat once a day at most.",
    limits: {}, cap: { meatAny: 1 } },
  { id: "high-protein", fam: "count", name: "High protein", blurb: "Hit your protein target every day to hold muscle while you lose fat.",
    limits: { protein: "target" }, avoid: [] },
  { id: "low-fat", fam: "count", name: "Low fat", blurb: "Fat under 30% of calories.",
    limits: { fatPct: [0, 30] }, avoid: [] },
  { id: "zone", fam: "count", name: "Zone (40/30/30)", blurb: "40% of calories from carbs, 30% protein, 30% fat.",
    limits: { carbPct: [33, 47], proteinPct: [23, 37], fatPct: [23, 37] }, avoid: [] },
  { id: "calories", fam: "count", name: "Calorie counting", blurb: "Any food, within your daily calorie target.",
    limits: { kcal: "target" }, avoid: [] },
  { id: "gluten-free", fam: "free", name: "Gluten-free", blurb: "No wheat, barley or rye.",
    limits: {}, avoid: ["gluten"] },
  { id: "dairy-free", fam: "free", name: "Dairy-free", blurb: "No milk, cheese, yoghurt, butter or cream.",
    limits: {}, avoid: ["dairy"] }
];
export const dietById = id => DIETS.find(d => d.id === id) || null;

const TAG_WORDS = { grain: "grains", legume: "beans and lentils", starch: "starchy food", fruit: "fruit", sugar: "added sugar", sweetened: "a sugary drink",
  dairy: "dairy", processed: "processed food", soy: "soy", alcohol: "alcohol", meat: "red meat", poultry: "poultry", fish: "fish", shellfish: "shellfish",
  egg: "egg", gluten: "gluten" };
const r1 = n => Math.round(n * 10) / 10;

// Macros for one entry. Older entries and custom foods carry only kcal and protein: estimate the rest.
export function entryMacros(e) {
  const k = Number(e.k) || 0, p = Number(e.p) || 0;
  if (e.c != null) return { k, p, c: Number(e.c) || 0, f: Number(e.f) || 0, fb: Number(e.fb) || 0, est: false };
  const rest = Math.max(0, k - 4 * p);
  return { k, p, c: r1(rest * 0.5 / 4), f: r1(rest * 0.5 / 9), fb: 0, est: true };
}

export function dayTotals(foods) {
  const t = { k: 0, p: 0, c: 0, f: 0, fb: 0, est: false, n: (foods || []).length };
  (foods || []).forEach(e => { const m = entryMacros(e); t.k += m.k; t.p += m.p; t.c += m.c; t.f += m.f; t.fb += m.fb; if (m.est) t.est = true; });
  t.net = Math.max(0, t.c - t.fb);
  ["k", "p", "c", "f", "fb", "net"].forEach(x => (t[x] = r1(t[x])));
  return t;
}

// The carb cap in force: the person's own setting, the Atkins phase, or the diet default.
export function carbCap(diet, opts = {}) {
  if (diet.phases) return diet.phases[Math.min(diet.phases.length - 1, opts.phase || 0)][1];
  if (diet.limits.netCarbs == null) return null;
  return opts.carbLimit || diet.limits.netCarbs;
}

// Why one food breaks the diet, or null if it fits.
export function itemReason(diet, opts, e) {
  const tags = e.t || [];
  const hit = (diet.avoid || []).find(t => tags.includes(t));
  if (hit) return `Has ${TAG_WORDS[hit] || hit}`;
  const cap = carbCap(diet, opts), m = entryMacros(e);
  // only flag on carbs when they're known, not estimated from calories
  if (cap != null && !m.est) {
    const net = Math.max(0, m.c - m.fb);
    if (net > Math.max(5, cap * 0.4)) return `${Math.round(net)} g net carbs`;
  }
  return null;
}

// ctx: { kcalTarget, proteinTarget }
export function dayCompliance(diet, opts, foods, ctx = {}) {
  const list = foods || [], t = dayTotals(list);
  if (!list.length) return { status: "empty", score: 0, checks: [], breaks: [], totals: t };
  const checks = [], L = diet.limits, kc = Math.max(1, t.c * 4 + t.p * 4 + t.f * 9);
  const pct = g => Math.round(g / kc * 100);
  const cap = carbCap(diet, opts);
  if (cap != null) checks.push({ id: "net", label: "Net carbs", value: Math.round(t.net), target: cap, unit: "g", dir: "max", ok: t.net <= cap });
  if (L.carbs != null) checks.push({ id: "carbs", label: "Carbs", value: Math.round(t.c), target: L.carbs, unit: "g", dir: "max", ok: t.c <= L.carbs });
  const range = (id, label, v, [lo, hi]) => checks.push({ id, label, value: v, target: lo && hi < 100 ? `${lo} to ${hi}` : lo ? lo : hi, unit: "%", dir: lo && hi < 100 ? "range" : lo ? "min" : "max", ok: v >= lo && v <= hi });
  if (L.fatPct) range("fat", "Fat share", pct(t.f * 9), L.fatPct);
  if (L.carbPct) range("carbp", "Carb share", pct(t.c * 4), L.carbPct);
  if (L.proteinPct) range("protp", "Protein share", pct(t.p * 4), L.proteinPct);
  if (L.protein === "target" && ctx.proteinTarget) checks.push({ id: "protein", label: "Protein", value: Math.round(t.p), target: ctx.proteinTarget, unit: "g", dir: "min", ok: t.p >= ctx.proteinTarget * 0.95 });
  if (L.kcal === "target" && ctx.kcalTarget) checks.push({ id: "kcal", label: "Calories", value: Math.round(t.k), target: ctx.kcalTarget, unit: "kcal", dir: "max", ok: t.k <= ctx.kcalTarget * 1.05 });
  // foods that break the diet
  const breaks = list.map((e, i) => ({ i, name: e.n, reason: itemReason(diet, opts, e) })).filter(x => x.reason);
  if ((diet.avoid || []).length || cap != null) checks.push({ id: "foods", label: "Foods on plan", value: list.length - breaks.length, target: list.length, unit: "", dir: "all", ok: !breaks.length });
  // daily caps on food groups
  if (diet.cap) Object.entries(diet.cap).forEach(([g, max]) => {
    const n = list.filter(e => { const tg = e.t || []; return g === "meatAny" ? tg.includes("meat") || tg.includes("poultry") : tg.includes(g); }).length;
    checks.push({ id: "cap-" + g, label: g === "meatAny" ? "Meat servings" : (TAG_WORDS[g] || g).replace(/^./, c => c.toUpperCase()), value: n, target: max, unit: "", dir: "max", ok: n <= max });
  });
  // core food groups eaten (Mediterranean, DASH)
  if (diet.favour) {
    const got = diet.favour.filter(g => list.some(e => (e.t || []).includes(g)));
    checks.push({ id: "favour", label: "Core food groups", value: got.length, target: diet.favourMin, unit: "", dir: "min", ok: got.length >= diet.favourMin, detail: got });
  }
  const okN = checks.filter(c => c.ok).length, score = checks.length ? okN / checks.length : 1;
  return { status: okN === checks.length ? "kept" : score >= 0.66 ? "close" : "off", score, checks, breaks, totals: t };
}

const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

// Report for a date range (inclusive): adherence, averages, streaks and the foods that most often break it.
export function dietReport(diet, opts, days, from, to, ctx = {}) {
  const out = [], breakers = {};
  for (let d = parse(from); iso(d) <= to; d.setDate(d.getDate() + 1)) {
    const k = iso(d), r = dayCompliance(diet, opts, (days[k] || {}).food, ctx);
    out.push({ date: k, status: r.status, score: r.score, totals: r.totals });
    r.breaks.forEach(b => (breakers[b.name] = (breakers[b.name] || 0) + 1));
  }
  const logged = out.filter(x => x.status !== "empty"), kept = logged.filter(x => x.status === "kept");
  const avg = key => logged.length ? r1(logged.reduce((a, x) => a + x.totals[key], 0) / logged.length) : 0;
  let best = 0, run = 0;
  out.forEach(x => { if (x.status === "kept") { run++; best = Math.max(best, run); } else if (x.status !== "empty") run = 0; });
  let streak = 0;
  for (let i = out.length - 1; i >= 0; i--) { const x = out[i]; if (x.status === "kept") streak++; else if (x.status === "empty" && i === out.length - 1) continue; else break; }
  return {
    days: out, logged: logged.length, kept: kept.length, close: logged.filter(x => x.status === "close").length,
    adherence: logged.length ? kept.length / logged.length : 0, streak, best,
    avg: { k: avg("k"), p: avg("p"), c: avg("c"), f: avg("f"), net: avg("net") },
    breakers: Object.entries(breakers).sort((a, b) => b[1] - a[1]).slice(0, 5)
  };
}
