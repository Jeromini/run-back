// Fast tab: the dial, stages, the Fast + Train coach, stats and history.
import { act, onChange, openSheet, closeSheet, confirmTap, toast, sheetOpen, setInert, restoreFocus, ICON } from "../lib/dom.js";
import { esc, mmss, hm } from "../lib/format.js";
import { pad } from "../lib/dates.js";
import { iso, addDays, today, nice, clock, dayClock, localInput, DOW } from "../lib/dates.js";
import { stackedBars } from "../lib/charts.js";
import { FAST_PLANS, CUSTOM_FAST } from "../config.js";
import { state, S, day, render } from "../core/state.js";
import { saveDay, saveProfile, profileReady } from "../core/store.js";
import { isPro } from "../core/premium.js";
import { planFor, stageAt, STAGES, fastStats, allFasts, windowFor, EXTENDED_H, SUPERVISED_H, zoneHours, ZONES, EVIDENCE, hourNote, ROUTINE_PRESETS, routineSummary, routineLabel, nextFast, dueFast, routineDays, onPattern, spanText, shiftDate, fmt12 } from "../domain/fasting.js";
import { weekStart } from "../lib/dates.js";
import { pushSupport, remindersOn, enableReminders, disableReminders } from "../features/push.js";
import { coachCard, openWeigh } from "./today.js";
import { openPaywall } from "../features/paywall.js";
import { buzz } from "../lib/sound.js";
import { celebrate } from "../features/celebrate.js";

const H = 3600000, R = 128, C = 2 * Math.PI * R, ARC = 0.75 * C;
const ZONE_COLORS = ["var(--walk)", "color-mix(in srgb, var(--fast) 55%, var(--surface))", "var(--fast)", "var(--fast-ink)"];
let editStart = false, extAck = false, customOpen = false, lastHour = null, remindState = null, draft = null, pendingPlan = null, planAck = false;
// "52:10:33" reads badly on a multi-day fast, so show days once past 24 hours
const fastClock = sec => { sec = Math.max(0, Math.floor(sec)); if (sec < 86400) return mmss(sec); const d = Math.floor(sec / 86400), r = sec % 86400; return `${d}d ${pad(Math.floor(r / 3600))}:${pad(Math.floor(r % 3600 / 60))}:${pad(r % 60)}`; };
const stageIdx = h => STAGES.indexOf(STAGES.find(s => s.name === stageAt(h).name));
const hoursLabel = h => (h === 0 ? "Start" : h % 24 === 0 ? (h / 24) + (h === 24 ? " day" : " days") : h + " h");

// The dial: a thin 270-degree instrument. Stage ticks sit inside the arc, the start and the goal are
// labelled at its two ends, and the text in the middle is kept short enough to fit the ring.
const shortWhen = ts => { const d = new Date(ts), same = new Date().toDateString() === d.toDateString(); return (same ? "today " : DOW[d.getDay()] + " ") + clock(ts); };
function dial(fa) {
  const plan = planFor(state.profile), el = fa ? (Date.now() - fa.s) / H : 0, goal = fa ? fa.h : plan.hours;
  const p = Math.min(1, el / goal), pt = f => { const a = (135 + 270 * f) * Math.PI / 180; return [150 + Math.cos(a), 150 + Math.sin(a)]; };
  const at = (f, r) => { const [cx, cy] = pt(f); return [150 + (cx - 150) * r, 150 + (cy - 150) * r]; };
  const ticks = STAGES.filter(s => s.from > 0 && s.from < goal).map(s => {
    const f = s.from / goal, [x1, y1] = at(f, R - 14), [x2, y2] = at(f, R - 24);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${el >= s.from ? "var(--fast)" : "var(--faint)"}" stroke-width="2" stroke-linecap="round"/>`;
  }).join("");
  const [sx, sy] = at(0, R + 2), [ex, ey] = at(1, R + 2);
  const goalLbl = goal % 24 === 0 && goal >= 24 ? goal / 24 + (goal === 24 ? " day" : " days") : goal + " h";
  let mid;
  if (fa) mid = `<span class="lbl">${el >= goal ? "Goal reached" : "Fasting"}</span><span class="clock${el >= 24 ? " long" : ""}" data-tick="fast-clock">${fastClock(el * 3600)}</span><span class="sub" data-tick="fast-sub">${subText(fa)}</span>`;
  else if (plan.hours >= 24) mid = `<span class="lbl ready">Ready when you are</span><span class="clock big">${esc(plan.label)}</span><span class="sub">Start now and you finish<br><b>${esc(shortWhen(Date.now() + plan.hours * H))}</b></span>`;
  else mid = `<span class="lbl ready">Eating window</span><span class="clock big">${esc(plan.label)}</span><span class="sub">${esc(windowText())}</span>`;
  return `<div class="dial"><svg viewBox="0 0 300 300" aria-hidden="true">
      <circle cx="150" cy="150" r="${R}" fill="none" stroke="var(--line)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${ARC.toFixed(1)} ${C.toFixed(1)}" transform="rotate(135 150 150)"/>
      <circle data-tick="fast-arc" cx="150" cy="150" r="${R}" fill="none" stroke="var(--fast)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(ARC * p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(135 150 150)"${p ? "" : ' opacity="0"'}/>
      ${ticks}
      <text x="${(sx + 6).toFixed(1)}" y="${(sy + 22).toFixed(1)}" text-anchor="middle" class="dial-end">Start</text>
      <text x="${(ex - 6).toFixed(1)}" y="${(ey + 22).toFixed(1)}" text-anchor="middle" class="dial-end">${esc(goalLbl)}</text></svg>
    <div class="mid">${mid}</div>
    ${fa ? `<div class="pct" data-tick="fast-pct">${Math.floor(p * 100)}%</div>` : ""}</div>`;
}
function subText(fa) {
  const left = fa.s + fa.h * H - Date.now(), dayN = Math.floor((Date.now() - fa.s) / (24 * H)) + 1;
  const rest = left > 0 ? hm(left / 1000) + " to go" : "+" + hm(-left / 1000) + " past goal";
  return fa.h >= 24 ? `Day ${dayN} · ${rest}` : rest;
}
function windowText() {
  const plan = planFor(state.profile), last = allFasts(state.days)[0];
  // a fast of a day or more has no daily eating window: say when it would end instead
  if (plan.hours >= 24) return "Finish " + shortWhen(Date.now() + plan.hours * H) + " if you start now";
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
    ${fa ? actionBlock(fa, elH)
      : `${extended ? checklist(plan) : ""}<button class="btn fast big" data-act="fast-start"${extended && !extAck ? " disabled" : ""}>${ICON.play} Start ${esc(plan.label)} fast now</button>
         <button class="linkbtn" data-act="fast-start-earlier" style="text-align:center">Finished eating earlier? Set the start time</button>
         <p class="note">Fasting isn't right for everyone. Skip it if you're pregnant, have a history of eating disorders, or have diabetes or take medication without your doctor's advice.</p>`}
    ${fa && elH >= SUPERVISED_H ? `<div class="callout red"><b>You're past 3 days.</b> Fasting this long should be medically supervised. Break the fast now if you feel dizzy, faint, confused or have palpitations, and refeed gently with small protein-led meals.</div>` : ""}
    ${fa ? coachCard() : ""}
    ${fa ? nowCard(elH) : ""}
    ${fa && !(p.routine && p.routine.on) ? "" : routineCard()}
    ${timeline(fa, plan, elH)}
    ${justEnded ? `<div class="card"><div class="card-head"><h3>After your fast</h3><span class="note">Ended ${esc(dayClock(last.e))}</span></div>
      <p class="note">${(last.e - last.s) / H >= 48 ? "Refeed gently: a small protein-led meal first, then build up over the day." : "Break it with protein first: eggs, fish, chicken or Greek yoghurt, plus some vegetables."} Morning weigh-ins after a fast give the clearest trend.</p>
      <div class="quickacts">
        <button class="qa" data-act="tab" data-v="food"><i style="background:var(--rose-soft);color:var(--rose)">${ICON.food}</i>Log meal</button>
        <button class="qa" data-act="fast-weigh"><i style="background:var(--rose-soft);color:var(--rose)">${ICON.scale}</i>Weigh in</button>
        <button class="qa" data-act="water" data-ml="500" data-date="${t}"><i style="background:var(--water-soft);color:var(--water)">${ICON.water}</i>+ 500 ml</button>
        <button class="qa" data-act="tab" data-v="trends"><i style="background:var(--fast-soft);color:var(--fast-ink)">${ICON.chart}</i>Trends</button></div></div>` : ""}
    ${fa ? "" : coachCard()}
    <details class="card fold"${fa ? "" : " open"}><summary><h3>History and trends</h3><span class="note">${st.count} fast${st.count === 1 ? "" : "s"} completed</span></summary>
    <div class="stats four">
      <div class="stat"><b>${st.count}</b><span>fasts completed</span></div>
      <div class="stat"><b>${st.count ? st.avg.toFixed(1) + "h" : "-"}</b><span>average fast</span></div>
      <div class="stat"><b>${st.count ? st.longest.toFixed(1) + "h" : "-"}</b><span>longest fast</span></div>
      <div class="stat"><b>${st.count ? Math.round(st.hitRate * 100) + "%" : "-"}</b><span>goals reached</span></div>
    </div>
    <div class="card-head"><h3>Your fasting zones</h3><span class="note">${hours7.reduce((a, b) => a + b, 0).toFixed(1)} h this week</span></div>
      ${stackedBars({ labels: days7.map(k => DOW[new Date(k + "T12:00").getDay()].slice(0, 2)), series: ZONES.map((zn, i) => ({ values: z7.map(z => z.zones[i]), color: ZONE_COLORS[i] })),
        target: plan.hours <= 24 ? plan.hours : null, targetLabel: plan.hours <= 24 ? plan.hours + " h goal" : "", fmt: v => Math.round(v) + "h", marks: z7.map(z => z.goalHit) })}
      <div class="row note" style="gap:12px">${ZONES.map((zn, i) => `<span><i class="legend-dot" style="background:${ZONE_COLORS[i]}"></i>${esc(zn.name)}</span>`).join("")}</div>
      <p class="note">Hours in each zone per day. The dot under a day is green when a fast ending that day reached its goal, orange when it didn't.</p>
    <div class="card-head"><h3>History</h3></div>
      ${hist.length ? `<div class="list">${hist.map(f => { const h = (f.e - f.s) / H, hit = h >= f.g - 0.01; return `<div class="li">
        <div><div class="a">${esc(nice(f.date))}</div><div class="b">${esc(clock(f.s))} to ${esc(clock(f.e))} &middot; goal ${f.g} h</div></div>
        <span class="v" style="color:${hit ? "var(--good)" : "var(--ink)"}">${h.toFixed(1)}h</span>
        <button class="x" data-act="fast-del" data-date="${f.date}" data-s="${f.s}" aria-label="Delete this fast">&times;</button></div>`; }).join("")}</div>`
        : `<p class="note">Completed fasts appear here.</p>`}</details>
  </section>`;
}

// During a fast: before the goal, one End button; past it, a clear verdict, Break and Extend.
function actionBlock(fa, elH) {
  if (elH < fa.h) return `<button class="btn fast big" data-act="fast-end">End fast</button>`;
  const ext = fa.h + 4, crossing = fa.h < EXTENDED_H && ext >= EXTENDED_H;
  const verdict = elH >= 24 ? "Goal done. Past a day, break the fast before any training and refeed gently, protein first."
    : "Goal done. Fine to keep going if you feel good; eat before any hard training.";
  return `<div class="pastgoal"><p>${esc(verdict)}</p>
    <div class="row"><button class="btn fast big" style="flex:2" data-act="fast-end">Break your fast</button>
    <button class="btn big" style="flex:1" data-act="fast-extend"${crossing ? ' data-cross="1"' : ""}>+4 h goal</button></div></div>`;
}
// One "now" card: the stage you're in, what's happening this hour, and a single "next".
function nowCard(elH) {
  const st = stageAt(elH), n = hourNote(elH), idx = STAGES.indexOf(STAGES.find(x => x.name === st.name));
  return `<div class="card live-card"><div class="card-head"><span class="livek"><i class="live-dot" aria-hidden="true"></i> Live &middot; hour ${n.hour}</span><span class="note">Stage ${idx + 1} of ${STAGES.length}</span></div>
    <div class="stage"><span class="n">${idx + 1}</span><div><h2 class="stage-t">${esc(st.name)}</h2><span class="ev ev-${st.ev}">${EVIDENCE[st.ev]}</span></div></div>
    <p><b>${esc(n.title)}.</b> ${esc(n.text)}</p>
    <ul class="changes">${st.changes.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
    ${st.next ? `<p class="note">Next: <b style="color:var(--ink)">${esc(st.next.name)}</b> in ${hm(st.nextIn * 3600)}</p>` : ""}</div>`;
}

// What happens through the fast: every stage up to the goal (and the next one after it).
function timeline(fa, plan, elH) {
  const goal = fa ? fa.h : plan.hours, upto = Math.max(goal, elH);
  const shown = STAGES.filter((s, i) => s.from <= upto || (i > 0 && STAGES[i - 1].from <= upto));
  return `<div class="card"><div class="card-head"><h3>What happens as you fast</h3><span class="note">${shown.length} of ${STAGES.length} stages</span></div>
    <div class="timeline">${shown.map(s => {
      const next = STAGES[STAGES.indexOf(s) + 1], done = fa && next && elH >= next.from, now = fa && elH >= s.from && !done, beyond = s.from > goal;
      const when = fa ? (s.from === 0 ? "Started " + dayClock(fa.s) : dayClock(fa.s + s.from * H)) : (s.from === 0 ? "When you start" : "After " + hoursLabel(s.from));
      return `<details class="tl-row${now ? " now" : done ? " done" : ""}"${now ? " open" : ""}>
        <summary><span class="tl-dot" aria-hidden="true"></span><span class="tl-h">${esc(hoursLabel(s.from))}</span><span class="tl-n"><b>${esc(s.name)}</b><small>${esc(when)}${beyond ? " &middot; beyond your goal" : ""}<span class="ev ev-${s.ev}">${EVIDENCE[s.ev]}</span></small></span></summary>
        <div class="tl-body"><p>${esc(s.text)}</p><ul class="changes">${s.changes.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div></details>`;
    }).join("")}</div>
    <p class="note">Typical timings for a healthy adult; yours shift with what you ate before, activity and body composition. Tap a stage for details.</p>
    <ul class="evkey" aria-label="What the evidence labels mean">
      <li><span class="ev ev-strong">${EVIDENCE.strong}</span><span>Consistent findings in people.</span></li>
      <li><span class="ev ev-human">${EVIDENCE.human}</span><span>Shown in human studies; timing varies.</span></li>
      <li><span class="ev ev-early">${EVIDENCE.early}</span><span>Mostly animal studies; not established in people.</span></li></ul></div>`;
}
function checklist(plan, ackAct = "fast-ack", acked = extAck) {
  return `<div class="card" style="border-color:var(--warn)"><h3>Before an extended fast</h3>
    <ul class="changes">
      <li>Drink plenty of water and add electrolytes: sodium (a pinch of salt), potassium and magnesium.</li>
      <li>No hard training. Easy walks are fine.</li>
      <li>Stop and eat if you feel dizzy, faint, confused or have palpitations.</li>
      <li>Not for you if you're pregnant or breastfeeding, have diabetes or take blood-sugar or blood-pressure medication, are underweight, or have a history of eating disorders, unless your doctor agrees.</li>
      ${plan.hours > SUPERVISED_H ? `<li><b>Beyond 3 days, fast only with medical supervision.</b></li>` : ""}
      <li>Break the fast gently: a small, protein-led meal first, then build up over a day${plan.hours >= 96 ? " or two" : ""}.</li>
    </ul>
    <label class="check"><input type="checkbox" data-act="${ackAct}"${acked ? " checked" : ""}> I've read this</label></div>`;
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
  state.profile.fastActive = { s: at, h: plan.hours, seen: stageIdx((Date.now() - at) / H) };
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
  if (!state.profile.fastActive) { editStart = false; render(); return; }
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
  saveDay(d.date);
  if (hrs >= fa.h) celebrate({ title: `${hrs.toFixed(1)} hours`, sub: hrs >= 48 ? "Goal reached. Refeed gently: a small protein-led meal first, then build up over the day." : "Goal reached. Break it with protein first, then a normal meal.", tone: "fast", cta: "Done" });
  else { buzz([60, 40, 120]); toast(`Fast saved: ${hrs.toFixed(1)} h`); }
  render();
});
act("fast-extend", el => {
  const fa = state.profile.fastActive; if (!fa) return;
  if (el.dataset.cross && !confirmTap("fast-extend", el, "Past 36 h: electrolytes, no hard training. Tap again")) return;
  fa.h += 4; saveProfile(); toast("New goal " + dayClock(fa.s + fa.h * H)); render();
});
act("fast-del", el => {
  if (!confirmTap("fd" + el.dataset.s, el, "Delete?")) return;
  const d = day(el.dataset.date);
  d.fasts = (d.fasts || []).filter(f => String(f.s) !== el.dataset.s);
  saveDay(el.dataset.date); toast("Fast deleted"); render();
});

function plansHtml() {
  const ch = state.profile.fastCustomH || 24;
  if (pendingPlan) {
    const pl = pendingPlan, fa = state.profile.fastActive, long = pl.hours >= EXTENDED_H;
    return `<h1 class="big-title">${esc(pl.label)} plan</h1>
      <p class="note">You're ${hm((Date.now() - fa.s) / 1000)} into a ${fa.h} h fast. Should the new plan change this fast's goal too?</p>
      ${long ? checklist(pl, "plan-ack", planAck) : ""}
      <button class="btn fast big" data-act="plan-apply" data-now="1"${long && !planAck ? " disabled" : ""}>Change this fast's goal to ${esc(hoursLabel(pl.hours))}</button>
      <button class="btn big" data-act="plan-apply">Start from my next fast</button>
      <button class="linkbtn" data-act="plan-cancel" style="text-align:center">Keep my current plan</button>`;
  }
  return `<h1 class="big-title">Choose your plan</h1>
    <p class="note">Daily plans are hours fasting : hours eating. Extended fasts run a day or more. Start gentle and build up; consistency beats intensity.</p>
    <div class="eyebrow">Daily</div>
    <div class="plans">${FAST_PLANS.filter(pl => pl.hours && pl.hours < 24).map(planTile).join("")}</div>
    <div class="eyebrow">Extended</div>
    <div class="plans">${FAST_PLANS.filter(pl => !pl.hours || pl.hours >= 24).map(planTile).join("")}</div>
    ${customOpen ? `<div class="card"><h3>Custom fast</h3>
      <label class="f">Length in hours (${CUSTOM_FAST.min} to ${CUSTOM_FAST.max}, up to 7 days)<input type="number" id="fc-h" inputmode="numeric" min="${CUSTOM_FAST.min}" max="${CUSTOM_FAST.max}" value="${ch}"></label>
      <div class="chips">${[24, 36, 48, 60, 72, 96, 120, 168].map(h => `<button class="chip" data-act="fast-custom-pick" data-h="${h}">${hoursLabel(h)}</button>`).join("")}</div>
      <button class="btn fast big" data-act="fast-custom-save">Use this length</button></div>` : ""}
    <button class="btn" data-act="routine-edit">${ICON.cal} ${state.profile.routine && state.profile.routine.on ? "Edit your fasting routine" : "Fast on chosen days instead: set up a routine"}</button>`;
}
const planTile = pl => `<button class="plan${pl.id === state.profile.fastPlan ? " on" : ""}" data-act="fast-plan" data-id="${pl.id}">
  ${pl.pro && !isPro() ? `<span class="lock">${ICON.lock}</span>` : (pl.id === "16:8" || pl.id === "14:10") && fastStats(state.days).count < 3 ? `<span class="rec">Start here</span>` : ""}<b>${esc(pl.id === "custom" && state.profile.fastPlan === "custom" ? planFor(state.profile).label : pl.label)}</b><span>${esc(pl.blurb)}</span></button>`;
act("fast-plans", () => {
  customOpen = false; pendingPlan = null; planAck = false;
  openSheet({ title: "Fasting plan", html: `<div id="plans-body" style="display:flex;flex-direction:column;gap:14px">${plansHtml()}</div>
    <div class="card"><div class="eyebrow">Training on a fasting plan</div><p class="note">Easy runs work well near the end of a fast. Hard sessions go better in your eating window. Past 24 hours, eat before any training. The coach on Today applies these rules for you.</p></div>` });
});
act("fast-plan", el => {
  const pl = FAST_PLANS.find(x => x.id === el.dataset.id);
  if (pl.pro && !isPro()) { closeSheet(); openPaywall("fastPlansPlus"); return; }
  if (pl.id === "custom") { customOpen = true; document.getElementById("plans-body").innerHTML = plansHtml(); setTimeout(() => { const i = document.getElementById("fc-h"); if (i) i.scrollIntoView({ block: "center" }); }, 30); return; }
  const fa = state.profile.fastActive;
  if (fa && pl.hours !== fa.h) { pendingPlan = pl; planAck = false; document.getElementById("plans-body").innerHTML = plansHtml(); return; }
  setPlan(pl, false);
});
function setPlan(pl, applyNow) {
  const hadRoutine = state.profile.routine && state.profile.routine.on;
  if (hadRoutine) state.profile.routine = { ...state.profile.routine, on: false };
  state.profile.fastPlan = pl.id;
  if (applyNow && state.profile.fastActive) state.profile.fastActive.h = pl.hours;
  pendingPlan = null; planAck = false;
  saveProfile(); closeSheet(); toast(pl.label + " plan set" + (applyNow ? ", this fast's goal is now " + hoursLabel(pl.hours) : state.profile.fastActive ? ", from your next fast" : "") + (hadRoutine ? ". Your routine is paused; turn it back on from Edit routine." : "")); render();
}
act("plan-ack", el => { planAck = el.checked; const b = document.querySelector('[data-act="plan-apply"][data-now]'); if (b) b.disabled = !planAck; });
act("plan-apply", el => { if (pendingPlan) setPlan(pendingPlan, !!el.dataset.now); });
act("plan-cancel", () => { pendingPlan = null; document.getElementById("plans-body").innerHTML = plansHtml(); });
act("fast-custom-pick", el => { const i = document.getElementById("fc-h"); if (i) i.value = el.dataset.h; });
act("fast-custom-save", () => {
  const h = Math.round(Number(document.getElementById("fc-h").value));
  if (!h || h < CUSTOM_FAST.min || h > CUSTOM_FAST.max) { toast(`Choose ${CUSTOM_FAST.min} to ${CUSTOM_FAST.max} hours`); return; }
  state.profile.fastPlan = "custom"; state.profile.fastCustomH = h;
  if (state.profile.fastActive) state.profile.fastActive.h = h;
  saveProfile(); closeSheet(); toast(hoursLabel(h) + " fast set"); render();
});
act("fast-weigh", () => { state.sel = today(); openWeigh(); });

// ---------- routine, live notes, reminders ----------
const DAYN3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hhmm = ts => { const d = new Date(ts); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const shortT = ts => fmt12(hhmm(ts)).replace(":00", "").replace(" ", "");
const mondayOf = ds => { const d = new Date(ds + "T12:00"); return shiftDate(ds, -((d.getDay() + 6) % 7)); };

function dueBanner() {
  const p = state.profile, r = p.routine, due = dueFast(r, p.fastActive, allFasts(state.days)[0]);
  if (!due) return "";
  return `<div class="card" style="border-color:var(--fast)"><div class="card-head"><h3>Your fast was due at ${esc(fmt12(hhmm(due.start)))}</h3></div>
    <p class="note">${esc(spanText(r, due.day))}</p>
    <div class="row"><button class="btn fast" data-act="routine-start" data-at="${due.start}" data-day="${due.day}">I started at ${esc(fmt12(hhmm(due.start)))}</button><button class="btn" data-act="routine-start" data-at="now" data-day="${due.day}">Start now</button></div>
    <button class="linkbtn" data-act="routine-skip" data-day="${due.day}">Skip this one</button></div>`;
}
const STATUS = { done: ["Kept", "var(--good)"], live: ["Now", "var(--fast)"], due: ["Due", "var(--fast)"], missed: ["Missed", "var(--bad)"], short: ["Short", "var(--warn)"], upcoming: ["", "var(--fast-soft)"], skipped: ["Skipped", "var(--line)"], off: ["", "transparent"] };
function routineCard() {
  const p = state.profile, r = p.routine;
  if (!r || !r.on) return `<div class="card"><div class="card-head"><h3>Make fasting a routine</h3></div>
    <p class="note">Pick your fasting days, like Monday, Wednesday and Friday, and when each fast starts. The app shows them on a calendar, tracks how well you keep them, reminds you when to start and when you're done, and pops up each stage as you reach it.</p>
    <button class="btn" data-act="routine-edit">${ICON.cal} Set up a routine</button></div>`;
  const first = mondayOf(today()), grid = routineDays(r, state.days, p.fastActive, first, 14);
  // the evening a fast begins, so the whole span is visible: Sunday "from 8pm", Monday "to 8pm"
  const starts = {};
  routineDays(r, state.days, p.fastActive, shiftDate(first, -1), 16).forEach(x => { if (x.start && x.status !== "off" && x.status !== "skipped") starts[iso(new Date(x.start))] = x.start; });
  const before = r.startMode === "before";
  const thisWeek = grid.slice(0, 7).filter(x => x.status !== "off" && x.status !== "skipped"), kept = thisWeek.filter(x => x.status === "done").length;
  const nf = nextFast(r);
  if (remindState === null) remindersOn().then(v => { remindState = v; if (state.view === "fast") render(); });
  return `<div class="card"><div class="card-head"><h3>Your routine</h3><button class="linkbtn" data-act="routine-edit">Edit</button></div>
    <p class="note">${esc(routineSummary(r))}</p>
    ${nf && !p.fastActive ? `<div class="nextfast"><span class="eyebrow">Next fast</span><b>${esc(spanText(r, nf.day))}</b><span class="note">Starts in ${hm((nf.start - Date.now()) / 1000)}</span></div>` : ""}
    <div class="rcal" role="grid" aria-label="Fasting calendar, two weeks">
      ${["M", "T", "W", "T", "F", "S", "S"].map(d => `<span class="rh">${d}</span>`).join("")}
      ${grid.map(x => { const d = new Date(x.date + "T12:00"), isToday = x.date === today(), [lbl, col] = STATUS[x.status];
        const st = before && starts[x.date];
        return x.status === "off"
          ? `<div class="rc off${st ? " starts" : ""}${isToday ? " today" : ""}"><b>${d.getDate()}</b>${st ? `<i class="half" aria-hidden="true"></i><small>from ${shortT(st)}</small>` : ""}</div>`
          : `<button class="rc ${x.status}${st ? " starts" : ""}${isToday ? " today" : ""}" data-act="routine-day-open" data-day="${x.date}" aria-label="${esc(spanText(r, x.date))}${lbl ? ", " + lbl : ""}">
              <b>${d.getDate()}</b><i style="background:${col}"></i><small>${lbl || (before ? "to " + shortT(x.end) : shortT(x.start))}</small></button>`; }).join("")}
    </div>
    <div class="row note" style="gap:12px"><span><i class="legend-dot" style="background:var(--fast)"></i>Fast day</span>${before ? `<span><i class="legend-dot half" aria-hidden="true"></i>Fast starts that evening</span>` : ""}<span><i class="legend-dot" style="background:var(--good)"></i>Kept</span><span><i class="legend-dot" style="background:var(--bad)"></i>Missed</span><span>Tap a day to change it</span></div>
    <p class="note">${kept} of ${thisWeek.length} kept this week.</p>
    <label class="switch"><span>Reminders on this phone<small>30 minutes before and at the start, at each new stage, 1 hour before the end, and when you're done</small></span><input type="checkbox" data-act="remind-toggle"${remindState ? " checked" : ""}></label></div>`;
}

// one day of the routine: see its span, skip it, move it, or start it
act("routine-day-open", el => {
  const r = state.profile.routine, ds = el.dataset.day, x = routineDays(r, state.days, state.profile.fastActive, ds, 1)[0], skipped = x.status === "skipped";
  const startsSoon = !state.profile.fastActive && x.start && Math.abs(x.start - Date.now()) < 6 * H;
  openSheet({ title: "Fast day", html: `<h1 class="big-title" style="font-size:28px">${esc(nice(ds))}</h1>
    <div class="card"><b>${esc(spanText(r, ds))}</b><p class="note">${r.hours} hours${skipped ? " &middot; skipped" : x.status === "done" ? " &middot; kept" : x.status === "missed" ? " &middot; missed" : ""}</p></div>
    ${x.status === "upcoming" || x.status === "due" || skipped ? `<div class="card"><label class="f">Start time for this day only<input type="time" id="rd-time" value="${esc(hhmm(x.start))}"></label>
      <p class="note">${r.startMode === "before" ? "This is the evening before " + esc(nice(ds)) + "." : "This is on " + esc(nice(ds)) + "."} Ends ${r.hours} hours later.</p>
      <button class="btn" data-act="routine-day-time" data-day="${ds}">Save time for this day</button></div>` : ""}
    <div class="row">
      ${startsSoon && !skipped ? `<button class="btn fast" data-act="routine-start" data-at="now" data-day="${ds}">Start this fast now</button>` : ""}
      ${x.status === "upcoming" || x.status === "due" || skipped ? `<button class="btn${skipped ? " primary" : ""}" data-act="routine-skip" data-day="${ds}">${skipped ? "Put it back" : "Skip this fast"}</button>` : ""}
    </div>` });
});
act("routine-skip", el => {
  const r = state.profile.routine, ds = el.dataset.day, s = new Set(r.skip || []);
  const wasSkipped = s.has(ds); wasSkipped ? s.delete(ds) : s.add(ds);
  r.skip = [...s].filter(d => d >= shiftDate(today(), -14)); saveProfile(); closeSheet();
  toast(wasSkipped ? "Back on your schedule" : "Skipped " + nice(ds)); render();
});
act("routine-day-time", el => {
  const r = state.profile.routine, ds = el.dataset.day, v = document.getElementById("rd-time").value;
  if (!v) return;
  r.times = { ...(r.times || {}) };
  if (v === r.start) delete r.times[ds]; else r.times[ds] = v;
  saveProfile(); closeSheet(); toast(spanText(r, ds)); render();
});

function routineHtml() {
  const d = draft, days = [1, 2, 3, 4, 5, 6, 0];
  const preview = { ...d, on: true, since: today(), skip: [], times: {} };
  const upcoming = [];
  for (let i = 0; i < 21 && upcoming.length < 3; i++) { const ds = shiftDate(today(), i); if (onPattern(preview, ds)) upcoming.push(ds); }
  return `<h1 class="big-title">Fasting routine</h1>
    <p class="note">Choose a preset or build your own. You can change it, skip a day or move a start time any time.</p>
    <div class="eyebrow">Presets</div>
    <div class="plans">${ROUTINE_PRESETS.map(pr => `<button class="plan${d.preset === pr.id ? " on" : ""}" data-act="routine-preset" data-id="${pr.id}">${pr.hours >= 19 && !isPro() ? `<span class="lock">${ICON.lock}</span>` : ""}<b style="font-size:21px">${esc(pr.name)}</b><span>${esc(pr.blurb)}</span></button>`).join("")}</div>
    <div class="card"><h3>Build your own</h3>
      <div class="eyebrow">1. Which days do you fast?</div>
      <div class="seg">${[["days", "Choose days"], ["daily", "Every day"], ["alternate", "Every other day"]].map(([v, l]) => `<button type="button" data-act="routine-pattern" data-v="${v}" class="${d.pattern === v ? "on" : ""}">${l}</button>`).join("")}</div>
      ${d.pattern === "days" ? `<div class="daypick">${days.map(x => `<button class="${(d.days || []).includes(x) ? "on" : ""}" data-act="routine-day" data-d="${x}" aria-pressed="${(d.days || []).includes(x)}">${DAYN3[x]}</button>`).join("")}</div>` : ""}
      <div class="eyebrow">2. How long is each fast?</div>
      <div class="chips">${[12, 13, 14, 16, 18, 20, 23, 24, 36, 48, 72].map(h => `<button class="chip${d.hours === h ? " on" : ""}" data-act="routine-hours" data-h="${h}">${h} h</button>`).join("")}</div>
      <div class="eyebrow">3. When does each fast start?</div>
      <div class="seg">${[["before", "The evening before"], ["same", "On the day"]].map(([v, l]) => `<button type="button" data-act="routine-mode" data-v="${v}" class="${d.startMode === v ? "on" : ""}">${l}</button>`).join("")}</div>
      <label class="f">Start time (usually after your last meal)<input type="time" id="rt-start" value="${esc(d.start)}" data-chg="routine-time"></label>
      ${d.hours >= EXTENDED_H ? checklist({ hours: d.hours }, "routine-ack", !!d.ack) : ""}
      <div class="preview"><span class="eyebrow">Your next fasts</span>${upcoming.length ? upcoming.map(ds => `<div>${ICON.timer}<span>${esc(spanText(preview, ds))}</span></div>`).join("") : `<p class="note">Pick at least one day.</p>`}</div>
      <button class="btn fast big" data-act="routine-save"${d.hours >= EXTENDED_H && !d.ack ? " disabled" : ""}>Save routine</button>
      ${state.profile.routine && state.profile.routine.on ? `<button class="btn ghost" data-act="routine-off">Turn routine off</button>` : ""}</div>`;
}
const redraw = () => { const b = document.getElementById("rt-body"); if (b) b.innerHTML = routineHtml(); };
act("routine-edit", () => {
  const r = state.profile.routine;
  // a new routine starts from the person's daily plan, not an aggressive default
  const ph = planFor(state.profile).hours;
  draft = r ? { startMode: "same", ...r } : { pattern: "daily", days: [1, 2, 3, 4, 5], hours: ph && ph < 24 ? ph : 16, start: "20:00", startMode: "same", preset: null };
  openSheet({ title: "Routine", html: `<div id="rt-body" style="display:flex;flex-direction:column;gap:14px">${routineHtml()}</div>` });
});
act("routine-preset", el => { const pr = ROUTINE_PRESETS.find(x => x.id === el.dataset.id); draft = { pattern: pr.pattern, days: pr.days || [1, 2, 3, 4, 5], hours: pr.hours, start: pr.start, startMode: pr.startMode, preset: pr.id, ack: false }; redraw(); });
act("routine-pattern", el => { draft.pattern = el.dataset.v; draft.preset = null; redraw(); });
act("routine-mode", el => { draft.startMode = el.dataset.v; draft.preset = null; redraw(); });
act("routine-day", el => { const d = Number(el.dataset.d), s = new Set(draft.days || []); s.has(d) ? s.delete(d) : s.add(d); draft.days = [...s]; draft.preset = null; redraw(); });
act("routine-hours", el => { draft.hours = Number(el.dataset.h); draft.preset = null; draft.ack = false; redraw(); });
act("routine-ack", el => { draft.ack = el.checked; const b = document.querySelector('[data-act="routine-save"]'); if (b) b.disabled = !draft.ack; });
onChange("routine-time", el => { if (el.value) { draft.start = el.value; draft.preset = null; redraw(); } });
act("routine-save", () => {
  const t = document.getElementById("rt-start"); if (t && t.value) draft.start = t.value;
  if (draft.pattern === "days" && !(draft.days || []).length) { toast("Pick at least one day"); return; }
  if (draft.hours >= EXTENDED_H && !draft.ack) { toast("Read the checklist and tick it first"); return; }
  if (draft.hours >= 19 && !isPro()) { closeSheet(); openPaywall("fastPlansPlus"); return; }
  const prev = state.profile.routine;
  state.profile.routine = { on: true, pattern: draft.pattern, days: draft.days, hours: draft.hours, start: draft.start, startMode: draft.startMode || "same",
    anchor: draft.anchor || today(), since: prev && prev.on && prev.since ? prev.since : today(), skip: (prev && prev.skip) || [], times: {},
    ...(draft.hours >= EXTENDED_H ? { ack: today() } : {}) };
  state.profile.tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  saveProfile(); closeSheet(); toast("Routine saved"); render();
});
act("routine-off", () => { state.profile.routine = { ...state.profile.routine, on: false }; saveProfile(); closeSheet(); toast("Routine turned off"); render(); });
act("routine-start", el => {
  const at = el.dataset.at === "now" ? Date.now() : Number(el.dataset.at), r = state.profile.routine;
  // long routine fasts never start without the safety checklist
  if (r.hours >= EXTENDED_H && !r.ack) {
    openSheet({ title: "Before you start", html: `<h1 class="big-title">${esc(hoursLabel(r.hours))} fast</h1>${checklist({ hours: r.hours }, "routine-start-ack", false)}
      <button class="btn fast big" data-act="routine-start" data-at="${el.dataset.at}" data-day="${el.dataset.day}" id="rs-go" disabled>Start the fast</button>` });
    return;
  }
  state.profile.fastActive = { s: at, h: r.hours, seen: stageIdx((Date.now() - at) / H) }; saveProfile(); buzz(30); closeSheet();
  toast("Fast started. Ends " + dayClock(at + r.hours * H)); render();
});
act("routine-start-ack", el => { const b = document.getElementById("rs-go"); if (b) b.disabled = !el.checked; if (el.checked) { state.profile.routine.ack = today(); saveProfile(); } });
act("remind-toggle", async el => {
  if (el.checked) {
    try { await enableReminders(); remindState = true; toast("Reminders on for this phone"); }
    catch (e) { el.checked = false; remindState = false; toast(e.message); }
  } else { await disableReminders(); remindState = false; toast("Reminders off"); }
});

// ---------- stage pop-ups ----------
// When a fast enters a new stage, show it on screen (whatever tab is open). If the app was closed,
// the latest stage shows when it's next opened. Phone notifications cover the closed-app case.
let popOpen = false;
export function checkStagePopup() {
  const fa = state.profile.fastActive;
  const pb = document.getElementById("stagepop");
  if (!fa || popOpen || S.workoutLive || document.hidden || sheetOpen() || !pb || !pb.hidden || !profileReady()) return;
  const elH = (Date.now() - fa.s) / H, st = stageAt(elH), idx = STAGES.indexOf(STAGES.find(s => s.name === st.name));
  if (fa.seen == null) { fa.seen = idx; saveProfile(); return; }   // fasts started before this feature
  if (idx <= fa.seen || idx === 0) return;
  fa.seen = idx; saveProfile(); popOpen = true; buzz([40, 60, 40]);
  const box = document.getElementById("stagepop");
  box.innerHTML = `<div class="pop" role="dialog" aria-modal="true" aria-labelledby="pop-t" aria-describedby="pop-d">
    <div class="pop-k"><span>Stage ${idx + 1} of ${STAGES.length}</span><span>Hour ${Math.floor(elH)}</span></div>
    <div class="pop-bar">${STAGES.map((s, i) => `<i class="${i < idx ? "done" : i === idx ? "now" : ""}"></i>`).join("")}</div>
    <h2 id="pop-t">${esc(st.name)}</h2><span class="ev ev-${st.ev}">${EVIDENCE[st.ev]}</span>
    <p id="pop-d">${esc(st.text)}</p>
    <ul class="changes">${st.changes.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
    ${st.next ? `<p class="note">Next: <b>${esc(st.next.name)}</b> in ${hm(st.nextIn * 3600)}</p>` : ""}
    <button class="btn fast big" data-act="pop-close">Keep going</button>
    <button class="linkbtn" data-act="pop-break" style="text-align:center">I want to break my fast</button></div>`;
  popReturn = document.activeElement; box.hidden = false; setInert(true);
  setTimeout(() => { const b = box.querySelector("[data-act=pop-close]"); if (b) b.focus({ preventScroll: true }); }, 50);
}
let popReturn = null;
function popDone() { setInert(false); const r = popReturn; popReturn = null; setTimeout(() => restoreFocus(r), 0); }
document.addEventListener("keydown", e => { if (e.key === "Escape" && popOpen) { const b = document.querySelector("[data-act=pop-close]"); if (b) b.click(); } });
act("pop-break", () => { const b = document.getElementById("stagepop"); b.hidden = true; b.innerHTML = ""; popOpen = false; setInert(false); popReturn = null; state.view = "fast"; render(); window.scrollTo(0, 0); });
act("pop-close", () => { const b = document.getElementById("stagepop"); b.hidden = true; b.innerHTML = ""; popOpen = false; if (state.view === "fast") render(); popDone(); });
