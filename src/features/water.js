// Water card used on Today and Food. day.water is millilitres.
import { act, toast } from "../lib/dom.js";
import { num } from "../lib/format.js";
import { state, day, render } from "../core/state.js";
import { saveDay } from "../core/store.js";
import { waterTarget, currentWeight } from "../domain/metrics.js";
import { buzz } from "../lib/sound.js";

export function targetFor(date) {
  const d = state.days[date] || {};
  return waterTarget(currentWeight(state.days, date) || state.profile.startWeight, state.profile.unit, d.runDone || d.crossDone);
}
export function waterCard(date) {
  const ml = (state.days[date] || {}).water || 0, t = targetFor(date), p = Math.min(1, ml / t);
  return `<div class="card tight"><div class="water">
    <div class="glass" aria-hidden="true"><i style="height:${(p * 100).toFixed(0)}%"></i></div>
    <div><div class="card-head"><div class="eyebrow">Water</div><span class="note">${p >= 1 ? "Target reached" : num(Math.max(0, t - ml)) + " ml to go"}</span></div>
      <div class="amt">${num(ml)} <small>/ ${num(t)} ml</small></div>
      <div class="btns"><button data-act="water" data-ml="250" data-date="${date}">+ Glass 250</button><button data-act="water" data-ml="500" data-date="${date}">+ Bottle 500</button>
      ${ml ? `<button class="minus" data-act="water" data-ml="-250" data-date="${date}" aria-label="Remove 250 ml">&minus; 250</button>` : ""}</div></div>
  </div></div>`;
}
act("water", el => {
  const d = day(el.dataset.date), before = d.water || 0, t = targetFor(el.dataset.date);
  d.water = Math.max(0, before + Number(el.dataset.ml));
  saveDay(el.dataset.date); buzz(15);
  render();
  if (before < t && d.water >= t) toast("Water target reached");
});
