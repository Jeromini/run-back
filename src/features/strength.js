// Strength editor. day.strength = [{ id, name, cue?, sets: [{ r, w, done }] }].
// Any day can have one; Fri/Mon start from the plan's five moves (saved on first edit).
import { $, act, onInput, toast, confirmTap, ICON } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { state, day } from "../core/state.js";
import { saveDay } from "../core/store.js";
import { LIFTS, sessionFor } from "../domain/plan.js";
import { setCounts } from "../domain/metrics.js";
import { buzz } from "../lib/sound.js";

const LIBRARY = [
  ["Squat", 10], ["Goblet squat", 10], ["Sit-to-stand", 12], ["Lunge", 10], ["Step-up", 10], ["Glute bridge", 12],
  ["Romanian deadlift", 10], ["Hip hinge (good morning)", 10], ["Calf raises", 15], ["Single-leg calf raise", 12],
  ["Push-up", 10], ["Incline push-up", 12], ["Bench press", 10], ["Overhead press", 10], ["Dips", 10],
  ["Dumbbell row", 10], ["Band row", 12], ["TRX row", 12], ["Pull-up", 6], ["Lat pulldown", 10],
  ["Bicep curl", 12], ["Tricep extension", 12], ["Plank (seconds)", 30], ["Side plank (seconds)", 20], ["Dead bug", 10], ["Bird dog", 10]
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
  let h = q && !all.some(n => n.toLowerCase() === ql) ? `<button class="chip add" data-act="ex-pick" data-n="${esc(q)}">+ Add "${esc(q)}"</button>` : "";
  h += all.slice(0, 30).map(n => `<button class="chip" data-act="ex-pick" data-n="${esc(n)}">${esc(n)}</button>`).join("");
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
