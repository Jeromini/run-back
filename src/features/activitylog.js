// Choosing and logging activities. A logged activity either completes today's planned
// session (written to the plan fields, so it counts toward the weekly rings) or is stored as
// an extra in day.acts = [{ id, type, min, int, distM?, rpe? }].
import { $, act, onInput, openSheet, closeSheet, toast, segHtml, ICON } from "../lib/dom.js";
import { esc, UNIT_M } from "../lib/format.js";
import { nice } from "../lib/dates.js";
import { state, day, render } from "../core/state.js";
import { saveDay } from "../core/store.js";
import { sessionFor } from "../domain/plan.js";
import { currentWeight, toKg } from "../domain/metrics.js";
import { GROUPS, INTENSITY, activityById, activityKcal, searchActivities } from "../domain/activities.js";
import { buzz } from "../lib/sound.js";

const uidGen = () => Math.random().toString(36).slice(2, 9);
let pickCb = null, pickQ = "", form = null;
const kg = date => toKg(currentWeight(state.days, date) || state.profile.startWeight, state.profile.unit);

// ---------- picker ----------
export function pickActivity(onPick, title = "Choose an activity") {
  pickCb = onPick; pickQ = "";
  openSheet({ title: "Activity", html: `<h1 class="big-title" style="font-size:28px">${esc(title)}</h1>
    <div class="search"><span aria-hidden="true">${ICON.search}</span><input id="act-q" data-in="act-q" placeholder="Search: treadmill, elliptical, tennis..." autocomplete="off"></div>
    <div id="act-list">${listHtml()}</div>` });
}
function listHtml() {
  const list = searchActivities(pickQ);
  if (!list.length) return `<p class="note">No match. Try another word.</p>`;
  if (pickQ.trim()) return `<div class="card tight">${list.map(rowHtml).join("")}</div>`;
  return GROUPS.map(([g, label]) => `<div class="eyebrow" style="margin-top:4px">${esc(label)}</div><div class="card tight">${list.filter(a => a.group === g).map(rowHtml).join("")}</div>`).join("");
}
const rowHtml = a => `<button class="frow" data-act="act-choose" data-id="${a.id}"><span><b>${esc(a.name)}</b><span class="note">${a.gps ? "GPS distance and pace" : a.distance ? "Optional distance" : "Time and effort"}</span></span><i aria-hidden="true">${ICON.next}</i></button>`;
onInput("act-q", el => { pickQ = el.value; $("act-list").innerHTML = listHtml(); });
act("act-choose", el => { const a = activityById(el.dataset.id), cb = pickCb; closeSheet(); if (cb) cb(a); });

// ---------- manual log ----------
export function openLogActivity(date, preset = {}) {
  const s = sessionFor(date, state.profile), d = state.days[date] || {};
  const planRun = s.kind === "run" && !d.runDone, planCross = s.kind === "cross" && !d.crossDone;
  form = { date, type: preset.type || null, min: preset.min || 30, int: 1, dist: "", rpe: null, plan: null, planRun, planCross, editId: preset.editId || null };
  if (preset.editId) {
    const x = (d.acts || []).find(a => a.id === preset.editId);
    if (x) Object.assign(form, { type: x.type, min: x.min, int: x.int ?? 1, dist: x.distM ? +(x.distM / UNIT_M[state.profile.dunit]).toFixed(2) : "", rpe: x.rpe || null });
  }
  if (!form.type) { pickActivity(a => { form.type = a.id; drawForm(); }, "What did you do?"); return; }
  drawForm();
}
function drawForm() {
  const a = activityById(form.type), du = state.profile.dunit;
  const canPlan = !form.editId && ((a.run && form.planRun) || (!a.run && form.planCross));
  if (form.plan === null) form.plan = canPlan;
  openSheet({ title: nice(form.date), html: `<h1 class="big-title" style="font-size:28px">Log activity</h1>
    <button class="frow card" data-act="act-change" style="padding:14px"><span><span class="eyebrow">Activity</span><b style="font-size:18px">${esc(a.name)}</b></span><i aria-hidden="true">${ICON.edit}</i></button>
    <div class="portion-total"><div><b id="al-k">0</b><span>kcal (est.)</span></div><div><b id="al-m">0</b><span>minutes</span></div><div><b>${INTENSITY[form.int][1]}</b><span>intensity</span></div></div>
    <div class="card"><div class="eyebrow">Duration (minutes)</div>
      <div class="stepper"><button class="btn" data-act="al-step" data-d="-5" aria-label="5 minutes less">${ICON.minus}</button><b id="al-min"></b><button class="btn" data-act="al-step" data-d="5" aria-label="5 minutes more">${ICON.plus}</button></div>
      <div class="chips" style="justify-content:center">${[15, 20, 30, 45, 60, 90].map(v => `<button class="chip" data-act="al-set" data-v="${v}">${v}</button>`).join("")}</div>
      <div class="eyebrow">How hard?</div>
      ${segHtml("al-int", INTENSITY.map(([v, l]) => [v, l]), form.int, 'data-act="al-int"')}
      <p class="note" style="text-align:center">${esc(INTENSITY[form.int][2])}</p>
      ${a.distance ? `<label class="f">Distance (${du}, optional)<input type="number" inputmode="decimal" step="0.01" value="${esc(form.dist)}" data-in="al-dist" placeholder="e.g. 3.1"></label>` : ""}
    </div>
    ${canPlan ? `<label class="switch card" style="padding:14px 16px"><span>Counts as today's planned ${a.run ? "run" : "cardio"}<small>Ticks off today's session in your plan and weekly rings</small></span><input type="checkbox" data-act="al-plan"${form.plan ? " checked" : ""}></label>` : ""}
    <button class="btn primary big" data-act="al-save">${ICON.tick} ${form.editId ? "Save changes" : "Log activity"}</button>
    <p class="note">${kg(form.date) ? "Calories are estimated from the activity, intensity, time and your body weight. Treat them as a guide." : "Log a weigh-in on Today to see estimated calories for your activities."}</p>` });
  paintForm();
}
function paintForm() {
  const a = activityById(form.type);
  $("al-min").textContent = form.min; $("al-m").textContent = form.min;
  $("al-k").textContent = activityKcal(a, form.int, form.min, kg(form.date)) || "-";
}
act("act-change", () => pickActivity(a => { form.type = a.id; form.plan = null; drawForm(); }, "Change activity"));
act("al-step", el => { form.min = Math.max(5, Math.min(600, form.min + Number(el.dataset.d))); paintForm(); });
act("al-set", el => { form.min = Number(el.dataset.v); paintForm(); });
act("al-int", (el, ev) => { const b = ev.target.closest("button"); if (b) { form.int = Number(b.dataset.v); drawForm(); } });
act("al-plan", el => { form.plan = el.checked; });
onInput("al-dist", el => { form.dist = el.value; });
act("al-save", () => {
  const a = activityById(form.type), d = day(form.date), du = state.profile.dunit;
  const distM = form.dist ? Math.round(Number(form.dist) * UNIT_M[du]) : null;
  if (form.plan && a.run) Object.assign(d, { runDone: true, runMin: form.min, runDur: form.min * 60, runTitle: a.name, runAct: a.id, runInt: form.int, runDistM: distM || d.runDistM || null });
  else if (form.plan) Object.assign(d, { crossDone: true, crossMin: form.min, crossDur: form.min * 60, crossType: a.name, crossAct: a.id, crossInt: form.int, crossDistM: distM });
  else {
    const rec = { id: form.editId || uidGen(), type: a.id, min: form.min, int: form.int, distM };
    d.acts = (d.acts || []).filter(x => x.id !== form.editId).concat(rec);
  }
  saveDay(form.date); buzz(25); closeSheet();
  toast(`${a.name}, ${form.min} min logged`); render();
});
