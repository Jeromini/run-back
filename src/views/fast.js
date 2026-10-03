// Fast tab: the dial, stages, the Fast + Train coach, stats and history.
import { act, onChange, openSheet, closeSheet, confirmTap, toast, ICON } from "../lib/dom.js";
import { esc, mmss, hm } from "../lib/format.js";
import { pad } from "../lib/dates.js";
import { iso, addDays, today, nice, clock, dayClock, localInput, DOW } from "../lib/dates.js";
import { stackedBars } from "../lib/charts.js";
import { FAST_PLANS, CUSTOM_FAST } from "../config.js";
import { state, day, render } from "../core/state.js";
import { saveDay, saveProfile } from "../core/store.js";
import { isPro } from "../core/premium.js";
import { planFor, stageAt, STAGES, fastStats, allFasts, windowFor, EXTENDED_H, SUPERVISED_H, zoneHours, ZONES, EVIDENCE, hourNote, ROUTINE_PRESETS, routineSummary, routineLabel, nextStart, dueStart, adherence, fmt12 } from "../domain/fasting.js";
import { weekStart } from "../lib/dates.js";
import { pushSupport, remindersOn, enableReminders, disableReminders } from "../features/push.js";
import { coachCard } from "./today.js";
import { waterCard } from "../features/water.js";
import { openPaywall } from "../features/paywall.js";
import { buzz } from "../lib/sound.js";

const H = 3600000, R = 128, C = 2 * Math.PI * R, ARC = 0.75 * C;
const ZONE_COLORS = ["color-mix(in srgb, var(--fast) 35%, transparent)", "color-mix(in srgb, var(--fast) 65%, transparent)", "var(--fast)", "var(--rose)"];
let editStart = false, extAck = false, customOpen = false, lastHour = null, remindState = null, draft = null;
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
  const z7 = days7.map(k => zoneHours(state.days, fa, k)), hours7 = z7.map(z => z.zones.reduce((a, b) => a + b, 0));
  const last = allFasts(state.days)[0], justEnded = !fa && last && Date.now() - last.e < 8 * H;
  const hist = allFasts(state.days).slice(0, 10);
  root.innerHTML = `<section class="view">
    <div class="fasthead"><h1 class="big-title">Fast</h1>
      <button class="planbtn" data-act="fast-plans">${ICON.timer} ${esc(plan.label)} plan ${ICON.next}</button></div>
    ${dueBanner()}
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
        <div><div class="eyebrow">Now &middot; ${esc(hoursLabel(stage.from))}+</div><h3 style="font-size:18px;font-weight:800">${esc(stage.name)}</h3><span class="ev ev-${stage.ev}">${EVIDENCE[stage.ev]}</span><p class="note" style="margin-top:4px">${esc(stage.text)}</p></div></div>
        <ul class="changes">${stage.changes.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
        ${stage.next ? `<p class="note">Next: <b style="color:var(--ink)">${esc(stage.next.name)}</b> in ${hm(stage.nextIn * 3600)}</p>` : ""}</div>` : ""}
    ${fa ? liveCard(elH) : ""}
    ${routineCard()}
    ${timeline(fa, plan, elH)}
    ${justEnded ? `<div class="card"><div class="card-head"><h3>After your fast</h3><span class="note">Ended ${esc(dayClock(last.e))}</span></div>
      <p class="note">${(last.e - last.s) / H >= 48 ? "Refeed gently: a small protein-led meal first, then build up over the day." : "Break it with protein first: eggs, fish, chicken or Greek yoghurt, plus some vegetables."} Morning weigh-ins after a fast give the clearest trend.</p>
      <div class="quickacts">
        <button class="qa" data-act="tab" data-v="food"><i style="background:var(--rose-soft);color:var(--rose)">${ICON.food}</i>Log meal</button>
        <button class="qa" data-act="fast-weigh"><i style="background:var(--rose-soft);color:var(--rose)">${ICON.scale}</i>Weigh in</button>
        <button class="qa" data-act="water" data-ml="500" data-date="${t}"><i style="background:var(--water-soft);color:var(--water)">${ICON.water}</i>+ 500 ml</button>
        <button class="qa" data-act="tab" data-v="trends"><i style="background:var(--fast-soft);color:var(--fast)">${ICON.chart}</i>Trends</button></div></div>` : ""}
    ${coachCard()}
    <div class="stats four">
      <div class="stat"><b>${st.count}</b><span>fasts completed</span></div>
      <div class="stat"><b>${st.count ? st.avg.toFixed(1) + "h" : "-"}</b><span>average fast</span></div>
      <div class="stat"><b>${st.count ? st.longest.toFixed(1) + "h" : "-"}</b><span>longest fast</span></div>
      <div class="stat"><b>${st.count ? Math.round(st.hitRate * 100) + "%" : "-"}</b><span>goals reached</span></div>
    </div>
    <div class="card"><div class="card-head"><h3>Your fasting zones</h3><span class="note">${hours7.reduce((a, b) => a + b, 0).toFixed(1)} h this week</span></div>
      ${stackedBars({ labels: days7.map(k => DOW[new Date(k + "T12:00").getDay()].slice(0, 2)), series: ZONES.map((zn, i) => ({ values: z7.map(z => z.zones[i]), color: ZONE_COLORS[i] })),
        target: plan.hours <= 24 ? plan.hours : null, targetLabel: plan.hours <= 24 ? plan.hours + " h goal" : "", fmt: v => Math.round(v) + "h", marks: z7.map(z => z.goalHit) })}
      <div class="row note" style="gap:12px">${ZONES.map((zn, i) => `<span><i class="legend-dot" style="background:${ZONE_COLORS[i]}"></i>${esc(zn.name)}</span>`).join("")}</div>
      <p class="note">Hours in each zone per day. The dot under a day is green when a fast ending that day reached its goal, orange when it didn't.</p></div>
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
        <summary><span class="tl-dot" aria-hidden="true"></span><span class="tl-h">${esc(hoursLabel(s.from))}</span><span class="tl-n"><b>${esc(s.name)} <span class="ev ev-${s.ev}">${EVIDENCE[s.ev]}</span></b><small>${esc(when)}${beyond ? " &middot; beyond your goal" : ""}</small></span></summary>
        <div class="tl-body"><p>${esc(s.text)}</p><ul class="changes">${s.changes.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div></details>`;
    }).join("")}</div>
    <p class="note">Typical timings for a healthy adult; yours shift with what you ate before, activity and body composition. Tap a stage for details.</p>
    <p class="note"><span class="ev ev-strong">${EVIDENCE.strong}</span> consistent findings in people. <span class="ev ev-human">${EVIDENCE.human}</span> shown in human studies, timing varies. <span class="ev ev-early">${EVIDENCE.early}</span> mostly animal studies; not established in people.</p></div>`;
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
  // a new hour brings a new live note and possibly a new stage: redraw the Fast screen
  const hr = Math.floor(el / 3600);
  if (lastHour !== null && hr !== lastHour && state.view === "fast") { lastHour = hr; render(); return; }
  lastHour = hr;
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
  const hadRoutine = state.profile.routine && state.profile.routine.on;
  if (hadRoutine) state.profile.routine = { ...state.profile.routine, on: false };
  state.profile.fastPlan = pl.id;
  if (state.profile.fastActive) state.profile.fastActive.h = pl.hours;
  saveProfile(); closeSheet(); toast(pl.label + " plan set" + (hadRoutine ? ". Your routine is paused; turn it back on from Edit routine." : "")); render();
});
act("fast-custom-pick", el => { const i = document.getElementById("fc-h"); if (i) i.value = el.dataset.h; });
act("fast-custom-save", () => {
  const h = Math.round(Number(document.getElementById("fc-h").value));
  if (!h || h < CUSTOM_FAST.min || h > CUSTOM_FAST.max) { toast(`Choose ${CUSTOM_FAST.min} to ${CUSTOM_FAST.max} hours`); return; }
  state.profile.fastPlan = "custom"; state.profile.fastCustomH = h;
  if (state.profile.fastActive) state.profile.fastActive.h = h;
  saveProfile(); closeSheet(); toast(hoursLabel(h) + " fast set"); render();
});
act("fast-weigh", () => { state.view = "today"; state.sel = today(); render(); setTimeout(() => { const i = document.getElementById("q-w"); if (i) { i.scrollIntoView({ block: "center" }); i.focus(); } }, 60); });

// ---------- routine, live notes, reminders ----------
function dueBanner() {
  const p = state.profile, r = p.routine, t = dueStart(r, p.fastActive, allFasts(state.days)[0]);
  if (!t) return "";
  return `<div class="card" style="border-color:var(--fast)"><div class="card-head"><h3>Your ${esc(routineLabel(r))} fast was due at ${esc(fmt12(r.start))}</h3></div>
    <div class="row"><button class="btn fast" data-act="routine-start" data-at="${t}">I started at ${esc(fmt12(r.start))}</button><button class="btn" data-act="routine-start" data-at="now">Start now</button></div></div>`;
}
function liveCard(elH) {
  const n = hourNote(elH), nextIn = n.next ? (n.next.at - elH) * 3600 : null;
  return `<div class="card live-card"><div class="card-head"><span class="eyebrow"><i class="live-dot" aria-hidden="true"></i> Live &middot; hour ${n.hour}</span><span class="note">${esc(stageAt(elH).name)}</span></div>
    <h3 style="font-size:19px">${esc(n.title)}</h3><p class="note">${esc(n.text)}</p>
    ${n.next ? `<p class="note">Next, at hour ${n.next.at} (in ${hm(nextIn)}): <b style="color:var(--ink)">${esc(n.next.title)}</b></p>` : ""}</div>`;
}
const STATUS = { done: ["Done", "var(--good)"], live: ["Fasting", "var(--fast)"], due: ["Due", "var(--fast)"], missed: ["Missed", "var(--bad)"], short: ["Short", "var(--warn)"], upcoming: ["", "var(--line)"], off: ["", "transparent"] };
function routineCard() {
  const p = state.profile, r = p.routine;
  if (!r || !r.on) return `<div class="card"><div class="card-head"><h3>Make fasting a routine</h3></div>
    <p class="note">Pick a pattern, like 16:8 every day or 24 hours twice a week. The app tracks how well you keep it, reminds you when to start and when you're done, and tells you what's happening at each stage.</p>
    <button class="btn fast" data-act="routine-edit">${ICON.cal} Set up a routine</button></div>`;
  const ws = weekStart(today()), wk = adherence(r, state.days, p.fastActive, iso(ws)), sched = wk.filter(x => x.status !== "off"), kept = wk.filter(x => x.status === "done").length;
  const ns = nextStart(r);
  if (remindState === null) remindersOn().then(v => { remindState = v; if (state.view === "fast") render(); });
  return `<div class="card"><div class="card-head"><h3>Your routine</h3><button class="linkbtn" data-act="routine-edit">Edit</button></div>
    <p><b>${esc(routineSummary(r))}</b></p>
    <div class="weekdots">${wk.map(x => { const d = new Date(x.date + "T12:00"); const [lbl, col] = STATUS[x.status];
      return `<div class="wd ${x.status}"><span>${"SMTWTFS"[d.getDay()]}</span><i style="background:${col}"></i><small>${lbl}</small></div>`; }).join("")}</div>
    <p class="note">${kept} of ${sched.length} kept this week${ns && !p.fastActive ? ` &middot; next fast starts ${esc(dayClock(ns))}` : ""}.</p>
    <label class="switch"><span>Reminders on this phone<small>Before and at the start, at each new stage, 1 hour before the goal, and when you're done</small></span><input type="checkbox" data-act="remind-toggle"${remindState ? " checked" : ""}></label></div>`;
}
function routineHtml() {
  const d = draft;
  const days = [1, 2, 3, 4, 5, 6, 0];
  return `<h1 class="big-title">Fasting routine</h1>
    <p class="note">Start with a preset or build your own. You can change it any time.</p>
    <div class="eyebrow">Presets</div>
    <div class="plans">${ROUTINE_PRESETS.map(pr => `<button class="plan${d.preset === pr.id ? " on" : ""}" data-act="routine-preset" data-id="${pr.id}">${pr.hours >= 19 && !isPro() ? `<span class="lock">${ICON.lock}</span>` : ""}<b style="font-size:22px">${esc(pr.name)}</b><span>${esc(pr.blurb)}</span></button>`).join("")}</div>
    <div class="card"><h3>Or build your own</h3>
      <div class="eyebrow">Which days?</div>
      <div class="seg">${[["daily", "Every day"], ["days", "Chosen days"], ["alternate", "Every other day"]].map(([v, l]) => `<button type="button" data-act="routine-pattern" data-v="${v}" class="${d.pattern === v ? "on" : ""}">${l}</button>`).join("")}</div>
      ${d.pattern === "days" ? `<div class="chips">${days.map(x => `<button class="chip${(d.days || []).includes(x) ? " on" : ""}" data-act="routine-day" data-d="${x}">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][x]}</button>`).join("")}</div>` : ""}
      <div class="eyebrow">How long?</div>
      <div class="chips">${[12, 13, 14, 16, 18, 19, 20, 23, 24, 36, 48, 72].map(h => `<button class="chip${d.hours === h ? " on" : ""}" data-act="routine-hours" data-h="${h}">${routineLabel({ hours: h })}</button>`).join("")}</div>
      <label class="f">Fast starts at<input type="time" id="rt-start" value="${esc(d.start)}"></label>
      <p class="note" id="rt-sum">${esc(routineSummary({ ...d, on: true }))}</p>
      <button class="btn fast big" data-act="routine-save">Save routine</button>
      ${state.profile.routine && state.profile.routine.on ? `<button class="btn ghost" data-act="routine-off">Turn routine off</button>` : ""}</div>`;
}
const redraw = () => { const b = document.getElementById("rt-body"); if (b) b.innerHTML = routineHtml(); };
act("routine-edit", () => {
  const r = state.profile.routine;
  draft = r ? { ...r } : { pattern: "daily", days: [1, 2, 3, 4, 5], hours: 16, start: "20:00", preset: null };
  openSheet({ title: "Routine", html: `<div id="rt-body" style="display:flex;flex-direction:column;gap:14px">${routineHtml()}</div>` });
});
act("routine-preset", el => { const pr = ROUTINE_PRESETS.find(x => x.id === el.dataset.id); draft = { pattern: pr.pattern, days: pr.days || [1, 2, 3, 4, 5], hours: pr.hours, start: pr.start, preset: pr.id }; redraw(); });
act("routine-pattern", el => { draft.pattern = el.dataset.v; draft.preset = null; redraw(); });
act("routine-day", el => { const d = Number(el.dataset.d), s = new Set(draft.days || []); s.has(d) ? s.delete(d) : s.add(d); draft.days = [...s]; draft.preset = null; redraw(); });
act("routine-hours", el => { draft.hours = Number(el.dataset.h); draft.preset = null; redraw(); });
act("routine-save", () => {
  const t = document.getElementById("rt-start"); if (t && t.value) draft.start = t.value;
  if (draft.pattern === "days" && !(draft.days || []).length) { toast("Pick at least one day"); return; }
  if (draft.hours >= 19 && !isPro()) { closeSheet(); openPaywall("fastPlansPlus"); return; }
  const prev = state.profile.routine;
  state.profile.routine = { on: true, pattern: draft.pattern, days: draft.days, hours: draft.hours, start: draft.start, anchor: draft.anchor || today(),
    since: prev && prev.on && prev.since ? prev.since : today() };
  state.profile.tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  saveProfile(); closeSheet(); toast("Routine saved: " + routineSummary(state.profile.routine)); render();
});
act("routine-off", () => { state.profile.routine = { ...state.profile.routine, on: false }; saveProfile(); closeSheet(); toast("Routine turned off"); render(); });
act("routine-start", el => {
  const at = el.dataset.at === "now" ? Date.now() : Number(el.dataset.at), r = state.profile.routine;
  state.profile.fastActive = { s: at, h: r.hours }; saveProfile(); buzz(30);
  toast("Fast started. Goal " + dayClock(at + r.hours * H)); render();
});
act("remind-toggle", async el => {
  if (el.checked) {
    try { await enableReminders(); remindState = true; toast("Reminders on for this phone"); }
    catch (e) { el.checked = false; remindState = false; toast(e.message); }
  } else { await disableReminders(); remindState = false; toast("Reminders off"); }
});
