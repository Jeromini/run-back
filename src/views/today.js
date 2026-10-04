// Today: the "right now" screen. Your fast, today's session with the coach's advice built in,
// one row of quick logs and the Journey strip. Checklists, rings and totals live in Journey.
import { act, onInput, openSheet, closeSheet, segHtml, toast, ICON } from "../lib/dom.js";
import { esc, mmss, hm, num, round1 } from "../lib/format.js";
import { nice, today, DOWL, MONL, clock } from "../lib/dates.js";
import { ring } from "../lib/charts.js";
import { state, day, render } from "../core/state.js";
import { saveDay, saveProfile } from "../core/store.js";
import { isPro } from "../core/premium.js";
import { sessionFor, weekOf, blocksTotal, runSeconds } from "../domain/plan.js";
import { runDist, runSecs, crossSecs, foodTotals, weights } from "../domain/metrics.js";
import { coach, allFasts, planFor, nextFast, dueFast, spanText, routineLabel } from "../domain/fasting.js";
import { targetFor } from "../features/water.js";
import { strengthCard, afterRender as strengthAfter } from "../features/strength.js";
import { openWorkout } from "../features/workout.js";
import { pickActivity, openLogActivity, startFreeWorkout } from "../features/activitylog.js";
import { activityById, activityKcal, INTENSITY } from "../domain/activities.js";
import { actsOf, currentWeight, toKg } from "../domain/metrics.js";
import { fmtDist, paceOf } from "../features/activity.js";
import { unlockRow } from "../features/paywall.js";
import { journeyStrip } from "./journey.js";

const H = 3600000;
const tone = { good: ICON.bolt, caution: ICON.timer, stop: ICON.close, info: ICON.star };
let showLifts = false, weighDraft = null;

function coachNow() {
  const p = state.profile, d = state.days[state.sel] || {}, s = sessionFor(state.sel, p);
  const done = s.kind === "run" ? d.runDone : s.kind === "cross" ? d.crossDone : false;
  const last = allFasts(state.days)[0] || null;
  return coach({ session: s, done, active: p.fastActive, lastFast: last, planHours: planFor(p).hours });
}

// The full coach card, used on the Fast tab.
export function coachCard(compact = false) {
  const c = coachNow();
  const head = `<span class="k">${tone[c.tone]} Fast + Train coach</span><h3>${esc(c.title)}</h3>`;
  if (!isPro()) return `<div class="coach ${c.tone}">${head}<div class="locked-body" aria-hidden="true"><p class="blur">${esc(c.body)}</p></div>${unlockRow("fastTrain", "See exactly when to train around your fast")}</div>`;
  return `<div class="coach ${c.tone}">${head}${compact ? "" : `<p>${esc(c.body)}</p>`}</div>`;
}

function fastMini() {
  const fa = state.profile.fastActive, plan = planFor(state.profile);
  if (fa) {
    const el = (Date.now() - fa.s) / 1000, p = el / (fa.h * 3600);
    return `<button class="fastmini" data-act="tab" data-v="fast">
      ${ring(p, { size: 56, stroke: 6, color: "var(--fast)", inner: `<span style="color:var(--fast)">${ICON.timer}</span>` })}
      <div><div class="t">${p >= 1 ? "Fasting goal reached" : "Fasting"}</div><div class="s">${p >= 1 ? "Break your fast when you're ready" : hm(fa.h * 3600 - el) + " to your " + fa.h + " h goal"}</div></div>
      <div class="big" data-tick="fast-el">${mmss(el)}</div></button>`;
  }
  const last = allFasts(state.days)[0];
  const next = last ? last.e + Math.max(1, 24 - plan.hours) * H : null;
  const r = state.profile.routine, nf = r && r.on ? nextFast(r) : null, due = r && r.on ? dueFast(r, null, last) : null;
  if (due || nf) return `<button class="fastmini" data-act="tab" data-v="fast">
    ${ring(0, { size: 56, stroke: 6, color: "var(--fast)", inner: `<span style="color:var(--fast)">${ICON.timer}</span>` })}
    <div><div class="t">${due ? "Your fast is due now" : "Next fast " + (nf.start - Date.now() < 24 * H ? "in " + hm((nf.start - Date.now()) / 1000) : "")}</div><div class="s">${esc(spanText(r, (due || nf).day))}</div></div>
    <span class="pill fast">${esc(routineLabel(r))}</span></button>`;
  return `<button class="fastmini" data-act="tab" data-v="fast">
    ${ring(0, { size: 56, stroke: 6, color: "var(--fast)", inner: `<span style="color:var(--fast)">${ICON.timer}</span>` })}
    <div><div class="t">Eating window</div><div class="s">${next ? (Date.now() > next ? "Time to start your " + plan.label + " fast" : "Next fast at " + clock(next)) : "Start your first " + plan.label + " fast"}</div></div>
    <span class="pill fast">${plan.label}</span></button>`;
}

// The coach's advice, inside the session card and above the button it governs.
function heroCoach(c) {
  if (!isPro()) return `<button class="hcoach locked" data-act="paywall" data-f="fastTrain">${ICON.lock}<span><b>When should you train today?</b><small>Premium times every session around your fast</small></span></button>`;
  return `<div class="hcoach ${c.tone}"><i aria-hidden="true">${tone[c.tone]}</i><span><b>${esc(c.title)}</b><small>${esc(c.body)}</small></span></div>`;
}

function hero() {
  const p = state.profile, s = sessionFor(state.sel, p), wk = weekOf(state.sel, p), d = state.days[state.sel] || {};
  const done = s.kind === "run" ? d.runDone : s.kind === "cross" ? d.crossDone : false;
  const training = s.kind === "run" || s.kind === "cross", c = coachNow(), pro = isPro();
  const noun = s.kind === "run" ? "run" : "cardio";
  let h = `<div class="hero ${s.kind}"><div class="meta"><span>${wk ? "Run plan &middot; week " + wk : "Run plan starts " + esc(nice(p.startDate))}</span><span>${s.kind === "run" ? "Run" : s.kind === "cross" ? "Cardio + strength" : s.kind === "rest" ? "Recovery" : ""}</span></div>
    <h2>${esc(s.title)}</h2><p>${esc(s.how)}</p>`;
  if (s.blocks) {
    h += `<div class="chips"><span>${Math.round(blocksTotal(s.blocks) / 60)} min</span>${s.kind === "run" ? `<span>${Math.round(runSeconds(s.blocks) / 60)} min running</span>` : ""}<span>${s.hard ? "Faster efforts" : "Easy effort"}</span></div>`;
    if (s.kind === "run") { const tot = blocksTotal(s.blocks); h += `<div class="strip" aria-hidden="true">${s.blocks.map(b => `<i class="${b[0]}" style="flex:${b[1] / tot}"></i>`).join("")}</div>`; }
  }
  if (done) {
    const isRun = s.kind === "run", dist = isRun ? runDist(d, p.dunit) : d.crossDistM || 0, dur = isRun ? runSecs(d) : crossSecs(d);
    h += `<div class="donebox"><div><b>${dist ? fmtDist(dist) : "-"}</b><span>${p.dunit}</span></div><div><b>${dur ? mmss(dur) : "-"}</b><span>time</span></div><div><b>${paceOf(dur, dist)}</b><span>avg /${p.dunit}</span></div></div>`;
    if (pro) h += heroCoach(c);
    h += `<div class="sub"><button type="button" data-act="open-activity" data-date="${state.sel}" data-kind="${s.kind}">View activity</button>${s.blocks ? `<button type="button" data-act="start-session">Do it again</button>` : ""}</div>`;
  } else if (training && s.blocks) {
    h += heroCoach(c);
    if (pro && c.tone === "stop") h += `<button class="go" data-act="tab" data-v="fast">${ICON.timer} Break your fast first</button>
      <div class="sub"><button type="button" data-act="start-session">Start ${noun} anyway</button><button type="button" data-act="add-activity">Log an activity</button></div>`;
    else h += `<button class="go" data-act="start-session">${ICON.play} Start ${pro && c.tone === "caution" ? "easy " : ""}${noun}</button>
      <div class="sub"><button type="button" data-act="free-workout">Do something different</button><button type="button" data-act="add-activity">Log an activity</button></div>`;
  } else {
    h += `<p class="soft">Feel like moving? Rest days are for easy movement, but it's your call.</p>
      <button class="go" data-act="free-workout">${ICON.play} Start a workout</button>
      <div class="sub"><button type="button" data-act="add-activity">Log an activity</button><button type="button" data-act="lifts">Strength workout</button></div>`;
  }
  if (s.kind === "run" && wk && wk <= 9 && !done) h += `<p class="soft small">Easy means full sentences. Your 2021 half pace (6:43/mi) is the long-term goal, not today's.</p>`;
  return h + `</div>`;
}

// One row of quick logs: each tile shows where you are, so no separate cards are needed.
function quickRow() {
  const k = state.sel, d = state.days[k] || {}, p = state.profile, ft = foodTotals(d), ml = d.water || 0, tg = targetFor(k);
  const tile = (attrs, icon, color, soft, label, sub) => `<button class="qa" ${attrs}><i style="background:${soft};color:${color}">${ICON[icon]}</i><b>${label}</b><small>${sub}</small></button>`;
  return `<div class="quickacts">
    ${tile(`data-act="today-food"`, "food", "var(--rose)", "var(--rose-soft)", "Meal", ft.n ? num(ft.k) + " kcal" : "Log food")}
    ${tile(`data-act="add-activity"`, "bolt", "var(--violet)", "var(--violet-soft)", "Activity", actsOf(d).length ? actsOf(d).length + " logged" : "Any sport")}
    ${tile(`data-act="water" data-ml="250" data-date="${k}" aria-label="Add 250 ml of water, ${num(ml)} of ${num(tg)} ml so far"`, "water", "var(--water)", "var(--water-soft)", "+250 ml", `${round1(ml / 1000)} / ${round1(tg / 1000)} L`)}
    ${tile(`data-act="weigh-open"`, "scale", "var(--rose)", "var(--rose-soft)", "Weigh-in", d.weight ? d.weight + " " + p.unit : "Not yet")}
  </div>`;
}

// After a session: effort, pain and notes, with the matching guidance.
function feelCard() {
  const s = sessionFor(state.sel, state.profile), d = state.days[state.sel] || {}, p = state.profile;
  const isRun = s.kind === "run", done = isRun ? d.runDone : s.kind === "cross" ? d.crossDone : false;
  if (!done) return "";
  let h = `<div class="card" id="manual"><h3>How did it feel?</h3>
    <label class="f">Effort (1 easy, 10 all out)${segHtml("m-rpe", [[2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"], [7, "7"], [8, "8+"]], d.rpe, 'data-act="m-seg" data-k="rpe"')}</label>
    <label class="f">Any pain?${segHtml("m-pain", [["no", "No"], ["niggle", "Niggle"], ["yes", "Yes"]], d.pain || "", 'data-act="m-seg" data-k="pain"')}</label>
    <label class="f">Notes<textarea data-in="m-text" data-k="notes" placeholder="How it felt, heat, who you ran with">${esc(d.notes || "")}</textarea></label>`;
  if (d.rpe >= 7 && isRun && weekOf(state.sel, p) <= 9) h += `<div class="callout">That felt hard for an easy run. Slow the jog down, and repeat this week if it stays above 6.</div>`;
  if (d.pain === "yes") h += `<div class="callout red">Pain that changes how you move means stop running for now. Walk or cycle and repeat the week. If it lasts more than a few days, get it checked.</div>`;
  return h + `</div>`;
}

function extraActs() {
  const d = state.days[state.sel], list = actsOf(d);
  if (!list.length) return "";
  const kg = toKg(currentWeight(state.days, state.sel) || state.profile.startWeight, state.profile.unit);
  return `<div class="card"><div class="card-head"><h3>Other activity</h3><button class="linkbtn" data-act="add-activity">+ Add</button></div>
    <div class="list">${list.map(x => { const a = activityById(x.type); if (!a) return ""; return `<button class="frow" data-act="open-activity" data-date="${state.sel}" data-kind="act" data-id="${x.id}">
      <span><b>${esc(a.name)}</b><span class="note">${x.min} min &middot; ${esc(INTENSITY[x.int ?? 1][1].toLowerCase())} &middot; about ${activityKcal(a, x.int ?? 1, x.min, kg) || "-"} kcal</span></span><i aria-hidden="true">${ICON.next}</i></button>`; }).join("")}</div></div>`;
}

export function renderToday(root) {
  const now = new Date(), t = today(), s = sessionFor(state.sel, state.profile), d = state.days[state.sel] || {};
  const lifts = showLifts || s.kind === "cross" || (Array.isArray(d.strength) && d.strength.length);
  const other = state.sel !== t;
  root.innerHTML = `<section class="view">
    <div class="tdhead"><h1>${other ? esc(nice(state.sel)) : "Today"}</h1>
      ${other ? `<button class="linkbtn" data-act="pick-day" data-d="${t}">Back to today</button>` : ""}
      <button class="datebtn" data-act="open-cal" aria-label="Open calendar">${ICON.cal} ${other ? "Calendar" : DOWL[now.getDay()].slice(0, 3) + " " + now.getDate() + " " + MONL[now.getMonth()].slice(0, 3)}</button></div>
    ${other ? "" : fastMini()}
    ${hero()}
    ${quickRow()}
    ${journeyStrip()}
    ${extraActs()}
    ${lifts ? strengthCard(render) : ""}
    ${feelCard()}
  </section>`;
  if (lifts) strengthAfter();
}

act("pick-day", el => { state.sel = el.dataset.d; render(); window.scrollTo(0, 0); });
act("start-session", () => {
  const s = sessionFor(state.sel, state.profile);
  if (s.kind === "cross") pickActivity(a => openWorkout(s, state.sel, { type: a.id }), "Which cardio today?");
  else openWorkout(s, state.sel);
});
act("add-activity", () => openLogActivity(state.sel));
act("free-workout", () => startFreeWorkout(state.sel, openWorkout));
act("lifts", () => { showLifts = true; render(); setTimeout(() => { const c = document.getElementById("liftcard"); if (c) c.scrollIntoView({ behavior: "smooth", block: "start" }); }, 30); });
act("today-food", async () => { const { setFoodDate } = await import("./food.js"); setFoodDate(state.sel); state.view = "food"; render(); window.scrollTo(0, 0); });
act("focus-weight", () => openWeigh());
act("weigh-open", () => openWeigh());

// Weigh-in: prefilled with your last weight, nudged with steppers, one tap to save.
export function openWeigh() {
  const p = state.profile, d = state.days[state.sel] || {}, list = weights(state.days);
  weighDraft = Number(d.weight || (list.length ? list[list.length - 1].w : p.startWeight) || (p.unit === "kg" ? 80 : 180));
  openSheet({ title: "Weigh-in", html: `<h1 class="big-title">${state.sel === today() ? "Today's weight" : esc(nice(state.sel))}</h1>
    <p class="note">Same time each morning, after the bathroom and before food, gives the cleanest trend.</p>
    <div class="weigh"><button class="iconbtn" data-act="weigh-step" data-d="-0.2" aria-label="Down 0.2">${ICON.minus}</button>
      <label><input type="number" id="weigh-in" inputmode="decimal" step="0.1" value="${weighDraft}" aria-label="Weight in ${p.unit}"><span>${p.unit}</span></label>
      <button class="iconbtn" data-act="weigh-step" data-d="0.2" aria-label="Up 0.2">${ICON.plus}</button></div>
    <button class="btn primary big" data-act="weigh-save">Save weight</button>` });
}
act("weigh-step", el => { const i = document.getElementById("weigh-in"); i.value = round1((Number(i.value) || weighDraft) + Number(el.dataset.d)); });
act("weigh-save", () => {
  const v = Number(document.getElementById("weigh-in").value); if (!v) { toast("Enter your weight"); return; }
  day(state.sel).weight = v; saveDay(state.sel);
  if (!state.profile.startWeight) { state.profile.startWeight = v; saveProfile(); }
  closeSheet(); toast("Weight saved"); render();
});
onInput("m-text", el => { day(state.sel)[el.dataset.k] = el.value; saveDay(state.sel); });
act("m-seg", (el, ev) => {
  const b = ev.target.closest("button"); if (!b) return;
  const k = el.dataset.k, dd = day(state.sel), v = k === "rpe" ? Number(b.dataset.v) : b.dataset.v;
  dd[k] = dd[k] === v ? null : v; saveDay(state.sel);
  render();
});
