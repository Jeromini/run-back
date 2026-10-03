// Food: calories eaten vs target (with an estimate of calories burned), protein, meals and water.
// day.food = [{ id, n: name, k: kcal, p: protein g, m: meal }]
import { act, segHtml, confirmTap, toast, ICON } from "../lib/dom.js";
import { esc, num } from "../lib/format.js";
import { iso, addDays, parse, today, nice, DOW } from "../lib/dates.js";
import { ring, barChart } from "../lib/charts.js";
import { state, day, render } from "../core/state.js";
import { saveDay, saveProfile } from "../core/store.js";
import { foodTotals, burned, currentWeight, toKg, weights } from "../domain/metrics.js";
import { waterCard } from "../features/water.js";
import { pickerHtml, setFoodCtx } from "../features/foodpicker.js";

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"];
let fdate = today(), meal = null, editTargets = false;
export const resetFood = () => { fdate = today(); meal = null; };
export const setFoodDate = d => { fdate = d > today() ? today() : d; meal = null; };
const mealNow = () => { const h = new Date().getHours(); return h < 10 ? "Breakfast" : h < 15 ? "Lunch" : h < 21 ? "Dinner" : "Snacks"; };
const uidGen = () => Math.random().toString(36).slice(2, 9);

function suggest() {
  const p = state.profile, list = weights(state.days), cur = list.length ? list[list.length - 1].w : p.startWeight;
  const lb = cur ? (p.unit === "kg" ? cur * 2.20462 : cur) : null, goalLb = p.goalWeight ? (p.unit === "kg" ? p.goalWeight * 2.20462 : p.goalWeight) : lb;
  return { k: lb ? Math.round(lb * 12 / 50) * 50 : 2200, p: goalLb ? Math.round(goalLb * 0.8 / 5) * 5 : 150 };
}

export function renderFood(root) {
  const p = state.profile, d = state.days[fdate] || {}, tot = foodTotals(d), t = today();
  const kT = p.kcalTarget, pT = p.proteinTarget, kg = toKg(currentWeight(state.days, fdate) || p.startWeight, p.unit);
  const burn = burned(d, kg), left = kT ? kT - tot.k : null;
  const m = meal || (fdate === t ? mealNow() : "Snacks");
  setFoodCtx({ date: fdate, meal: m });
  const food = d.food || [];
  const days7 = Array.from({ length: 7 }, (_, i) => iso(addDays(parse(fdate), i - 6)));
  const k7 = days7.map(k => foodTotals(state.days[k]).k), logged = days7.filter(k => foodTotals(state.days[k]).n);
  const avgK = logged.length ? Math.round(logged.reduce((a, k) => a + foodTotals(state.days[k]).k, 0) / logged.length) : 0;
  const avgP = logged.length ? Math.round(logged.reduce((a, k) => a + foodTotals(state.days[k]).p, 0) / logged.length) : 0;
  const lowFuel = kT && kT < 1600 && (d.runDone || d.crossDone);

  root.innerHTML = `<section class="view">
    <div class="datenav"><button class="iconbtn" data-act="food-day" data-n="-1" aria-label="Previous day">${ICON.back}</button>
      <div class="t">${fdate === t ? "Today" : esc(nice(fdate))}</div>
      <button class="iconbtn" data-act="food-day" data-n="1" aria-label="Next day"${fdate >= t ? " disabled style=\"opacity:.3\"" : ""}>${ICON.next}</button></div>
    <div class="card">
      <div class="fsum">
        <div class="side"><b>${num(tot.k)}</b><span>eaten</span></div>
        ${ring(kT ? tot.k / kT : 0, { size: 150, stroke: 13, color: left != null && left < 0 ? "var(--warn)" : "var(--accent)", inner: `<span class="k">${kT ? num(Math.abs(left)) : num(tot.k)}</span><span class="u">${kT ? (left >= 0 ? "kcal left" : "kcal over") : "kcal"}</span>` })}
        <div class="side"><b>${burn ? num(burn) : 0}</b><span>burned*</span></div>
      </div>
      <div class="macro"><div class="top">Protein <span>${Math.round(tot.p)}${pT ? " / " + pT : ""} g</span></div>
        <div class="bar"><i style="width:${pT ? Math.min(100, 100 * tot.p / pT).toFixed(0) : 0}%;background:var(--rose)"></i></div></div>
      <div class="card-head"><span class="note">*Training estimate${kT ? ", not added to your budget" : ""}</span><button class="linkbtn" data-act="food-targets">${kT ? "Edit targets" : "Set targets"}</button></div>
    </div>
    ${lowFuel ? `<div class="callout">You trained today on a ${num(kT)} kcal target. If your runs start to feel flat or sleep suffers, add 150-250 kcal, mostly protein and carbs, on training days.</div>` : ""}
    ${editTargets || !kT ? targetsCard() : ""}
    ${segHtml("f-meal", MEALS.map(x => [x, x === "Snacks" ? "Snack" : x === "Breakfast" ? "Bkfst" : x]), m, 'data-act="food-meal"')}
    ${pickerHtml()}
    ${food.length ? MEALS.filter(x => food.some(f => f.m === x)).map(x => { const items = food.filter(f => f.m === x);
      return `<div class="meal"><div class="meal-h">${x}<span>${num(items.reduce((a, f) => a + (Number(f.k) || 0), 0))} kcal</span></div>${items.map((f, i) => `<div class="fi${i === 0 ? " first" : ""}"><span class="nm">${esc(f.n)}${f.u ? `<small class="note" style="display:block">${esc((f.q === 0.5 ? "½" : f.q === 1.5 ? "1½" : f.q) + " x " + f.u)}</small>` : ""}</span><span class="k">${f.k || 0}</span><span class="p">${f.p ? f.p + " g" : ""}</span>
        <button class="x" data-act="food-del" data-id="${f.id}" aria-label="Remove ${esc(f.n)}">&times;</button></div>`).join("")}</div>`; }).join("")
      : `<div class="card empty"><b>Nothing logged ${fdate === t ? "today" : "this day"}</b>Search a food above, pick a portion, and the calories are worked out for you.</div>`}
    ${waterCard(fdate)}
    <div class="card"><div class="card-head"><h3>Last 7 days</h3><span class="note">${logged.length ? `avg ${num(avgK)} kcal &middot; ${avgP} g protein` : "no entries yet"}</span></div>
      ${barChart({ labels: days7.map(k => DOW[parse(k).getDay()].slice(0, 2)), values: k7, target: kT, targetLabel: kT ? "target " + num(kT) : "", fmt: v => num(v) })}</div>
  </section>`;
}
function targetsCard() {
  const p = state.profile, sg = suggest();
  return `<div class="card"><h3>Daily targets</h3>
    <p class="note">A starting point for steady fat loss while training: about 12 kcal per lb of body weight and 0.8 g of protein per lb of goal weight. Check your weight trend after two weeks and adjust by 100-200 kcal.</p>
    <div class="row"><label class="f">Calories<input type="number" id="t-k" inputmode="numeric" value="${esc(p.kcalTarget || sg.k)}"></label>
    <label class="f">Protein (g)<input type="number" id="t-p" inputmode="numeric" value="${esc(p.proteinTarget || sg.p)}"></label></div>
    <button class="btn primary big" data-act="food-targets-save">Save targets</button></div>`;
}

act("food-day", el => { const n = Number(el.dataset.n), next = iso(addDays(parse(fdate), n)); if (n > 0 && next > today()) return; fdate = next; meal = null; render(); });
act("food-meal", (el, ev) => { const b = ev.target.closest("button"); if (b) { meal = b.dataset.v; render(); } });
act("food-targets", () => { editTargets = !editTargets; render(); });
act("food-targets-save", () => {
  const k = Number(document.getElementById("t-k").value), pr = Number(document.getElementById("t-p").value);
  if (!k || !pr) { toast("Enter both targets"); return; }
  state.profile.kcalTarget = k; state.profile.proteinTarget = pr; saveProfile(); editTargets = false; toast("Targets saved"); render();
});
act("food-del", el => {
  if (!confirmTap("food" + el.dataset.id, el, "?")) return;
  const d = day(fdate); d.food = (d.food || []).filter(f => f.id !== el.dataset.id); saveDay(fdate); render();
});
