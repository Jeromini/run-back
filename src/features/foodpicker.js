// Food picker: search or browse the database, choose a portion and quantity, and the app works
// out calories and protein. Items can go straight into a meal or onto a "plate" so a whole meal
// is logged in one go; plates can be saved as favourite meals.
// Logged entries keep the old shape { id, n, k, p, m } plus { fid, pi, q, u } for database foods.
import { $, act, onInput, openSheet, closeSheet, confirmTap, toast, ICON } from "../lib/dom.js";
import { esc, num } from "../lib/format.js";
import { state, S, day, render } from "../core/state.js";
import { saveDay, saveProfile, sb } from "../core/store.js";
import { FOODS, CATS, foodById, nutrition, searchFoods, onlineFood } from "../domain/foods.js";
import { buzz } from "../lib/sound.js";
import { DRINKS } from "../domain/drinks.js";
import { openDrinkBuilder } from "./drinkbuilder.js";

const uidGen = () => Math.random().toString(36).slice(2, 9);
let ctx = { date: null, meal: "Lunch" }, query = "", cat = "recent", plate = [], showCustom = false, savingPlate = false, pick = null;
// worldwide search state; online foods are kept by id so they can be picked and re-added
let online = { q: "", items: null, loading: false, err: "" }, onlineT = null;
const onlineById = {};
const lookup = id => foodById(id) || onlineById[id] || null;
export const setFoodCtx = c => { ctx = c; };
const fmtQ = q => (q === 0.5 ? "½" : q === 1.5 ? "1½" : q === 2.5 ? "2½" : String(q));

// ---------- recent foods ----------
function recents() {
  const out = [], seen = new Set();
  Object.keys(state.days).sort().reverse().forEach(k => (state.days[k].food || []).slice().reverse().forEach(f => {
    const key = f.fid ? "db:" + f.fid : f.drink ? "d:" + f.n.toLowerCase() : "c:" + f.n.toLowerCase();
    if (!seen.has(key) && out.length < 16) { seen.add(key); out.push(f); }
  }));
  return out;
}

// ---------- the add card ----------
export function pickerHtml() {
  const plateK = plate.reduce((a, x) => a + x.k, 0), plateP = plate.reduce((a, x) => a + x.p, 0);
  const meals = state.profile.meals || [];
  return `<div class="card" id="foodpicker">
    <div class="card-head"><h3>Add to ${esc(ctx.meal)}</h3><button class="linkbtn" data-act="hand-guide">Measuring by hand</button></div>
    ${plate.length ? `<div class="plate"><div class="card-head"><span class="eyebrow">Your plate</span><span class="note">${num(plateK)} kcal &middot; ${Math.round(plateP)} g protein</span></div>
      ${plate.map((x, i) => `<div class="fi${i === 0 ? " first" : ""}"><span class="nm">${esc(x.n)}<small class="note" style="display:block">${esc(x.u ? fmtQ(x.q) + " x " + x.u : "custom")}</small></span><span class="k">${x.k}</span><span class="p">${x.p ? x.p + " g" : ""}</span><button class="x" data-act="plate-del" data-i="${i}" aria-label="Remove ${esc(x.n)}">&times;</button></div>`).join("")}
      <button class="btn primary big" data-act="plate-log">${ICON.tick} Log ${plate.length} item${plate.length > 1 ? "s" : ""} to ${esc(ctx.meal)}</button>
      ${savingPlate ? `<div class="quickw"><input id="plate-name" maxlength="40" placeholder="Name this meal, e.g. My usual breakfast"><button class="btn" data-act="plate-save">Save</button></div>`
        : `<button class="linkbtn" data-act="plate-save-open" style="text-align:center">Save this plate as a favourite meal</button>`}</div>` : ""}
    ${meals.length ? `<div class="eyebrow">Favourite meals</div><div class="favs">${meals.map(m => `<div class="fav"><button class="chip" data-act="meal-log" data-id="${m.id}">${esc(m.name)}<small>${num(m.items.reduce((a, x) => a + x.k, 0))}</small></button><button class="x" data-act="meal-del" data-id="${m.id}" aria-label="Delete ${esc(m.name)}">&times;</button></div>`).join("")}</div>` : ""}
    <div class="search"><span aria-hidden="true">${ICON.search}</span><input id="food-q" data-in="food-q" placeholder="Search foods: egg, rice, chicken wing..." autocomplete="off" value="${esc(query)}"></div>
    <div class="catrow" role="tablist">${[["recent", "Recent"], ...CATS].map(([id, label]) => `<button class="chip${!query && cat === id ? " on" : ""}" data-act="food-cat" data-c="${id}">${esc(label)}</button>`).join("")}</div>
    <div id="food-results" class="results">${resultsHtml()}</div>
    ${showCustom ? customHtml() : `<button class="linkbtn" data-act="custom-open" style="text-align:center">Can't find it? Add a custom food</button>`}
  </div>`;
}
function rowHtml(f) {
  const pt = f.portions[0], n = nutrition(f, 0, 1);
  return `<button class="frow" data-act="food-pick" data-id="${f.id}"><span><b>${esc(f.name)}</b><span class="note">${esc(pt.label)} &middot; ${n.k} kcal &middot; ${n.p} g protein</span></span><i aria-hidden="true">${ICON.plus}</i></button>`;
}
const DRINK_WORDS = /coffee|latte|cappuc|espresso|americano|macchiato|cortado|flat white|mocha|frap|cold brew|iced coffee|chai|matcha|tea|boba|bubble|hot choc|cocoa|starbucks|dunkin|tim hortons|mccaf|costa|pret/i;
const drinkRow = d => `<button class="frow" data-act="drink-build" data-id="${d.id}"><span><b>${esc(d.name)}</b><span class="note">Build it: shop, size, milk, sugar and extras</span></span><i aria-hidden="true" style="background:var(--fast-soft);color:var(--fast)">${ICON.edit}</i></button>`;
function drinkRows(q) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = DRINKS.filter(d => words.some(w => (d.name + " " + d.aliases).toLowerCase().includes(w)));
  return (hits.length ? hits : DRINKS.slice(0, 4)).slice(0, 6).map(drinkRow).join("");
}
function resultsHtml() {
  if (query.trim()) {
    const r = searchFoods(query);
    const drinks = DRINK_WORDS.test(query) ? drinkRows(query) : "";
    return drinks + (r.length ? r.map(rowHtml).join("") : `<p class="note" style="padding:8px 0">No dish called "${esc(query)}" in the built-in list.</p>`) + onlineHtml();
  }
  if (cat === "recent") {
    const r = recents();
    if (!r.length) return `<p class="note" style="padding:8px 0">Foods you log appear here for one-tap re-adding. Search above or pick a category to start.</p>`;
    return r.map((f, i) => `<button class="frow" data-act="recent-pick" data-i="${i}"><span><b>${esc(f.n)}</b><span class="note">${esc(f.drink ? "drink" : f.u ? fmtQ(f.q) + " x " + f.u : "custom")} &middot; ${f.k} kcal${f.p ? " &middot; " + f.p + " g protein" : ""}</span></span><i aria-hidden="true">${ICON.plus}</i></button>`).join("");
  }
  if (cat === "coffee") return `<div class="eyebrow" style="padding-top:6px">Build your drink</div>${DRINKS.map(drinkRow).join("")}<div class="eyebrow" style="padding-top:12px">Popular chain drinks (standard recipe)</div>` + FOODS.filter(f => f.cat === "coffee").map(rowHtml).join("");
  return FOODS.filter(f => f.cat === cat).map(rowHtml).join("");
}
function onlineHtml() {
  const q = query.trim();
  if (q.length < 3) return "";
  let body;
  if (!sb || !S.uid) body = `<p class="note">Sign in to search millions of packaged foods and brands from around the world.</p>`;
  else if (online.loading || online.q !== q) body = `<p class="note">Searching worldwide...</p>`;
  else if (online.err) body = `<p class="note">${esc(online.err)} <button class="linkbtn" data-act="online-retry">Try again</button></p>`;
  else if (!online.items.length) body = `<p class="note">No products found worldwide. Add it as a custom food below.</p>`;
  else body = online.items.map(it => `<button class="frow" data-act="food-pick" data-id="${esc(it.id)}"><span><b>${esc(it.name)}</b><span class="note">${it.brand ? esc(it.brand) + " &middot; " : ""}${it.k} kcal &middot; ${it.p} g protein per 100 g</span></span><i aria-hidden="true">${ICON.plus}</i></button>`).join("");
  return `<div class="online-h"><span class="eyebrow">Worldwide products</span><span class="note">Open Food Facts</span></div>${body}`;
}
async function searchOnline(q) {
  if (!sb || !S.uid || q.length < 3) return;
  online = { q, items: null, loading: true, err: "" };
  try {
    const { data, error } = await sb.functions.invoke("food-search", { body: { q } });
    if (error) throw error;
    if (data.error) throw new Error(data.error);
    data.items.forEach(it => { onlineById[it.id] = onlineFood(it); });
    online = { q, items: data.items, loading: false, err: "" };
  } catch (e) {
    online = { q, items: [], loading: false, err: navigator.onLine ? "Worldwide search didn't respond." : "You're offline. Worldwide search needs a connection." };
  }
  if (query.trim() === q && $("food-results")) $("food-results").innerHTML = resultsHtml();
}
act("online-retry", () => searchOnline(query.trim()));

function customHtml() {
  return `<div class="picker"><div class="card-head"><b>Custom food</b><button class="linkbtn" data-act="custom-close">Close</button></div>
    <div class="addgrid"><label class="f full">Food<input id="f-n" placeholder="e.g. Mum's stew" autocomplete="off" maxlength="80"></label>
      <label class="f">Calories<input id="f-k" type="number" inputmode="numeric" placeholder="kcal"></label>
      <label class="f">Protein (g)<input id="f-p" type="number" inputmode="decimal" placeholder="g"></label></div>
    <div class="row"><button class="btn" data-act="custom-plate">Add to plate</button><button class="btn primary" data-act="custom-log">Log now</button></div></div>`;
}

onInput("food-q", el => {
  query = el.value; clearTimeout(onlineT);
  const q = query.trim();
  if (q.length >= 3 && online.q !== q) onlineT = setTimeout(() => searchOnline(q), 650);
  $("food-results").innerHTML = resultsHtml(); document.querySelectorAll(".catrow .chip").forEach(c => c.classList.toggle("on", !query && c.dataset.c === cat)); });
act("food-cat", el => { cat = el.dataset.c; query = ""; const q = $("food-q"); if (q) q.value = ""; $("food-results").innerHTML = resultsHtml(); document.querySelectorAll(".catrow .chip").forEach(c => c.classList.toggle("on", c.dataset.c === cat)); });

// ---------- logging ----------
function entry(f, pi, q) {
  const n = nutrition(f, pi, q), e = { n: f.name, k: n.k, p: n.p, fid: f.id, pi, q, u: f.portions[pi].label };
  if (f.online) e.src = { k: f.k, p: f.p, portions: f.portions };
  return e;
}
function logItems(items) {
  const d = day(ctx.date); if (!Array.isArray(d.food)) d.food = [];
  items.forEach(x => d.food.push({ ...x, id: uidGen(), m: ctx.meal }));
  saveDay(ctx.date); buzz(20);
}

// ---------- portion sheet ----------
function openPortion(f, pi = 0, q = 1) {
  pick = { f, pi, q };
  openSheet({ title: f.online ? "Worldwide product" : CATS.find(c => c[0] === f.cat)[1], html: `<h1 class="big-title" style="font-size:30px">${esc(f.name)}</h1>
    <div class="portion-total"><div><b id="pp-k"></b><span>kcal</span></div><div><b id="pp-p"></b><span>g protein</span></div><div><b id="pp-g"></b><span>grams</span></div></div>
    <div class="card"><div class="eyebrow">Portion</div><div class="chips" id="pp-por">${f.portions.map((pt, i) => `<button class="chip${i === pi ? " on" : ""}" data-act="pp-por" data-i="${i}">${esc(pt.label)}</button>`).join("")}</div>
      <div class="eyebrow">How many?</div>
      <div class="stepper"><button class="btn" data-act="pp-step" data-d="-0.5" aria-label="Less">${ICON.minus}</button><b id="pp-q"></b><button class="btn" data-act="pp-step" data-d="0.5" aria-label="More">${ICON.plus}</button></div>
      <div class="chips" style="justify-content:center">${[0.5, 1, 1.5, 2, 3].map(v => `<button class="chip" data-act="pp-set" data-v="${v}">${fmtQ(v)}</button>`).join("")}</div></div>
    <div class="row"><button class="btn big" data-act="pp-plate">Add to plate</button><button class="btn primary big" data-act="pp-log">Log to ${esc(ctx.meal)}</button></div>
    <p class="note">${f.online ? `From Open Food Facts, a crowd-sourced database (${f.k} kcal and ${f.p} g protein per 100 g). Check the label if it looks off.` : `Values are typical estimates (${f.k} kcal and ${f.p} g protein per 100 g). Recipes and brands vary.`}</p>` });
  paintPortion();
}
function paintPortion() {
  const n = nutrition(pick.f, pick.pi, pick.q);
  $("pp-k").textContent = num(n.k); $("pp-p").textContent = n.p; $("pp-g").textContent = Math.round(n.g);
  $("pp-q").textContent = fmtQ(pick.q);
  document.querySelectorAll("#pp-por .chip").forEach(c => c.classList.toggle("on", Number(c.dataset.i) === pick.pi));
}
const drinkCallbacks = {
  onLog: e => { logItems([e]); toast(`${e.k} kcal added to ${ctx.meal}`); render(); },
  onPlate: e => { plate.push(e); toast("Added to your plate"); render(); scrollToPicker(); }
};
act("drink-build", el => openDrinkBuilder({ drink: el.dataset.id, brand: state.profile.lastBrand || "home" }, drinkCallbacks));
act("food-pick", el => { const f = lookup(el.dataset.id); if (f) openPortion(f); });
act("recent-pick", el => {
  const f = recents()[Number(el.dataset.i)];
  if (f.drink) { openDrinkBuilder(f.drink, drinkCallbacks); return; }
  if (f.fid && !foodById(f.fid) && f.src) onlineById[f.fid] = { id: f.fid, name: f.n, cat: "online", k: f.src.k, p: f.src.p, portions: f.src.portions, aliases: "", online: true };
  if (f.fid && lookup(f.fid)) { openPortion(lookup(f.fid), f.pi || 0, f.q || 1); return; }
  logItems([{ n: f.n, k: f.k, p: f.p }]); toast(f.n + " added to " + ctx.meal); render();
});
act("pp-por", el => { pick.pi = Number(el.dataset.i); paintPortion(); });
act("pp-step", el => { pick.q = Math.max(0.5, Math.min(20, pick.q + Number(el.dataset.d))); paintPortion(); });
act("pp-set", el => { pick.q = Number(el.dataset.v); paintPortion(); });
act("pp-log", () => { const e = entry(pick.f, pick.pi, pick.q); logItems([e]); closeSheet(); toast(`${e.n}: ${e.k} kcal added to ${ctx.meal}`); render(); });
act("pp-plate", () => { plate.push(entry(pick.f, pick.pi, pick.q)); closeSheet(); toast("Added to your plate"); render(); scrollToPicker(); });
const scrollToPicker = () => setTimeout(() => { const el = $("foodpicker"); if (el) el.scrollIntoView({ block: "start", behavior: "smooth" }); }, 30);

// ---------- plate & favourite meals ----------
act("plate-del", el => { plate.splice(Number(el.dataset.i), 1); render(); });
act("plate-log", () => { const n = plate.length, k = plate.reduce((a, x) => a + x.k, 0); logItems(plate); plate = []; savingPlate = false; toast(`${n} items, ${num(k)} kcal added to ${ctx.meal}`); render(); });
act("plate-save-open", () => { savingPlate = true; render(); setTimeout(() => $("plate-name") && $("plate-name").focus(), 30); });
act("plate-save", () => {
  const name = ($("plate-name").value || "").trim(); if (!name) { toast("Give the meal a name"); return; }
  state.profile.meals = [...(state.profile.meals || []), { id: uidGen(), name, items: plate.map(x => ({ ...x })) }];
  saveProfile(); savingPlate = false; toast(`Saved "${name}". Tap it any time to log it.`); render();
});
act("meal-log", el => {
  const m = (state.profile.meals || []).find(x => x.id === el.dataset.id); if (!m) return;
  logItems(m.items.map(x => ({ ...x }))); toast(`${m.name}: ${num(m.items.reduce((a, x) => a + x.k, 0))} kcal added to ${ctx.meal}`); render();
});
act("meal-del", el => {
  if (!confirmTap("meal" + el.dataset.id, el, "?")) return;
  state.profile.meals = (state.profile.meals || []).filter(x => x.id !== el.dataset.id); saveProfile(); render();
});

// ---------- custom foods ----------
function customItem() {
  const n = ($("f-n").value || "").trim(); if (!n) { toast("Name the food"); $("f-n").focus(); return null; }
  return { n, k: Math.round(Number($("f-k").value)) || 0, p: Math.round((Number($("f-p").value) || 0) * 10) / 10 };
}
act("custom-open", () => { showCustom = true; render(); setTimeout(() => $("f-n") && $("f-n").focus(), 30); });
act("custom-close", () => { showCustom = false; render(); });
act("custom-plate", () => { const x = customItem(); if (!x) return; plate.push(x); showCustom = false; toast("Added to your plate"); render(); });
act("custom-log", () => { const x = customItem(); if (!x) return; logItems([x]); showCustom = false; toast(x.n + " added to " + ctx.meal); render(); });

// ---------- hand guide ----------
act("hand-guide", () => openSheet({ title: "Measuring by hand", html: `<h1 class="big-title">No scales needed</h1>
  <p class="note">Your hand is a built-in measuring tool, and it scales with your body size. These are the portions the food list uses.</p>
  <div class="guides">${[["Fist", "About 1 cup", "Rice, pasta, cereal, mashed potato, vegetables"], ["Palm", "About 100 g (3.5 oz) cooked", "Chicken, fish, steak, pork. Palm size and thickness, no fingers"],
    ["Cupped hand", "About 1/2 cup", "Beans, oats, fruit, nuts (a small handful is about 1 oz)"], ["Thumb", "About 1 tablespoon", "Oil, butter, peanut butter, dressing, mayonnaise"]]
    .map(([t, a, b]) => `<div class="guide" style="cursor:default"><span class="art accent" style="font-family:var(--display);font-weight:800;font-size:15px">${t}</span><div><b>${a}</b><span>${b}</span></div><span></span></div>`).join("")}</div>
  <div class="card"><p class="note">A typical plate for fat loss: 1-2 palms of protein, 1-2 fists of vegetables, 1 cupped hand of carbs (more on training days), and 1 thumb of fat.</p></div>` }));
