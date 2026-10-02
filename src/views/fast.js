// Fast tab: the dial, stages, the Fast + Train coach, stats and history.
import { act, onChange, openSheet, closeSheet, confirmTap, toast, ICON } from "../lib/dom.js";
import { esc, mmss, hm } from "../lib/format.js";
import { iso, addDays, today, nice, clock, dayClock, localInput, DOW } from "../lib/dates.js";
import { barChart } from "../lib/charts.js";
import { FAST_PLANS } from "../config.js";
import { state, day, render } from "../core/state.js";
import { saveDay, saveProfile } from "../core/store.js";
import { isPro } from "../core/premium.js";
import { planById, stageAt, STAGES, fastStats, allFasts, windowFor } from "../domain/fasting.js";
import { fastHours } from "../domain/metrics.js";
import { coachCard } from "./today.js";
import { waterCard } from "../features/water.js";
import { openPaywall } from "../features/paywall.js";
import { buzz } from "../lib/sound.js";

const H = 3600000, R = 128, C = 2 * Math.PI * R, ARC = 0.75 * C;
let editStart = false;

function dial(fa) {
  const el = fa ? (Date.now() - fa.s) / H : 0, goal = fa ? fa.h : planById(state.profile.fastPlan).hours;
  const p = Math.min(1, el / goal);
  // stage markers along the arc, for the stages that fall inside the goal
  const marks = STAGES.filter(s => s.from > 0 && s.from < goal).map(s => {
    const a = (135 + 270 * (s.from / goal)) * Math.PI / 180, x = 150 + R * Math.cos(a), y = 150 + R * Math.sin(a);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${el >= s.from ? "var(--bg)" : "var(--faint)"}" stroke="none"/>`;
  }).join("");
  return `<div class="dial"><svg viewBox="0 0 300 300" aria-hidden="true">
      <circle cx="150" cy="150" r="${R}" fill="none" stroke="var(--fast)" stroke-opacity=".14" stroke-width="20" stroke-dasharray="${ARC.toFixed(1)} ${C.toFixed(1)}" transform="rotate(135 150 150)"/>
      <circle data-tick="fast-arc" cx="150" cy="150" r="${R}" fill="none" stroke="var(--fast)" stroke-width="20" stroke-dasharray="${(ARC * p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(135 150 150)"${p ? "" : ' opacity="0"'}/>
      ${marks}</svg>
    <div class="mid">${fa
      ? `<span class="lbl">${el >= goal ? "Goal reached" : "Fasting"}</span><span class="clock" data-tick="fast-clock">${mmss(el * 3600)}</span><span class="sub" data-tick="fast-sub">${subText(fa)}</span>`
      : `<span class="lbl" style="color:var(--accent)">Eating window</span><span class="clock" style="font-size:44px">${esc(planById(state.profile.fastPlan).label)}</span><span class="sub">${esc(windowText())}</span>`}</div>
    ${fa ? `<div class="pct" data-tick="fast-pct">${Math.floor(p * 100)}%</div>` : ""}</div>`;
}
function subText(fa) {
  const left = fa.s + fa.h * H - Date.now();
  return left > 0 ? hm(left / 1000) + " to go" : "+" + hm(-left / 1000) + " past goal";
}
function windowText() {
  const plan = planById(state.profile.fastPlan), last = allFasts(state.days)[0];
  const w = windowFor(null, last, plan.hours);
  if (!w.closesAt) return "Start your first fast when you finish eating";
  return w.overdue ? "Your window has closed: time to fast" : "Window closes " + dayClock(w.closesAt);
}

export function renderFast(root) {
  const p = state.profile, fa = p.fastActive, plan = planById(p.fastPlan), st = fastStats(state.days);
  const stage = fa ? stageAt((Date.now() - fa.s) / H) : null;
  const t = today(), days7 = Array.from({ length: 7 }, (_, i) => iso(addDays(new Date(), i - 6)));
  const hours7 = days7.map(k => Math.round(fastHours(state.days[k]) * 10) / 10);
  const hist = allFasts(state.days).slice(0, 10);
  root.innerHTML = `<section class="view">
    <div class="fasthead"><h1 class="big-title">Fast</h1>
      <button class="planbtn" data-act="fast-plans">${ICON.timer} ${esc(plan.label)} plan ${ICON.next}</button></div>
    ${dial(fa)}
    <div class="times">${fa
      ? `<div><span class="eyebrow">Started</span><button data-act="fast-edit-start">${esc(dayClock(fa.s))} ${ICON.edit}</button></div>
         <div><span class="eyebrow">Goal (${fa.h} h)</span><b>${esc(dayClock(fa.s + fa.h * H))}</b></div>`
      : `<div><span class="eyebrow">Plan</span><b>${plan.hours} h fast &middot; ${Math.max(1, 24 - plan.hours)} h eating</b></div>
         <div><span class="eyebrow">If you start now</span><b>Goal ${esc(dayClock(Date.now() + plan.hours * H))}</b></div>`}</div>
    ${editStart && fa ? `<div class="card tight"><label class="f">When did this fast start?<input type="datetime-local" value="${localInput(fa.s)}" max="${localInput(Date.now())}" data-chg="fast-start-at"></label></div>` : ""}
    ${fa
      ? `<button class="btn fast big" data-act="fast-end">End fast</button>`
      : `<button class="btn fast big" data-act="fast-start">${ICON.play} Start ${esc(plan.label)} fast now</button>
         <button class="linkbtn" data-act="fast-start-earlier" style="text-align:center">Finished eating earlier? Set the start time</button>`}
    ${stage ? `<div class="card"><div class="stage"><span class="n">${STAGES.indexOf(STAGES.find(s => s.name === stage.name)) + 1}</span>
        <div><div class="eyebrow">Now</div><h3 style="font-size:18px;font-weight:800">${esc(stage.name)}</h3><p class="note" style="margin-top:4px">${esc(stage.text)}</p></div></div>
        <div class="stagebar">${STAGES.map(s => `<i class="${(Date.now() - fa.s) / H >= s.from ? "on" : ""}"></i>`).join("")}</div>
        ${stage.next ? `<p class="note">Next: <b style="color:var(--ink)">${esc(stage.next.name)}</b> in ${hm(stage.nextIn * 3600)}</p>` : ""}</div>` : ""}
    ${coachCard()}
    <div class="stats four">
      <div class="stat"><b>${st.count}</b><span>fasts completed</span></div>
      <div class="stat"><b>${st.count ? st.avg.toFixed(1) + "h" : "-"}</b><span>average fast</span></div>
      <div class="stat"><b>${st.count ? st.longest.toFixed(1) + "h" : "-"}</b><span>longest fast</span></div>
      <div class="stat"><b>${st.count ? Math.round(st.hitRate * 100) + "%" : "-"}</b><span>goals reached</span></div>
    </div>
    <div class="card"><div class="card-head"><h3>This week</h3><span class="note">${hours7.reduce((a, b) => a + b, 0).toFixed(1)} h fasted</span></div>
      ${barChart({ labels: days7.map(k => DOW[new Date(k + "T12:00").getDay()].slice(0, 2)), values: hours7, target: plan.hours, targetLabel: plan.hours + " h", color: "var(--fast)", fmt: v => Math.round(v) + "h" })}</div>
    ${waterCard(t)}
    <div class="card"><div class="card-head"><h3>History</h3></div>
      ${hist.length ? `<div class="list">${hist.map(f => { const h = (f.e - f.s) / H, hit = h >= f.g - 0.01; return `<div class="li">
        <div><div class="a">${esc(nice(f.date))}</div><div class="b">${esc(clock(f.s))} to ${esc(clock(f.e))} &middot; goal ${f.g} h</div></div>
        <span class="v" style="color:${hit ? "var(--good)" : "var(--ink)"}">${h.toFixed(1)}h</span>
        <button class="x" data-act="fast-del" data-date="${f.date}" data-s="${f.s}" aria-label="Delete this fast">&times;</button></div>`; }).join("")}</div>`
        : `<p class="note">Completed fasts appear here.</p>`}</div>
    <p class="note">Fasting isn't right for everyone. Skip it if you're pregnant, have a history of eating disorders, or have diabetes or take medication without your doctor's advice.</p>
  </section>`;
}

// Live updates every second, without re-rendering the page.
export function tickFast() {
  const fa = state.profile.fastActive; if (!fa) return;
  const el = (Date.now() - fa.s) / 1000, p = Math.min(1, el / (fa.h * 3600));
  document.querySelectorAll('[data-tick="fast-clock"],[data-tick="fast-el"]').forEach(n => (n.textContent = mmss(el)));
  document.querySelectorAll('[data-tick="fast-sub"]').forEach(n => (n.textContent = subText(fa)));
  document.querySelectorAll('[data-tick="fast-pct"]').forEach(n => (n.textContent = Math.floor(p * 100) + "%"));
  document.querySelectorAll('[data-tick="fast-arc"]').forEach(n => { n.setAttribute("stroke-dasharray", (ARC * p).toFixed(1) + " " + C.toFixed(1)); n.removeAttribute("opacity"); });
}

function startFast(at) {
  const plan = planById(state.profile.fastPlan);
  state.profile.fastActive = { s: at, h: plan.hours };
  editStart = false; saveProfile(); buzz(30);
  toast("Fast started. Goal " + clock(at + plan.hours * H)); render();
}
act("fast-start", () => startFast(Date.now()));
act("fast-start-earlier", () => { startFast(Date.now() - H); editStart = true; render(); });
act("fast-edit-start", () => { editStart = !editStart; render(); });
onChange("fast-start-at", el => {
  const t = new Date(el.value).getTime();
  if (!t || t > Date.now()) { toast("Pick a time in the past"); return; }
  state.profile.fastActive.s = t; saveProfile(); editStart = false; render();
});
act("fast-end", el => {
  const fa = state.profile.fastActive; if (!fa) return;
  const e = Date.now(), hrs = (e - fa.s) / H;
  if (hrs < fa.h && !confirmTap("fast-end", el, `End now at ${hrs.toFixed(1)} h? Tap again`)) return;
  state.profile.fastActive = null; saveProfile();
  if (hrs < 0.25) { toast("Fast cancelled"); render(); return; }
  const d = day(iso(new Date(e)));
  d.fasts = [...(d.fasts || []), { s: fa.s, e, g: fa.h }];
  saveDay(d.date); buzz([60, 40, 120]);
  toast(hrs >= fa.h ? `Goal reached: ${hrs.toFixed(1)} h. Break it with protein first.` : `Fast saved: ${hrs.toFixed(1)} h`, hrs >= fa.h ? "badge-t" : "");
  render();
});
act("fast-del", el => {
  if (!confirmTap("fd" + el.dataset.s, el, "?")) return;
  const d = day(el.dataset.date);
  d.fasts = (d.fasts || []).filter(f => String(f.s) !== el.dataset.s);
  saveDay(el.dataset.date); toast("Fast deleted"); render();
});

act("fast-plans", () => {
  const cur = state.profile.fastPlan;
  openSheet({ title: "Fasting plan", html: `<h1 class="big-title">Choose your plan</h1>
    <p class="note">Hours fasting : hours eating. Start gentle and build up; consistency beats intensity.</p>
    <div class="plans">${FAST_PLANS.map(pl => `<button class="plan${pl.id === cur ? " on" : ""}" data-act="fast-plan" data-id="${pl.id}">
      ${pl.pro && !isPro() ? `<span class="lock">${ICON.lock}</span>` : ""}<b>${esc(pl.label)}</b><span>${esc(pl.blurb)}</span></button>`).join("")}</div>
    <div class="card"><div class="eyebrow">Training on a fasting plan</div><p class="note">Easy runs work well near the end of a fast. Hard sessions go better in your eating window. Past 24 hours, eat before any training. The coach on Today applies these rules for you.</p></div>` });
});
act("fast-plan", el => {
  const pl = FAST_PLANS.find(x => x.id === el.dataset.id);
  if (pl.pro && !isPro()) { closeSheet(); openPaywall("fastPlansPlus"); return; }
  state.profile.fastPlan = pl.id;
  if (state.profile.fastActive) state.profile.fastActive.h = pl.hours;
  saveProfile(); closeSheet(); toast(pl.label + " plan set"); render();
});
