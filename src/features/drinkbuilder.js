// Coffee & tea builder sheet: shop, drink, size, milk, sweetener and extras, with live totals.
import { $, act, openSheet, closeSheet, ICON } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { state } from "../core/state.js";
import { saveProfile } from "../core/store.js";
import { BRANDS, DRINKS, MILKS, SPLASH, SWEET, SUGAR_LEVELS, drinkById, sizesFor, defaults, defaultSize, drinkNutrition, drinkLabel } from "../domain/drinks.js";

let c = null, cb = null;

export function openDrinkBuilder(config, callbacks) {
  c = { ...defaults(config.drink || "latte", config.brand || "home"), ...config };
  cb = callbacks;
  draw(true);
}
const chips = (act, items, cur) => `<div class="chips">${items.map(([v, l]) => `<button class="chip${String(v) === String(cur) ? " on" : ""}" data-act="${act}" data-v="${esc(v)}">${esc(l)}</button>`).join("")}</div>`;

function draw(first = false) {
  const d = drinkById(c.drink), sizes = sizesFor(d, c.brand), sweet = SWEET.find(s => s.id === c.sweet) || SWEET[0];
  if (c.size >= sizes.length) c.size = sizes.length - 1;
  const groups = [["coffee", "Coffee"], ["tea", "Tea & other"]];
  const body = `
    <h1 class="big-title" style="font-size:28px">${esc(d.name)}</h1>
    <div class="portion-total"><div><b id="db-k"></b><span>kcal</span></div><div><b id="db-p"></b><span>g protein</span></div><div><b id="db-ml"></b><span>ml</span></div></div>
    <div class="card"><div class="eyebrow">Where from?</div>${chips("db-brand", BRANDS.map(b => [b.id, b.name]), c.brand)}</div>
    <div class="card"><div class="eyebrow">Drink</div>${groups.map(([g, l]) => `<span class="note">${l}</span>${chips("db-drink", DRINKS.filter(x => x.group === g).map(x => [x.id, x.name]), c.drink)}`).join("")}</div>
    <div class="card"><div class="eyebrow">Size</div>${chips("db-size", sizes.map((s, i) => [i, s[0]]), c.size)}</div>
    ${d.milk !== "none" ? `<div class="card"><div class="eyebrow">Milk</div>${chips("db-milk", MILKS.filter(m => d.milk === "splash" || m.id !== "creamer").map(m => [m.id, m.name]), c.milk)}
      ${d.milk === "splash" && c.milk !== "none" ? `<div class="eyebrow">How much?</div>${chips("db-splash", SPLASH.map((s, i) => [i, s[0]]), c.splash)}` : ""}</div>` : ""}
    ${d.sugarLevel
      ? `<div class="card"><div class="eyebrow">Sugar level</div>${chips("db-level", SUGAR_LEVELS, c.sugarLevel)}
         <label class="switch">Tapioca pearls<input type="checkbox" data-act="db-toggle" data-k="pearls"${c.pearls ? " checked" : ""}></label></div>`
      : `<div class="card"><div class="eyebrow">Sugar or sweetener</div>${chips("db-sweet", SWEET.map(s => [s.id, s.name]), c.sweet)}
         ${sweet.unit ? `<div class="stepper"><button class="btn" data-act="db-qty" data-d="-1" aria-label="Less">${ICON.minus}</button><b><span id="db-q"></span> <small class="note">${esc(sweet.unit)}</small></b><button class="btn" data-act="db-qty" data-d="1" aria-label="More">${ICON.plus}</button></div>` : ""}</div>`}
    ${d.milk !== "none" || d.group === "coffee" ? `<div class="card"><div class="eyebrow">Extras</div>
      <label class="switch">Whipped cream<input type="checkbox" data-act="db-toggle" data-k="whip"${c.whip ? " checked" : ""}></label>
      <label class="switch">Caramel or chocolate drizzle<input type="checkbox" data-act="db-toggle" data-k="drizzle"${c.drizzle ? " checked" : ""}></label>
      ${d.iced ? `<label class="switch">Sweet cream cold foam<input type="checkbox" data-act="db-toggle" data-k="foam"${c.foam ? " checked" : ""}></label>` : ""}
      ${d.group === "coffee" ? `<label class="switch">Extra espresso shot<input type="checkbox" data-act="db-toggle" data-k="shot"${c.shot ? " checked" : ""}></label>` : ""}</div>` : ""}
    <p class="note" id="db-label"></p>
    <div class="row"><button class="btn big" data-act="db-plate">Add to plate</button><button class="btn primary big" data-act="db-log">Log it</button></div>
    <p class="note">Estimated from typical coffee-shop recipes: milk volume for the cup size, about 20 kcal per syrup pump, 16 kcal per teaspoon of sugar. Exact drinks vary by shop and barista.</p>`;
  // redraw in place so the sheet keeps its scroll position
  if (first) openSheet({ title: "Coffee & tea", html: body }); else $("sh-body").innerHTML = body;
  paint();
}
function paint() {
  const n = drinkNutrition(c);
  $("db-k").textContent = n.k; $("db-p").textContent = n.p; $("db-ml").textContent = n.ml;
  if ($("db-q")) $("db-q").textContent = c.sweetQty;
  $("db-label").textContent = drinkLabel(c);
}
const entry = () => {
  // remember the shop for next time
  if (c.brand !== state.profile.lastBrand) { state.profile.lastBrand = c.brand; saveProfile(); }
  const n = drinkNutrition(c);
  return { n: drinkLabel(c), k: n.k, p: n.p, c: n.c, f: n.f, fb: 0, t: n.t, drink: { ...c } };
};

act("db-brand", el => { c.brand = el.dataset.v; const d = drinkById(c.drink); c.size = defaultSize(d, c.brand); if (c.brand === "starbucks" && c.milk === "whole" && typeof d.milk === "number") c.milk = "2pc"; draw(); });
act("db-drink", el => { const keep = { brand: c.brand }; c = { ...defaults(el.dataset.v, c.brand), ...keep }; draw(); });
act("db-size", el => { c.size = Number(el.dataset.v); draw(); });
act("db-milk", el => { c.milk = el.dataset.v; draw(); });
act("db-splash", el => { c.splash = Number(el.dataset.v); draw(); });
act("db-level", el => { c.sugarLevel = Number(el.dataset.v); draw(); });
act("db-sweet", el => { c.sweet = el.dataset.v; if (!c.sweetQty) c.sweetQty = 1; draw(); });
act("db-qty", el => { c.sweetQty = Math.max(1, Math.min(12, (c.sweetQty || 1) + Number(el.dataset.d))); paint(); });
act("db-toggle", el => { c[el.dataset.k] = el.checked; paint(); });
act("db-log", () => { const e = entry(); closeSheet(); cb.onLog(e); });
act("db-plate", () => { const e = entry(); closeSheet(); cb.onPlate(e); });
