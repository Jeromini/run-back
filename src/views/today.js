// Today: the daily hub. Fasting status, weekly rings, the session, the coach, water and strength.
import { act, onInput, segHtml, toast, ICON } from "../lib/dom.js";
import { esc, mmss, hm } from "../lib/format.js";
import { iso, addDays, nice, today, weekStart, DOWL, MONL, DOW, clock } from "../lib/dates.js";
import { rings, ring } from "../lib/charts.js";
import { state, day, render } from "../core/state.js";
import { saveDay, saveProfile } from "../core/store.js";
import { isPro } from "../core/premium.js";
import { RHYTHM, sessionFor, weekOf, blocksTotal, runSeconds } from "../domain/plan.js";
import { weekCounts, streakWeeks, runDist, runSecs, crossSecs, strengthDone } from "../domain/metrics.js";
import { coach, allFasts, planById } from "../domain/fasting.js";
import { waterCard } from "../features/water.js";
import { strengthCard, afterRender as strengthAfter } from "../features/strength.js";
import { openWorkout } from "../features/workout.js";
import { pickActivity, openLogActivity } from "../features/activitylog.js";
import { activityById, activityKcal, INTENSITY } from "../domain/activities.js";
import { actsOf, currentWeight, toKg } from "../domain/metrics.js";
import { fmtDist, paceOf } from "../features/activity.js";
import { unlockRow } from "../features/paywall.js";
import { GUIDES } from "../domain/guides.js";
import { guideRow } from "../features/guides.js";

const H = 3600000;
const tone = { good: ICON.bolt, caution: ICON.timer, stop: ICON.close, info: ICON.star };

export function coachCard(compact = false) {
  const p = state.profile, d = state.days[state.sel] || {}, s = sessionFor(state.sel, p);
  const done = s.kind === "run" ? d.runDone : s.kind === "cross" ? d.crossDone : false;
  const last = allFasts(state.days)[0] || null;
  const c = coach({ session: s, done, active: p.fastActive, lastFast: last, planHours: planById(p.fastPlan).hours });
  const head = `<span class="k">${tone[c.tone]} Fast + Train coach</span><h3>${esc(c.title)}</h3>`;
  if (!isPro()) return `<div class="coach ${c.tone}">${head}<div class="locked-body" aria-hidden="true"><p class="blur">${esc(c.body)}</p></div>${unlockRow("fastTrain", "See exactly when to train around your fast")}</div>`;
  return `<div class="coach ${c.tone}">${head}${compact ? "" : `<p>${esc(c.body)}</p>`}</div>`;
}

function fastMini() {
  const fa = state.profile.fastActive, plan = planById(state.profile.fastPlan);
  if (fa) {
    const el = (Date.now() - fa.s) / 1000, p = el / (fa.h * 3600);
    return `<button class="fastmini" data-act="tab" data-v="fast">
      ${ring(p, { size: 56, stroke: 6, color: "var(--fast)", inner: `<span style="color:var(--fast)">${ICON.timer}</span>` })}
      <div><div class="t">${p >= 1 ? "Fasting goal reached" : "Fasting"}</div><div class="s">${p >= 1 ? "Break your fast when you're ready" : hm(fa.h * 3600 - el) + " to your " + fa.h + " h goal"}</div></div>
      <div class="big" data-tick="fast-el">${mmss(el)}</div></button>`;
  }
  const last = allFasts(state.days)[0];
  const next = last ? last.e + Math.max(1, 24 - plan.hours) * H : null;
  return `<button class="fastmini" data-act="tab" data-v="fast">
    ${ring(0, { size: 56, stroke: 6, color: "var(--fast)", inner: `<span style="color:var(--fast)">${ICON.timer}</span>` })}
    <div><div class="t">Eating window</div><div class="s">${next ? (Date.now() > next ? "Time to start your " + plan.label + " fast" : "Next fast at " + clock(next)) : "Start your first " + plan.label + " fast"}</div></div>
    <span class="pill fast">${plan.label}</span></button>`;
}

function hero() {
  const p = state.profile, s = sessionFor(state.sel, p), wk = weekOf(state.sel, p), d = state.days[state.sel] || {}, t = today();
  const done = s.kind === "run" ? d.runDone : s.kind === "cross" ? d.crossDone : false;
  let h = `<div class="hero ${s.kind}"><div class="meta"><span>${esc(state.sel === t ? "Today" : nice(state.sel))}${wk ? " &middot; Week " + wk : ""}</span><span>${s.kind === "run" ? "Run" : s.kind === "cross" ? "Cardio + strength" : s.kind === "rest" ? "Recovery" : ""}</span></div>
    <h2>${esc(s.title)}</h2><p>${esc(s.how)}</p>`;
  if (s.blocks) {
    h += `<div class="chips"><span>${Math.round(blocksTotal(s.blocks) / 60)} min</span>${s.kind === "run" ? `<span>${Math.round(runSeconds(s.blocks) / 60)} min running</span>` : ""}<span>${s.hard ? "Faster efforts" : "Easy effort"}</span></div>`;
    if (s.kind === "run") { const tot = blocksTotal(s.blocks); h += `<div class="strip" aria-hidden="true">${s.blocks.map(b => `<i class="${b[0]}" style="flex:${b[1] / tot}"></i>`).join("")}</div>`; }
  }
  if (done) {
    const isRun = s.kind === "run", dist = isRun ? runDist(d, p.dunit) : d.crossDistM || 0, dur = isRun ? runSecs(d) : crossSecs(d);
    h += `<div class="donebox"><div><b>${dist ? fmtDist(dist) : "-"}</b><span>${p.dunit}</span></div><div><b>${dur ? mmss(dur) : "-"}</b><span>time</span></div><div><b>${paceOf(dur, dist)}</b><span>avg /${p.dunit}</span></div></div>
      <div class="sub"><button type="button" data-act="open-activity" data-date="${state.sel}" data-kind="${s.kind}">View activity</button>${s.blocks ? `<button type="button" data-act="start-session">Do it again</button>` : ""}</div>`;
  } else if (s.blocks) h += `<button class="go" data-act="start-session">${ICON.play} Start ${s.kind === "run" ? "run" : "cardio"}</button>`;
  if (s.kind === "run" && wk && wk <= 9 && !done) h += `<p style="font-size:13px;opacity:.8">Easy means full sentences. Your 2021 half pace (6:43/mi) is the long-term goal, not today's.</p>`;
  return h + `</div>`;
}

function manualLog() {
  const s = sessionFor(state.sel, state.profile), d = state.days[state.sel] || {}, p = state.profile;
  const isRun = s.kind === "run", isCross = s.kind === "cross";
  let h = `<div class="card"><div class="card-head"><h3>Weight ${state.sel === today() ? "today" : "on " + esc(nice(state.sel))}</h3>${d.weight ? `<span class="pill">${d.weight} ${p.unit}</span>` : ""}</div>
    <div class="quickw"><input type="number" id="q-w" aria-label="Weight in ${p.unit}" inputmode="decimal" step="0.1" placeholder="Weight in ${p.unit}" value="${esc(d.weight || "")}">
    <button class="btn primary" data-act="q-wsave">Save</button></div>`;
  if (isRun || isCross) {
    const done = isRun ? d.runDone : d.crossDone;
    if (!done) h += `<button class="linkbtn" data-act="log-plan-manual">Did it without the timer? Log ${isRun ? "your run" : "your cardio"}</button>`;
    h += `<details class="manual" id="manual"><summary>Effort, pain and notes</summary>`;
    h += `<label class="f">Effort (1 easy, 10 all out)${segHtml("m-rpe", [[2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"], [7, "7"], [8, "8+"]], d.rpe, 'data-act="m-seg" data-k="rpe"')}</label>
      <label class="f" style="margin-top:10px">Any pain?${segHtml("m-pain", [["no", "No"], ["niggle", "Niggle"], ["yes", "Yes"]], d.pain || "", 'data-act="m-seg" data-k="pain"')}</label>
      <label class="f" style="margin-top:10px">Notes<textarea data-in="m-text" data-k="notes" placeholder="How it felt, heat, who you ran with">${esc(d.notes || "")}</textarea></label></details>`;
  }
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
  const now = new Date(), t = today(), p = state.profile, wk = weekOf(t, p);
  const c = weekCounts(state.days, weekStart(state.sel)), st = streakWeeks(state.days, t);
  const first = weekStart(state.sel);
  const nextGuide = GUIDES.find(g => !(p.readGuides || []).includes(g.id) && (g.free || isPro())) || GUIDES[0];
  root.innerHTML = `<section class="view">
    <div><button class="datebtn" data-act="open-cal">${ICON.cal} ${DOWL[now.getDay()]} ${now.getDate()} ${MONL[now.getMonth()]}</button>
      <div class="hello" style="margin-top:4px"><h1>${wk ? (wk <= 9 ? "Week " + wk + ": Build" : "Week " + wk + ": Speed") : "Starts " + esc(nice(p.startDate))}</h1></div>
      <div class="phase" style="margin-top:8px"><div class="track">${Array.from({ length: 12 }, (_, i) => `<i class="${i + 1 < wk ? "on" : i + 1 === wk ? "now" : ""}"></i>`).join("")}</div><span>${Math.min(wk, 12)}/12</span></div></div>
    ${fastMini()}
    <div class="card"><div class="rings">${rings([{ v: c.runs, max: 3, color: "var(--accent)" }, { v: c.cross, max: 2, color: "var(--violet)" }, { v: c.weighs, max: 7, color: "var(--rose)" }])}
      <div class="legend"><div><i style="background:var(--accent)"></i><span>Runs</span><b>${c.runs}/3</b></div>
        <div><i style="background:var(--violet)"></i><span>Cardio + strength</span><b>${c.cross}/2</b></div>
        <div><i style="background:var(--rose)"></i><span>Weigh-ins</span><b>${c.weighs}/7</b></div></div></div>
      <div class="streak"><b>${st}</b> week streak of 3 runs ${st ? "" : "&middot; finish this week to start one"}</div></div>
    <div class="daybar">${Array.from({ length: 7 }, (_, i) => { const d = addDays(first, i), k = iso(d), x = state.days[k], ty = RHYTHM[d.getDay()]; return `<button data-act="pick-day" data-d="${k}" class="${k === state.sel ? "sel " : ""}${x && (x.runDone || x.crossDone || strengthDone(x)) ? "done" : ""}" aria-label="${nice(k)}"><small>${k === t ? "Today" : DOW[d.getDay()]}</small><b>${d.getDate()}</b><span class="dot ${ty === "rest" ? "" : ty}"></span></button>`; }).join("")}</div>
    ${hero()}
    ${coachCard()}
    <div class="quickacts">
      <button class="qa" data-act="tab" data-v="food"><i style="background:var(--rose-soft);color:var(--rose)">${ICON.food}</i>Meal</button>
      <button class="qa" data-act="add-activity"><i style="background:var(--violet-soft);color:var(--violet)">${ICON.bolt}</i>Activity</button>
      <button class="qa" data-act="water" data-ml="250" data-date="${state.sel}"><i style="background:var(--water-soft);color:var(--water)">${ICON.water}</i>+ 250 ml</button>
      <button class="qa" data-act="tab" data-v="fast"><i style="background:var(--fast-soft);color:var(--fast)">${ICON.timer}</i>${p.fastActive ? "End fast" : "Fast"}</button>
    </div>
    ${extraActs()}
    ${waterCard(state.sel)}
    ${strengthCard(render)}
    ${manualLog()}
    <div><div class="eyebrow" style="margin-bottom:8px">Read next</div>${guideRow(nextGuide)}</div>
  </section>`;
  strengthAfter();
}

act("pick-day", el => { state.sel = el.dataset.d; render(); });
act("start-session", () => {
  const s = sessionFor(state.sel, state.profile);
  if (s.kind === "cross") pickActivity(a => openWorkout(s, state.sel, { type: a.id }), "Which cardio today?");
  else openWorkout(s, state.sel);
});
act("add-activity", () => openLogActivity(state.sel));
act("log-plan-manual", () => { const s = sessionFor(state.sel, state.profile); openLogActivity(state.sel, s.kind === "run" ? { type: "run-out" } : {}); });
act("focus-weight", () => { const i = document.getElementById("q-w"); if (i) { i.scrollIntoView({ block: "center" }); i.focus(); } });
act("q-wsave", () => {
  const v = Number(document.getElementById("q-w").value); if (!v) { toast("Enter your weight"); return; }
  day(state.sel).weight = v; saveDay(state.sel);
  if (!state.profile.startWeight) { state.profile.startWeight = v; saveProfile(); }
  toast("Weight saved"); render();
});
onInput("m-text", el => { day(state.sel)[el.dataset.k] = el.value; saveDay(state.sel); });
act("m-seg", (el, ev) => {
  const b = ev.target.closest("button"); if (!b) return;
  const k = el.dataset.k, dd = day(state.sel), v = k === "rpe" ? Number(b.dataset.v) : b.dataset.v;
  dd[k] = dd[k] === v ? null : v; saveDay(state.sel);
  render(); const m = document.getElementById("manual"); if (m) m.open = true;
});
