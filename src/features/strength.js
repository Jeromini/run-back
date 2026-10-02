// Strength editor. day.strength = [{ id, name, cue?, sets: [{ r, w, done }] }].
// Any day can have one; Fri/Mon start from the plan's five moves (saved on first edit).
import { $, act, onInput, toast, confirmTap, ICON } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { state, day } from "../core/state.js";
import { saveDay } from "../core/store.js";
import { LIFTS, sessionFor } from "../domain/plan.js";
import { setCounts } from "../domain/metrics.js";
import { buzz } from "../lib/sound.js";

// [name, default reps, group]
const LIBRARY = [
  // legs
  ["Squat", 10, "Legs"], ["Goblet squat", 10, "Legs"], ["Sit-to-stand", 12, "Legs"], ["Lunge", 10, "Legs"], ["Bulgarian split squat", 10, "Legs"], ["Step-up", 10, "Legs"],
  ["Leg press (machine)", 12, "Legs"], ["Hack squat (machine)", 10, "Legs"], ["Smith machine squat", 10, "Legs"], ["Pendulum squat (machine)", 10, "Legs"],
  ["Leg extension (machine)", 12, "Legs"], ["Seated leg curl (machine)", 12, "Legs"], ["Lying leg curl (machine)", 12, "Legs"],
  ["Romanian deadlift", 10, "Legs"], ["Deadlift", 6, "Legs"], ["Trap bar deadlift", 8, "Legs"], ["Hip hinge (good morning)", 10, "Legs"],
  ["Hip thrust", 10, "Legs"], ["Hip thrust (machine)", 12, "Legs"], ["Glute bridge", 12, "Legs"], ["Glute kickback (machine or cable)", 12, "Legs"],
  ["Hip abduction (machine)", 15, "Legs"], ["Hip adduction (machine)", 15, "Legs"],
  ["Calf raises", 15, "Legs"], ["Single-leg calf raise", 12, "Legs"], ["Standing calf raise (machine)", 12, "Legs"], ["Seated calf raise (machine)", 15, "Legs"],
  // chest
  ["Push-up", 10, "Chest"], ["Incline push-up", 12, "Chest"], ["Bench press", 10, "Chest"], ["Incline bench press", 10, "Chest"], ["Dumbbell bench press", 10, "Chest"],
  ["Chest press (machine)", 12, "Chest"], ["Incline chest press (machine)", 12, "Chest"], ["Pec deck / chest fly (machine)", 12, "Chest"], ["Cable crossover / cable fly", 12, "Chest"],
  ["Dips", 10, "Chest"], ["Assisted dip (machine)", 10, "Chest"],
  // back
  ["Pull-up", 6, "Back"], ["Assisted pull-up (machine)", 8, "Back"], ["Chin-up", 6, "Back"], ["Lat pulldown", 10, "Back"], ["Close-grip lat pulldown", 10, "Back"],
  ["Seated cable row", 10, "Back"], ["Seated row (machine)", 12, "Back"], ["Chest-supported row (machine / T-bar)", 10, "Back"], ["Dumbbell row", 10, "Back"],
  ["Barbell row", 8, "Back"], ["Band row", 12, "Back"], ["TRX row", 12, "Back"], ["Straight-arm pulldown (cable)", 12, "Back"], ["Back extension (hyperextension)", 12, "Back"],
  // shoulders & arms
  ["Overhead press", 8, "Shoulders & arms"], ["Dumbbell shoulder press", 10, "Shoulders & arms"], ["Shoulder press (machine)", 12, "Shoulders & arms"],
  ["Lateral raise", 12, "Shoulders & arms"], ["Lateral raise (machine or cable)", 12, "Shoulders & arms"], ["Rear delt fly (reverse pec deck)", 12, "Shoulders & arms"], ["Face pull (cable)", 15, "Shoulders & arms"],
  ["Shrugs", 12, "Shoulders & arms"], ["Bicep curl", 12, "Shoulders & arms"], ["Hammer curl", 12, "Shoulders & arms"], ["Cable curl", 12, "Shoulders & arms"], ["Preacher curl (machine)", 12, "Shoulders & arms"],
  ["Tricep extension", 12, "Shoulders & arms"], ["Tricep pushdown (cable)", 12, "Shoulders & arms"], ["Overhead tricep extension (cable)", 12, "Shoulders & arms"], ["Tricep dip (machine)", 12, "Shoulders & arms"],
  // core
  ["Plank (seconds)", 30, "Core"], ["Side plank (seconds)", 20, "Core"], ["Dead bug", 10, "Core"], ["Bird dog", 10, "Core"],
  ["Ab crunch (machine)", 15, "Core"], ["Cable crunch", 15, "Core"], ["Hanging knee raise", 10, "Core"], ["Captain's chair leg raise", 10, "Core"],
  ["Rotary torso (machine)", 12, "Core"], ["Pallof press (cable)", 10, "Core"], ["Russian twist", 20, "Core"], ["Ab wheel rollout", 8, "Core"],
  // full body & functional
  ["Kettlebell swing", 15, "Full body"], ["Farmer's carry (metres)", 40, "Full body"], ["Thruster", 10, "Full body"], ["Burpee", 10, "Full body"],
  ["Wall ball", 15, "Full body"], ["Medicine ball slam", 12, "Full body"], ["Box jump", 8, "Full body"], ["Cable woodchop", 12, "Full body"], ["Landmine press", 10, "Full body"]
];
const uidGen = () => Math.random().toString(36).slice(2, 9);
let pickerOpen = false, onChangeCb = () => {};

function planTemplate(d) {
  const legacy = (d && d.lifts) || {};
  return LIFTS.map(([k, name, cue]) => ({ id: uidGen(), name, cue, sets: [0, 1].map(i => ({ r: /15/.test(cue) ? 15 : 10, w: "", done: (legacy[k] || 0) > i })) }));
}
const items = () => day(state.sel).strength;

export function strengthCard(onChange) {
  onChangeCb = onChange || (() => {});
  const s = sessionFor(state.sel, state.profile), d = state.days[state.sel], planned = s.kind === "cross";
  let list = d && d.strength;
  if (!list && planned) { list = planTemplate(d); day(state.sel).strength = list; }
  const u = state.profile.unit;
  if (!list || !list.length) {
    return `<div class="card" id="liftcard"><div class="card-head"><h3>Strength</h3></div>
      <p class="note">${planned ? "No exercises yet." : "Not on the plan today, but you can add a strength workout any day."}</p>
      <button class="btn" data-act="ex-add">${ICON.plus} Add exercise</button>${pickerHtml()}</div>`;
  }
  const [n, t] = setCounts(list);
  return `<div class="card" id="liftcard"><div class="card-head"><h3>Strength${planned ? ` <span class="note">&middot; plan</span>` : ""}</h3><span class="pill ${n && n === t ? "good" : ""}">${n}/${t} sets</span></div>
    ${list.map((x, i) => `<div class="ex${i === 0 ? " first" : ""}">
      <div class="ex-head"><input class="ex-name" value="${esc(x.name)}" aria-label="Exercise name" maxlength="60" data-in="ex-name" data-x="${i}">
        <button class="iconbtn sm" data-act="ex-del" data-x="${i}" aria-label="Delete exercise">${ICON.trash}</button></div>
      ${x.cue ? `<p class="note" style="margin-top:-6px;padding-inline:8px">${esc(x.cue)}</p>` : ""}
      <div class="setgrid"><span class="h">Set</span><span class="h">Reps</span><span class="h">${u}</span><span class="h">Done</span><span></span>
      ${(x.sets || []).map((st, j) => `<span class="n">${j + 1}</span>
        <input class="${st.done ? "dn" : ""}" type="number" inputmode="numeric" value="${esc(st.r)}" placeholder="reps" aria-label="Set ${j + 1} reps" data-in="set-r" data-x="${i}" data-s="${j}">
        <input class="${st.done ? "dn" : ""}" type="number" inputmode="decimal" step="0.5" value="${esc(st.w)}" placeholder="-" aria-label="Set ${j + 1} weight" data-in="set-w" data-x="${i}" data-s="${j}">
        <button class="tick${st.done ? " on" : ""}" data-act="set-done" data-x="${i}" data-s="${j}" aria-label="Set ${j + 1} done" aria-pressed="${!!st.done}">${ICON.tick}</button>
        <button class="x" data-act="set-del" data-x="${i}" data-s="${j}" aria-label="Remove set ${j + 1}">&times;</button>`).join("")}</div>
      <button class="linkbtn" data-act="set-add" data-x="${i}">+ Add set</button></div>`).join("")}
    <button class="btn" data-act="ex-add">${ICON.plus} Add exercise</button>${pickerHtml()}</div>`;
}
const pickerHtml = () => `<div class="picker" id="picker"${pickerOpen ? "" : " hidden"}><input id="pk-q" placeholder="Search or type a new exercise" autocomplete="off" data-in="pk-q"><div class="chips" id="pk-list"></div></div>`;

function fillPicker() {
  const q = ($("pk-q").value || "").trim(), ql = q.toLowerCase(), used = new Set();
  Object.values(state.days).forEach(d => (d.strength || []).forEach(x => used.add(x.name)));
  const lib = LIBRARY.map(l => l[0]), custom = [...used].filter(n => !lib.includes(n));
  const all = [...custom, ...lib].filter(n => !ql || n.toLowerCase().includes(ql));
  const chip = n => `<button class="chip" data-act="ex-pick" data-n="${esc(n)}">${esc(n)}</button>`;
  let h = q && !all.some(n => n.toLowerCase() === ql) ? `<button class="chip add" data-act="ex-pick" data-n="${esc(q)}">+ Add "${esc(q)}"</button>` : "";
  if (q) h += all.slice(0, 40).map(chip).join("");
  else {
    if (custom.length) h += `<div class="eyebrow" style="width:100%">Yours</div>` + custom.map(chip).join("");
    [...new Set(LIBRARY.map(l => l[2]))].forEach(g => { h += `<div class="eyebrow" style="width:100%;margin-top:6px">${esc(g)}</div>` + LIBRARY.filter(l => l[2] === g).map(l => chip(l[0])).join(""); });
  }
  $("pk-list").innerHTML = h || `<p class="note">Type a name to add your own exercise.</p>`;
}
export function afterRender() { if (pickerOpen && $("pk-q")) fillPicker(); }

function lastSetsFor(name) {
  // reuse what you did last time for this exercise
  const dates = Object.keys(state.days).filter(k => k !== state.sel).sort().reverse();
  for (const k of dates) { const x = (state.days[k].strength || []).find(e => e.name === name); if (x && x.sets && x.sets.length) return x.sets.map(s => ({ r: s.r, w: s.w, done: false })); }
  const lib = LIBRARY.find(l => l[0] === name);
  return [0, 1].map(() => ({ r: lib ? lib[1] : 10, w: "", done: false }));
}
const changed = (rerender = true) => { saveDay(state.sel); if (rerender) onChangeCb(); };

act("ex-add", () => { pickerOpen = !pickerOpen; $("picker").hidden = !pickerOpen; if (pickerOpen) { fillPicker(); $("pk-q").focus(); } });
onInput("pk-q", fillPicker);
act("ex-pick", el => {
  const d = day(state.sel); if (!Array.isArray(d.strength)) d.strength = [];
  d.strength.push({ id: uidGen(), name: el.dataset.n, sets: lastSetsFor(el.dataset.n) });
  pickerOpen = false; changed(); toast(el.dataset.n + " added");
});
onInput("ex-name", el => { items()[+el.dataset.x].name = el.value; changed(false); });
onInput("set-r", el => { items()[+el.dataset.x].sets[+el.dataset.s].r = el.value === "" ? "" : Number(el.value); changed(false); });
onInput("set-w", el => { items()[+el.dataset.x].sets[+el.dataset.s].w = el.value === "" ? "" : Number(el.value); changed(false); });
act("set-done", el => {
  const st = items()[+el.dataset.x].sets[+el.dataset.s]; st.done = !st.done;
  if (st.done) buzz(25);
  changed();
  const [n, t] = setCounts(items());
  if (st.done && n === t) { buzz([30, 40, 30]); toast("Strength workout done"); }
});
act("set-del", el => { items()[+el.dataset.x].sets.splice(+el.dataset.s, 1); changed(); });
act("set-add", el => { const ss = items()[+el.dataset.x].sets, last = ss[ss.length - 1]; ss.push({ r: last ? last.r : 10, w: last ? last.w : "", done: false }); changed(); });
act("ex-del", el => {
  if (!confirmTap("ex" + state.sel + el.dataset.x, el, "?")) return;
  items().splice(+el.dataset.x, 1); changed(); toast("Exercise removed");
});
