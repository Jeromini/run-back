// Fast tab: the dial, stages, the Fast + Train coach, stats and history.
import { act, onChange, openSheet, closeSheet, confirmTap, toast, ICON } from "../lib/dom.js";
import { esc, mmss, hm } from "../lib/format.js";
import { pad } from "../lib/dates.js";
import { iso, addDays, today, nice, clock, dayClock, localInput, DOW } from "../lib/dates.js";
import { barChart } from "../lib/charts.js";
import { FAST_PLANS, CUSTOM_FAST } from "../config.js";
import { state, day, render } from "../core/state.js";
import { saveDay, saveProfile } from "../core/store.js";
import { isPro } from "../core/premium.js";
import { planFor, stageAt, STAGES, fastStats, allFasts, windowFor, EXTENDED_H, SUPERVISED_H } from "../domain/fasting.js";
import { fastHours } from "../domain/metrics.js";
import { coachCard } from "./today.js";
import { waterCard } from "../features/water.js";
import { openPaywall } from "../features/paywall.js";
import { buzz } from "../lib/sound.js";

const H = 3600000, R = 128, C = 2 * Math.PI * R, ARC = 0.75 * C;
let editStart = false, extAck = false, customOpen = false;
// "52:10:33" reads badly on a multi-day fast, so show days once past 24 hours
const fastClock = sec => { sec = Math.max(0, Math.floor(sec)); if (sec < 86400) return mmss(sec); const d = Math.floor(sec / 86400), r = sec % 86400; return `${d}d ${pad(Math.floor(r / 3600))}:${pad(Math.floor(r % 3600 / 60))}:${pad(r % 60)}`; };
const hoursLabel = h => (h === 0 ? "Start" : h % 24 === 0 ? (h / 24) + (h === 24 ? " day" : " days") : h + " h");

function dial(fa) {
  const el = fa ? (Date.now() - fa.s) / H : 0, goal = fa ? fa.h : planFor(state.profile).hours;
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
      ? `<span class="lbl">${el >= goal ? "Goal reached" : "Fasting"}</span><span class="clock${el >= 24 ? " long" : ""}" data-tick="fast-clock">${fastClock(el * 3600)}</span><span class="sub" data-tick="fast-sub">${subText(fa)}</span>`
      : `<span class="lbl" style="color:var(--accent)">Eating window</span><span class="clock" style="font-size:44px">${esc(planFor(state.profile).label)}</span><span class="sub">${esc(windowText())}</span>`}</div>
    ${fa ? `<div class="pct" data-tick="fast-pct">${Math.floor(p * 100)}%</div>` : ""}</div>`;
}
function subText(fa) {
  const left = fa.s + fa.h * H - Date.now(), dayN = Math.floor((Date.now() - fa.s) / (24 * H)) + 1;
  const rest = left > 0 ? hm(left / 1000) + " to go" : "+" + hm(-left / 1000) + " past goal";
  return fa.h >= 24 ? `Day ${dayN} · ${rest}` : rest;
}
function windowText() {
  const plan = planFor(state.profile), last = allFasts(state.days)[0];
  const w = windowFor(null, last, plan.hours);
  if (!w.closesAt) return "Start your first fast when you finish eating";
  return w.overdue ? "Your window has closed: time to fast" : "Window closes " + dayClock(w.closesAt);
}

export function renderFast(root) {
  const p = state.profile, fa = p.fastActive, plan = planFor(p), st = fastStats(state.days);
  const elH = fa ? (Date.now() - fa.s) / H : 0, extended = !fa && plan.hours >= EXTENDED_H;
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
      : `<div><span class="eyebrow">Plan</span><b>${plan.hours >= 24 ? hoursLabel(plan.hours) + " fast, then normal eating" : plan.hours + " h fast &middot; " + (24 - plan.hours) + " h eating"}</b></div>
         <div><span class="eyebrow">If you start now</span><b>Goal ${esc(dayClock(Date.now() + plan.hours * H))}</b></div>`}</div>
    ${editStart && fa ? `<div class="card tight"><label class="f">When did this fast start?<input type="datetime-local" value="${localInput(fa.s)}" max="${localInput(Date.now())}" data-chg="fast-start-at"></label></div>` : ""}
    ${fa
      ? `<button class="btn fast big" data-act="fast-end">End fast</button>`
      : `${extended ? checklist(plan) : ""}<button class="btn fast big" data-act="fast-start"${extended && !extAck ? " disabled" : ""}>${ICON.play} Start ${esc(plan.label)} fast now</button>
         <button class="linkbtn" data-act="fast-start-earlier" style="text-align:center">Finished eating earlier? Set the start time</button>`}
    ${fa && elH >= SUPERVISED_H ? `<div class="callout red"><b>You're past 3 days.</b> Fasting this long should be medically supervised. Break the fast now if you feel dizzy, faint, confused or have palpitations, and refeed gently with small protein-led meals.</div>` : ""}
    ${stage ? `<div class="card"><div class="stage"><span class="n">${STAGES.indexOf(STAGES.find(s => s.name === stage.name)) + 1}</span>
        <div><div class="eyebrow">Now &middot; ${esc(hoursLabel(stage.from))}+</div><h3 style="font-size:18px;font-weight:800">${esc(stage.name)}</h3><p class="note" style="margin-top:4px">${esc(stage.text)}</p></div></div>
        <ul class="changes">${stage.changes.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
        ${stage.next ? `<p class="note">Next: <b style="color:var(--ink)">${esc(stage.next.name)}</b> in ${hm(stage.nextIn * 3600)}</p>` : ""}</div>` : ""}
    ${timeline(fa, plan, elH)}
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

// What happens through the fast: every stage up to the goal (and the next one after it).
function timeline(fa, plan, elH) {
  const goal = fa ? fa.h : plan.hours, upto = Math.max(goal, elH);
  const shown = STAGES.filter((s, i) => s.from <= upto || (i > 0 && STAGES[i - 1].from <= upto));
  return `<div class="card"><div class="card-head"><h3>What happens as you fast</h3><span class="note">${shown.length} stages</span></div>
    <div class="timeline">${shown.map(s => {
      const next = STAGES[STAGES.indexOf(s) + 1], done = fa && next && elH >= next.from, now = fa && elH >= s.from && !done, beyond = s.from > goal;
      const when = fa ? (s.from === 0 ? "Started " + dayClock(fa.s) : dayClock(fa.s + s.from * H)) : (s.from === 0 ? "When you start" : "After " + hoursLabel(s.from));
      return `<details class="tl-row${now ? " now" : done ? " done" : ""}"${now ? " open" : ""}>
        <summary><span class="tl-dot" aria-hidden="true"></span><span class="tl-h">${esc(hoursLabel(s.from))}</span><span class="tl-n"><b>${esc(s.name)}</b><small>${esc(when)}${beyond ? " &middot; beyond your goal" : ""}</small></span></summary>
        <div class="tl-body"><p>${esc(s.text)}</p><ul class="changes">${s.changes.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div></details>`;
    }).join("")}</div>
    <p class="note">Typical timings for a healthy adult; yours shift with what you ate before, activity and body composition. Tap a stage for details.</p></div>`;
}
function checklist(plan) {
  return `<div class="card" style="border-color:var(--warn)"><h3>Before an extended fast</h3>
    <ul class="changes">
      <li>Drink plenty of water and add electrolytes: sodium (a pinch of salt), potassium and magnesium.</li>
      <li>No hard training. Easy walks are fine.</li>
      <li>Stop and eat if you feel dizzy, faint, confused or have palpitations.</li>
      <li>Not for you if you're pregnant or breastfeeding, have diabetes or take blood-sugar or blood-pressure medication, are underweight, or have a history of eating disorders, unless your doctor agrees.</li>
      ${plan.hours > SUPERVISED_H ? `<li><b>Beyond 3 days, fast only with medical supervision.</b></li>` : ""}
      <li>Break the fast gently: a small, protein-led meal first, then build up over a day${plan.hours >= 96 ? " or two" : ""}.</li>
    </ul>
    <label class="check"><input type="checkbox" data-act="fast-ack"${extAck ? " checked" : ""}> I've read this</label></div>`;
}

// Live updates every second, without re-rendering the page.
export function tickFast() {
  const fa = state.profile.fastActive; if (!fa) return;
  const el = (Date.now() - fa.s) / 1000, p = Math.min(1, el / (fa.h * 3600));
  document.querySelectorAll('[data-tick="fast-clock"],[data-tick="fast-el"]').forEach(n => (n.textContent = fastClock(el)));
  document.querySelectorAll('[data-tick="fast-sub"]').forEach(n => (n.textContent = subText(fa)));
  document.querySelectorAll('[data-tick="fast-pct"]').forEach(n => (n.textContent = Math.floor(p * 100) + "%"));
  document.querySelectorAll('[data-tick="fast-arc"]').forEach(n => { n.setAttribute("stroke-dasharray", (ARC * p).toFixed(1) + " " + C.toFixed(1)); n.removeAttribute("opacity"); });
}

function startFast(at) {
  const plan = planFor(state.profile);
  if (plan.hours >= EXTENDED_H && !extAck) { toast("Read the checklist and tick it first"); return; }
  state.profile.fastActive = { s: at, h: plan.hours };
  editStart = false; extAck = false; saveProfile(); buzz(30);
  toast("Fast started. Goal " + clock(at + plan.hours * H)); render();
}
act("fast-start", () => startFast(Date.now()));
act("fast-ack", el => { extAck = el.checked; const b = document.querySelector('[data-act="fast-start"]'); if (b) b.disabled = !extAck; });
act("fast-start-earlier", () => { startFast(Date.now() - H); if (state.profile.fastActive) { editStart = true; render(); } });
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
  toast(hrs >= 48 ? `Fast saved: ${hrs.toFixed(1)} h. Refeed gently: a small protein meal first, then build up.`
    : hrs >= fa.h ? `Goal reached: ${hrs.toFixed(1)} h. Break it with protein first.` : `Fast saved: ${hrs.toFixed(1)} h`, hrs >= fa.h ? "badge-t" : "");
  render();
});
act("fast-del", el => {
  if (!confirmTap("fd" + el.dataset.s, el, "?")) return;
  const d = day(el.dataset.date);
  d.fasts = (d.fasts || []).filter(f => String(f.s) !== el.dataset.s);
  saveDay(el.dataset.date); toast("Fast deleted"); render();
});

function plansHtml() {
  const ch = state.profile.fastCustomH || 24;
  return `<h1 class="big-title">Choose your plan</h1>
    <p class="note">Daily plans are hours fasting : hours eating. Extended fasts run a day or more. Start gentle and build up; consistency beats intensity.</p>
    <div class="eyebrow">Daily</div>
    <div class="plans">${FAST_PLANS.filter(pl => pl.hours && pl.hours < 24).map(planTile).join("")}</div>
    <div class="eyebrow">Extended</div>
    <div class="plans">${FAST_PLANS.filter(pl => !pl.hours || pl.hours >= 24).map(planTile).join("")}</div>
    ${customOpen ? `<div class="card"><h3>Custom fast</h3>
      <label class="f">Length in hours (${CUSTOM_FAST.min} to ${CUSTOM_FAST.max}, up to 7 days)<input type="number" id="fc-h" inputmode="numeric" min="${CUSTOM_FAST.min}" max="${CUSTOM_FAST.max}" value="${ch}"></label>
      <div class="chips">${[24, 36, 48, 60, 72, 96, 120, 168].map(h => `<button class="chip" data-act="fast-custom-pick" data-h="${h}">${hoursLabel(h)}</button>`).join("")}</div>
      <button class="btn fast big" data-act="fast-custom-save">Use this length</button></div>` : ""}`;
}
const planTile = pl => `<button class="plan${pl.id === state.profile.fastPlan ? " on" : ""}" data-act="fast-plan" data-id="${pl.id}">
  ${pl.pro && !isPro() ? `<span class="lock">${ICON.lock}</span>` : ""}<b>${esc(pl.id === "custom" && state.profile.fastPlan === "custom" ? planFor(state.profile).label : pl.label)}</b><span>${esc(pl.blurb)}</span></button>`;
act("fast-plans", () => {
  customOpen = false;
  openSheet({ title: "Fasting plan", html: `<div id="plans-body" style="display:flex;flex-direction:column;gap:14px">${plansHtml()}</div>
    <div class="card"><div class="eyebrow">Training on a fasting plan</div><p class="note">Easy runs work well near the end of a fast. Hard sessions go better in your eating window. Past 24 hours, eat before any training. The coach on Today applies these rules for you.</p></div>` });
});
act("fast-plan", el => {
  const pl = FAST_PLANS.find(x => x.id === el.dataset.id);
  if (pl.pro && !isPro()) { closeSheet(); openPaywall("fastPlansPlus"); return; }
  if (pl.id === "custom") { customOpen = true; document.getElementById("plans-body").innerHTML = plansHtml(); setTimeout(() => { const i = document.getElementById("fc-h"); if (i) i.scrollIntoView({ block: "center" }); }, 30); return; }
  state.profile.fastPlan = pl.id;
  if (state.profile.fastActive) state.profile.fastActive.h = pl.hours;
  saveProfile(); closeSheet(); toast(pl.label + " plan set"); render();
});
act("fast-custom-pick", el => { const i = document.getElementById("fc-h"); if (i) i.value = el.dataset.h; });
act("fast-custom-save", () => {
  const h = Math.round(Number(document.getElementById("fc-h").value));
  if (!h || h < CUSTOM_FAST.min || h > CUSTOM_FAST.max) { toast(`Choose ${CUSTOM_FAST.min} to ${CUSTOM_FAST.max} hours`); return; }
  state.profile.fastPlan = "custom"; state.profile.fastCustomH = h;
  if (state.profile.fastActive) state.profile.fastActive.h = h;
  saveProfile(); closeSheet(); toast(hoursLabel(h) + " fast set"); render();
});
