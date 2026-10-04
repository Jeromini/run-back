// Diet: pick an eating pattern (keto, no carb, Mediterranean, vegan...), see how today fits it,
// and a day, week and month report of how well you've kept it. Lives inside the Diet tab.
import { act, openSheet, closeSheet, toast, segHtml, ICON } from "../lib/dom.js";
import { esc, num } from "../lib/format.js";
import { iso, parse, addDays, today, nice, DOW, MON } from "../lib/dates.js";
import { ring, barChart } from "../lib/charts.js";
import { state, render } from "../core/state.js";
import { saveProfile } from "../core/store.js";
import { FAMILIES, DIETS, dietById, carbCap, dayCompliance, dietReport, itemReason } from "../domain/diets.js";
import { foodById, nutrition } from "../domain/foods.js";
import { TAGS } from "../domain/macros.js";
import { DIET_INFO, CHECK_HELP } from "../domain/dietinfo.js";

const STATUS = { kept: ["On plan", "good"], close: ["Nearly", "warn"], off: ["Off plan", "bad"], empty: ["Nothing logged", ""] };
let period = "W";
// short label for tabs: "No carb (carnivore style)" reads "No carb"
export const shortName = d => d.name.replace(/\s*\(.*\)$/, "");
export const myDiet = () => { const d = state.profile.diet; return d && d.id ? { diet: dietById(d.id), opts: d } : null; };
const ctx = () => ({ kcalTarget: state.profile.kcalTarget, proteinTarget: state.profile.proteinTarget });
// Meals logged before carbs were tracked: fill carbs, fat, fibre and tags from the food database.
const enrich = e => {
  if (e.c != null && e.t) return e;
  const f = e.fid && foodById(e.fid);
  if (!f) return e;
  const n = nutrition(f, e.pi || 0, e.q || 1);
  return { ...e, ...(e.c == null && n.c != null ? { c: n.c, f: n.f, fb: n.fb } : {}), t: e.t || TAGS[e.fid] || [] };
};
const foodsOn = date => ((state.days[date] || {}).food || []).map(enrich);
const enrichedDays = () => new Proxy(state.days, { get: (o, k) => (o[k] && o[k].food ? { ...o[k], food: o[k].food.map(enrich) } : o[k]) });
export const dayStatus = date => { const m = myDiet(); return m && m.diet ? dayCompliance(m.diet, m.opts, foodsOn(date), ctx()) : null; };
export const entryFlag = e => { const m = myDiet(); return m && m.diet ? itemReason(m.diet, m.opts, enrich(e)) : null; };

// ---------- picker ----------
function pickerHtml(current) {
  return FAMILIES.map(([f, label]) => `<h2 class="sect">${esc(label)}</h2><div class="dcards">${DIETS.filter(d => d.fam === f).map(d =>
    `<button class="dcard${current === d.id ? " on" : ""}" data-act="diet-info" data-id="${d.id}"><b>${esc(d.name)}</b><small>${esc(d.blurb)}</small>${carbCap(d, {}) != null ? `<span class="pill">${carbCap(d, {})} g net carbs</span>` : ""}</button>`).join("")}</div>`).join("");
}
export function openDietPicker() {
  const m = myDiet();
  openSheet({ title: "Diet", html: `<h1 class="big-title">Choose your diet</h1>
    <p class="note">Tap a diet to see how it works, what to eat and an example day. Once you follow one, every meal you log is checked against it and the report shows how well you keep it.</p>
    ${pickerHtml(m && m.diet && m.diet.id)}
    ${m ? `<button class="btn ghost" data-act="diet-off">Stop tracking a diet</button>` : ""}
    <p class="note">A tracking aid, not medical advice. Talk to your doctor before a very low carb or restrictive diet if you have diabetes, kidney disease, are pregnant or take medication.</p>` });
}
act("diet-open", openDietPicker);

// The rules as short chips, worded from the diet's actual checks.
function ruleChips(diet, opts) {
  const L = diet.limits, cap = carbCap(diet, opts), out = [];
  if (cap != null) out.push(`Net carbs under ${cap} g a day`);
  if (L.fatPct && L.fatPct[0]) out.push(`Fat at least ${L.fatPct[0]}% of calories`);
  if (L.fatPct && !L.fatPct[0]) out.push(`Fat under ${L.fatPct[1]}% of calories`);
  if (L.carbPct) out.push(`Carbs ${L.carbPct[0]} to ${L.carbPct[1]}%, protein ${L.proteinPct[0]} to ${L.proteinPct[1]}%, fat ${L.fatPct[0]} to ${L.fatPct[1]}%`);
  if (L.protein) out.push("Protein reaches your daily target");
  if (L.kcal) out.push("Calories within your daily target");
  if (diet.favour) out.push(`At least ${diet.favourMin} core food groups a day`);
  if (diet.cap) Object.entries(diet.cap).forEach(([g, n]) => out.push(g === "meatAny" ? `Meat or poultry at most ${n} a day` : n === 0 ? `No ${g === "processed" ? "processed meat or food" : g}` : `${g === "meat" ? "Red meat" : g === "sugar" ? "Sugary items" : g} at most ${n} a day`));
  if ((diet.avoid || []).length) out.push("Flags " + diet.avoid.map(t => ({ grain: "grains", legume: "beans", starch: "starchy food", sugar: "added sugar", sweetened: "sugary drinks", processed: "processed food", meat: "red meat", shellfish: "shellfish" }[t] || t)).filter((v, i, a) => a.indexOf(v) === i).join(", "));
  return out;
}
function exampleDay(diet, day) {
  const rows = day.map(([m, id, pi, q]) => { const f = foodById(id); const n = nutrition(f, pi, q); return { m, f, q, label: f.portions[pi].label, e: { n: f.name, k: n.k, p: n.p, c: n.c, f: n.f, fb: n.fb, t: f.t } }; });
  const r = dayCompliance(diet, {}, rows.map(x => x.e), { kcalTarget: state.profile.kcalTarget || 2000, proteinTarget: state.profile.proteinTarget || 120 });
  const meals = [...new Set(rows.map(x => x.m))];
  const showNet = carbCap(diet, {}) != null;
  return `<div class="dday">${meals.map(m => `<div class="dmeal"><b>${m}</b>${rows.filter(x => x.m === m).map(x => `<div class="drow"><span>${esc(x.f.name)}<small>${x.q === 1 ? "" : x.q + " x "}${esc(x.label)}</small></span><em>${showNet ? Math.max(0, Math.round((x.e.c - x.e.fb) * 10) / 10) + " g net" : num(x.e.k) + " kcal"}</em></div>`).join("")}</div>`).join("")}
    <div class="dtot"><span>Day total</span><b>${num(r.totals.k)} kcal &middot; ${Math.round(r.totals.p)} g protein &middot; ${Math.round(r.totals.net)} g net carbs &middot; ${Math.round(r.totals.f)} g fat</b></div>
    <div class="dfit ${r.status === "kept" ? "ok" : "no"}">${r.status === "kept" ? ICON.tick : ICON.close}<span>${r.status === "kept" ? `Checked by the app: this day keeps ${esc(shortName(diet))}` : "This day doesn't fully keep the diet with your targets"}</span></div></div>`;
}
export function openDietInfo(id) {
  const diet = dietById(id), g = DIET_INFO[id], m = myDiet(), following = m && m.diet && m.diet.id === id;
  const list = (cls, icon, items) => `<ul class="dlist ${cls}">${items.map(x => `<li><i>${icon}</i><span>${esc(x)}</span></li>`).join("")}</ul>`;
  openSheet({ title: shortName(diet), html: `<h1 class="big-title">${esc(diet.name)}</h1>
    <p class="dlead">${esc(g.what)}</p>
    <div class="card"><h3>How the app checks it</h3><p class="note">${esc(g.how)}</p><div class="chips">${ruleChips(diet, following ? m.opts : {}).map(t => `<span class="pill">${esc(t)}</span>`).join("")}</div></div>
    <div class="card"><h3>What to eat</h3>
      <div class="dgroup"><span class="eyebrow">Eat freely</span>${list("ok", ICON.tick, g.eat)}</div>
      <div class="dgroup"><span class="eyebrow">Go easy on</span>${list("mid", ICON.minus, g.limit)}</div>
      <div class="dgroup"><span class="eyebrow">Avoid</span>${list("no", ICON.close, g.avoid)}</div></div>
    <div class="card"><h3>An example day</h3><p class="note">Real foods from the app, so you can log the same day yourself.</p>${exampleDay(diet, g.day)}</div>
    <div class="card"><h3>Good for</h3><p class="note">${esc(g.suits)}</p><h3>Take care</h3><p class="note">${esc(g.careful)}</p><h3>What the research says</h3><p class="note">${esc(g.evidence)}</p></div>
    ${following ? `<button class="btn big" data-act="sheet-close">Back</button>` : `<button class="btn primary big" data-act="diet-pick" data-id="${id}">Follow ${esc(shortName(diet))}</button>`}
    <p class="note">General guidance, not medical advice.</p>` });
}
act("diet-info", el => openDietInfo(el.dataset.id));
act("diet-guide", () => { const m = myDiet(); if (m && m.diet) openDietInfo(m.diet.id); });
act("diet-pick", el => {
  const prev = state.profile.diet, same = prev && prev.id === el.dataset.id;
  state.profile.diet = same ? prev : { id: el.dataset.id, since: today() };
  saveProfile(); closeSheet(); closeSheet(); state.dietTab = "plan"; toast("Now following " + shortName(dietById(el.dataset.id))); render(); window.scrollTo(0, 0);
});
act("diet-off", () => { state.profile.diet = null; saveProfile(); closeSheet(); toast("Diet tracking off"); render(); });
act("diet-carb", el => {
  const d = state.profile.diet, diet = dietById(d.id), [lo, hi] = diet.adjust || [10, 200];
  d.carbLimit = Math.max(lo, Math.min(hi, (d.carbLimit || diet.limits.netCarbs) + Number(el.dataset.d))); saveProfile(); render();
});
act("diet-phase", (el, ev) => { const b = ev.target.closest("button"); if (!b) return; state.profile.diet.phase = Number(b.dataset.v); saveProfile(); render(); });
act("diet-period", (el, ev) => { const b = ev.target.closest("button"); if (b) { period = b.dataset.v; render(); } });

// ---------- today against the diet ----------
const macroBar = (label, g, pct, color) => `<div class="dmac"><div class="card-head"><span>${label}</span><b>${num(g)} g <small>${pct}%</small></b></div><div class="minibar"><i style="width:${Math.min(100, pct)}%;background:${color}"></i></div></div>`;

export function planPanel(date) {
  const m = myDiet();
  if (!m || !m.diet) return `<div class="card dintro"><h3>Track a diet</h3>
      <p class="note">Keto, no carb, low carb, Atkins, Mediterranean, vegan, paleo and more. Choose one and every meal is checked against it, with a daily score and a monthly report.</p>
      <button class="btn primary big" data-act="diet-open">Choose a diet</button></div>`;
  const { diet, opts } = m, r = dayCompliance(diet, opts, foodsOn(date), ctx()), t = r.totals, cap = carbCap(diet, opts);
  const kc = Math.max(1, t.c * 4 + t.p * 4 + t.f * 9), [lbl, tone] = STATUS[r.status];
  const center = cap != null
    ? ring(t.net / cap, { size: 150, stroke: 13, color: t.net > cap ? "var(--bad)" : "var(--accent)", inner: `<span class="k">${Math.abs(Math.round(cap - t.net))}</span><span class="u">${t.net > cap ? "g over" : "g net carbs left"}</span>` })
    : ring(r.score, { size: 150, stroke: 13, color: r.status === "kept" ? "var(--good)" : "var(--accent)", inner: `<span class="k">${r.status === "empty" ? "-" : Math.round(r.score * 100) + "%"}</span><span class="u">on plan</span>` });
  const week = Array.from({ length: 7 }, (_, i) => iso(addDays(parse(date), i - 6)));
  return `<div class="card dhero">
      <div class="card-head"><div><h3>${esc(diet.name)}</h3><span class="note">${date === today() ? "Today" : esc(nice(date))}</span></div><span class="pill ${tone}">${lbl}</span></div>
      <div class="dring">${center}</div>
      ${cap != null ? `<p class="note" style="text-align:center">${Math.round(t.net)} of ${cap} g net carbs (carbs minus fibre)${t.est ? ". Some items are estimates." : ""}</p>` : ""}
      ${macroBar("Carbs", t.c, Math.round(t.c * 4 / kc * 100), "var(--fast)")}${macroBar("Protein", t.p, Math.round(t.p * 4 / kc * 100), "var(--rose)")}${macroBar("Fat", t.f, Math.round(t.f * 9 / kc * 100), "var(--violet)")}
      <div class="dweek">${week.map(k => { const s = dayStatus(k); return `<div class="${s && s.status !== "empty" ? s.status : "nolog"}${k === date ? " sel" : ""}"><i></i><small>${DOW[parse(k).getDay()].slice(0, 1)}</small></div>`; }).join("")}</div>
    </div>
    ${r.checks.length ? `<div class="card"><div class="card-head"><h3>Today's checks</h3><button class="linkbtn" data-act="diet-guide">How ${esc(shortName(diet))} works</button></div><p class="note">The day counts as on plan when every check passes, nearly when most do. Tap a check to see what it means.</p><div class="dchecks">${r.checks.map(c => `<details class="dcheck ${c.ok ? "ok" : "no"}"><summary><i>${c.ok ? ICON.tick : ICON.close}</i><span>${esc(c.label)}</span><b>${c.dir === "all" ? `${c.value} of ${c.target}` : `${num(c.value)}${c.unit === "%" ? "%" : c.unit ? " " + c.unit : ""} <small>${c.dir === "max" ? "max " : c.dir === "min" ? "min " : ""}${c.target}${c.unit === "%" ? "%" : c.unit ? " " + c.unit : ""}</small>`}</b></summary><p>${esc(CHECK_HELP[c.id] || CHECK_HELP[c.id.split("-")[0]] || "")}${c.detail ? " Today: " + esc(c.detail.join(", ")) + "." : ""}</p></details>`).join("")}</div></div>` : ""}
    ${r.breaks.length ? `<div class="card"><h3>Off plan today</h3><div class="list">${r.breaks.map(b => `<div class="li"><div><div class="a">${esc(b.name)}</div><div class="b">${esc(b.reason)}</div></div></div>`).join("")}</div></div>` : ""}
    ${r.status === "empty" ? `<div class="card empty"><b>Nothing logged ${date === today() ? "today" : "this day"}</b>Log your meals in Food and they're checked against ${esc(diet.name)} as you go.<button class="btn primary" style="margin-top:12px" data-act="diet-tab" data-v="log">Log food</button></div>` : ""}
    <div class="card"><h3>Settings</h3>
      ${diet.adjust ? `<div class="card-head"><span>Daily net carb limit</span><div class="stepper"><button data-act="diet-carb" data-d="-5" aria-label="Lower">${ICON.minus}</button><b>${cap}</b><span>g</span><button data-act="diet-carb" data-d="5" aria-label="Higher">${ICON.plus}</button></div></div>` : ""}
      ${diet.phases ? `<label class="f">Phase${segHtml("diet-ph", diet.phases.map((p, i) => [i, p[0].split(":")[0]]), opts.phase || 0, 'data-act="diet-phase"')}</label><p class="note">${esc(diet.phases[opts.phase || 0][0])}: up to ${cap} g net carbs a day.</p>` : ""}
      <p class="note">${esc(diet.blurb)} Following since ${esc(nice(opts.since || today()))}.</p>
      <div class="row"><button class="btn" style="flex:1" data-act="diet-guide">How it works</button><button class="btn" style="flex:1" data-act="diet-open">Change diet</button></div></div>`;
}

// ---------- report ----------
export function reportPanel() {
  const m = myDiet();
  if (!m || !m.diet) return planPanel(today());
  const { diet, opts } = m, t = today(), n = period === "D" ? 1 : period === "W" ? 7 : period === "M" ? 30 : 90;
  const from = iso(addDays(parse(t), -(n - 1))), r = dietReport(diet, opts, enrichedDays(), from, t, ctx()), cap = carbCap(diet, opts);
  const pct = Math.round(r.adherence * 100);
  const chartDays = r.days.slice(-Math.min(n, 30));
  const chart = barChart({ labels: chartDays.map(x => n <= 7 ? DOW[parse(x.date).getDay()].slice(0, 2) : String(parse(x.date).getDate())), values: chartDays.map(x => cap != null ? x.totals.net : x.totals.k),
    target: cap != null ? cap : state.profile.kcalTarget || null, targetLabel: cap != null ? cap + " g limit" : state.profile.kcalTarget ? "target" : "", color: cap != null ? "var(--fast)" : "var(--rose)", fmt: v => num(v) });
  // a month calendar of statuses
  const mStart = new Date(parse(t).getFullYear(), parse(t).getMonth(), 1), lead = (mStart.getDay() + 6) % 7;
  const dim = new Date(mStart.getFullYear(), mStart.getMonth() + 1, 0).getDate();
  const cal = Array.from({ length: lead }, () => `<span></span>`).join("") + Array.from({ length: dim }, (_, i) => {
    const k = iso(new Date(mStart.getFullYear(), mStart.getMonth(), i + 1)), s = k <= t ? dayStatus(k) : null;
    return `<span class="${s ? (s.status === "empty" ? "nolog" : s.status) : "fut"}${k === t ? " today" : ""}">${i + 1}</span>`;
  }).join("");
  return `<div class="card">
      ${segHtml("diet-per", [["W", "Week"], ["M", "Month"], ["Q", "3 months"]], period, 'data-act="diet-period"')}
      <div class="drep">${ring(r.adherence, { size: 112, stroke: 11, color: "var(--good)", inner: `<span class="k">${r.logged ? pct + "%" : "-"}</span><span class="u">on plan</span>` })}
        <div class="drep-s"><div><b>${r.kept}</b><span>of ${r.logged} logged days on plan</span></div><div><b>${r.streak}</b><span>day streak, best ${r.best}</span></div></div></div>
    </div>
    <div class="card"><div class="card-head"><h3>${MON[mStart.getMonth()]} at a glance</h3><span class="note">${esc(shortName(diet))}</span></div>
      <div class="dcal">${["M", "T", "W", "T", "F", "S", "S"].map(d => `<small>${d}</small>`).join("")}${cal}</div>
      <div class="row note jlegend"><span><i style="background:var(--good)"></i>On plan</span><span><i style="background:var(--warn)"></i>Nearly</span><span><i style="background:var(--bad)"></i>Off plan</span></div></div>
    <div class="card"><div class="card-head"><h3>${cap != null ? "Net carbs per day" : "Calories per day"}</h3><span class="note">last ${chartDays.length} days</span></div>${chart}</div>
    <div class="card"><h3>Daily average</h3><div class="stats four">
      <div class="stat"><b>${num(r.avg.k)}</b><span>kcal</span></div><div class="stat"><b>${num(r.avg.net)} g</b><span>net carbs</span></div>
      <div class="stat"><b>${num(r.avg.p)} g</b><span>protein</span></div><div class="stat"><b>${num(r.avg.f)} g</b><span>fat</span></div></div>
      <p class="note">Averages cover the ${r.logged} day${r.logged === 1 ? "" : "s"} with food logged. Days with nothing logged don't count for or against you.</p></div>
    ${r.breakers.length ? `<div class="card"><h3>What most often broke it</h3><div class="list">${r.breakers.map(([nm, c]) => `<div class="li"><div><div class="a">${esc(nm)}</div></div><span class="v">${c} day${c === 1 ? "" : "s"}</span></div>`).join("")}</div>
      <p class="note">Swapping these is the quickest way to raise your score.</p></div>` : ""}`;
}
