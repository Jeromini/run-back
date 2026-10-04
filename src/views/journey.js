// My Journey: one place for the whole package. Today's goals with one-tap actions (train, fast,
// water, food, weigh-in, a note), the week, a map of every day, milestones and a day-by-day diary.
import { $, act, onInput, onChange, openSheet, closeSheet, confirmTap, toast, segHtml, ICON } from "../lib/dom.js";
import { esc, num, hm, mmss, round1 } from "../lib/format.js";
import { iso, parse, addDays, today, nice, DOW, MON } from "../lib/dates.js";
import { ring } from "../lib/charts.js";
import { state, day, render } from "../core/state.js";
import { saveDay, saveProfile } from "../core/store.js";
import { sessionFor } from "../domain/plan.js";
import { planFor, routineDays, isScheduled } from "../domain/fasting.js";
import { foodTotals, fastsOf, actsOf, runSecs, runDist, crossSecs, setCounts, ranToday, strengthDone } from "../domain/metrics.js";
import { activityById } from "../domain/activities.js";
import { PILLARS, pillarById, TEMPLATES, JOURNEY_WEEKS, MOODS, KEPT, newJourney, activePillars, journeyEnd, dayNumber, totalDays, weekNumber, dayChecks, dayScore, weekProgress, journeyStats, journeyTotals, weightJourney, milestones } from "../domain/journey.js";
import { targetFor } from "../features/water.js";
import { strengthCard, afterRender as strengthAfter } from "../features/strength.js";
import { openWorkout } from "../features/workout.js";
import { openLogActivity, startFreeWorkout } from "../features/activitylog.js";
import { fmtDist } from "../features/activity.js";
import { setFoodDate } from "./food.js";

const H = 3600000;
const LOOK = {
  train: { icon: "bolt", color: "var(--violet)", soft: "var(--violet-soft)" },
  run: { icon: "run", color: "var(--accent)", soft: "var(--accent-soft)" },
  strength: { icon: "dumbbell", color: "var(--violet)", soft: "var(--violet-soft)" },
  fast: { icon: "timer", color: "var(--fast)", soft: "var(--fast-soft)" },
  water: { icon: "water", color: "var(--water)", soft: "var(--water-soft)" },
  food: { icon: "food", color: "var(--rose)", soft: "var(--rose-soft)" },
  weight: { icon: "scale", color: "var(--rose)", soft: "var(--rose-soft)" },
  note: { icon: "edit", color: "var(--accent)", soft: "var(--accent-soft)" }
};
let draft = null, diaryAll = false;
const J = () => state.profile.journey;

// Everything the journey maths needs from the rest of the app.
function ctxFor(j) {
  const p = state.profile, r = p.routine;
  let map = null;
  if (j.pillars.fast && j.pillars.fast.on && r && r.on) {
    map = {};
    routineDays(r, state.days, p.fastActive, j.start, totalDays(j)).forEach(x => (map[x.date] = x.status));
  }
  return {
    waterTarget: targetFor,
    kcalTarget: p.kcalTarget || null,
    fastHours: planFor(p).hours,
    fastDay: map ? date => { const s = map[date]; return !s || s === "off" || s === "skipped" ? "off" : s === "done" ? "done" : s === "missed" || s === "short" ? "missed" : "pending"; } : null
  };
}

// ---------- screen ----------
export function renderJourney(root) {
  const j = J();
  if (!j || !j.on) { root.innerHTML = introHtml(); return; }
  state.sel = today();
  const t = today(), ctx = ctxFor(j), st = journeyStats(j, state.days, t, ctx);
  root.innerHTML = `<section class="view">
    ${heroHtml(j, st, ctx)}
    ${todayHtml(j, ctx)}
    ${j.pillars.strength && j.pillars.strength.on ? strengthCard(render) : ""}
    ${st.before ? "" : weekHtml(j, ctx)}
    ${mapHtml(j, st)}
    ${totalsHtml(j)}
    ${milestonesHtml(j, ctx)}
    ${diaryHtml(j)}
    <div class="row"><button class="btn" style="flex:1" data-act="j-edit">${ICON.edit} Edit journey</button></div>
  </section>`;
  strengthAfter();
}

function introHtml() {
  const past = state.profile.pastJourneys || [];
  return `<section class="view">
    <div class="jintro"><h1 class="big-title">One plan for everything you do</h1>
      <p>Choose a package and the app tracks it all in one place: training, fasting, water, food, weigh-ins and a short daily note. Every day gets a score, every week a report, and the whole journey lives in a diary you can look back on.</p></div>
    <div class="eyebrow">Choose a package</div>
    <div class="jtpls">${TEMPLATES.map(t => `<button class="jtpl" data-act="j-template" data-id="${t.id}">
      <div class="top"><b>${esc(t.name)}</b><span class="pill">${t.weeks} weeks</span></div><span class="note">${esc(t.blurb)}</span>
      <div class="dots">${PILLARS.filter(p => t.pillars[p.id] && t.pillars[p.id].on).map(p => `<i title="${esc(p.label)}" style="background:${LOOK[p.id].soft};color:${LOOK[p.id].color}">${ICON[LOOK[p.id].icon]}</i>`).join("")}</div></button>`).join("")}</div>
    ${past.length ? `<div class="card"><h3>Past journeys</h3>${past.map(x => `<div class="frow static"><span><b>${esc(x.name)}</b><span class="note">${esc(nice(x.start))} to ${esc(nice(x.end))} &middot; ${x.days} days</span></span><span class="pill">${x.score}%</span></div>`).join("")}</div>` : ""}
  </section>`;
}

function heroHtml(j, st, ctx) {
  const t = today(), wj = weightJourney(j, state.days, t, state.profile.startWeight), u = state.profile.unit;
  const pct = Math.round(st.score * 100), prog = st.total ? st.dayN / st.total : 0;
  const headline = st.before ? `Starts ${esc(nice(j.start))}` : st.finished ? "Journey complete" : `Day ${st.dayN} <small>of ${st.total}</small>`;
  const sub = st.before ? `${Math.max(1, -dayNumber(j, t) + 1)} day${-dayNumber(j, t) + 1 === 1 ? "" : "s"} to go. Today is a practice day.`
    : st.finished ? `${esc(nice(j.start))} to ${esc(nice(journeyEnd(j)))}` : `Week ${weekNumber(j, t)} of ${j.weeks} &middot; ends ${esc(nice(journeyEnd(j)))}`;
  let weight = "";
  if (wj) {
    const goal = j.goalWeight || state.profile.goalWeight, chg = round1(wj.change);
    const gp = goal && wj.from !== goal ? Math.max(0, Math.min(1, (wj.from - wj.now) / (wj.from - goal))) : null;
    weight = `<div class="jweight"><div class="top"><span>Weight</span><b>${round1(wj.now)} ${u}</b><span class="${chg < 0 ? "down" : chg > 0 ? "up" : ""}">${chg > 0 ? "+" : ""}${chg} ${u} since day 1</span></div>
      ${gp != null ? `<div class="bar"><i style="width:${(gp * 100).toFixed(0)}%"></i></div><div class="note">${round1(wj.from)} ${u} to goal ${round1(goal)} ${u} &middot; ${Math.round(gp * 100)}% of the way</div>` : ""}</div>`;
  }
  return `<div class="jhero">
    <div class="meta"><span>${ICON.flag} ${esc(j.name)}</span><button class="linkbtn" data-act="j-edit">Edit</button></div>
    <div class="mid">${ring(st.before ? 0 : st.score, { size: 104, stroke: 10, color: "var(--accent)", inner: `<span class="k">${st.before ? "-" : pct + "%"}</span><span class="u">score</span>` })}
      <div><h2>${headline}</h2><p>${sub}</p></div></div>
    <div class="track" aria-label="${Math.round(prog * 100)}% of the journey done"><i style="width:${(prog * 100).toFixed(1)}%"></i></div>
    <div class="stats"><div><b>${st.streak}</b><span>day streak</span></div><div><b>${st.kept}</b><span>kept days</span></div><div><b>${st.best}</b><span>best streak</span></div></div>
    ${j.why ? `<blockquote>${esc(j.why)}</blockquote>` : ""}
    ${weight}
  </div>`;
}

// ---------- today's goals ----------
function todayHtml(j, ctx) {
  const t = today(), d = state.days[t] || {}, checks = dayChecks(j, d, t, ctx), done = checks.filter(c => c.applies && c.done).length, n = checks.filter(c => c.applies).length;
  const wk = weekNumber(j, t) >= 1 && dayNumber(j, t) <= totalDays(j) ? weekProgress(j, state.days, weekNumber(j, t), t, ctx) : null;
  const rows = checks.map(c => pillarRow(j, c, d, wk && wk.find(x => x.id === c.id))).join("");
  return `<div class="card jtoday"><div class="card-head"><h3>Today</h3><span class="pill${done === n && n ? " good" : ""}">${done} of ${n} done</span></div>
    <div class="jrows">${rows}</div>
    <p class="note">A day counts as kept when you hit most of its goals (${Math.round(KEPT * 100)}% or more).</p></div>`;
}

function pillarRow(j, c, d, wk) {
  const p = pillarById(c.id), L = LOOK[c.id], t = today(), u = state.profile.unit;
  let sub = "", actions = "", extra = "";
  const week = wk && p.kind === "week" ? `${wk.n} of ${wk.target} this week` : "";
  if (c.id === "train") {
    const what = trainingList(d);
    sub = what.length ? what.join(", ") : "Nothing logged yet";
    actions = `<button class="mini primary" data-act="j-workout">${ICON.play} Start</button><button class="mini" data-act="j-log">Log</button>`;
  } else if (c.id === "run") {
    sub = ranToday(d) ? runText(d) : sessionFor(t, state.profile).kind === "run" ? "On your plan today" : "Not on the plan today";
    actions = ranToday(d) ? "" : `<button class="mini primary" data-act="j-run">${ICON.play} Run</button>`;
  } else if (c.id === "strength") {
    const [n, tot] = setCounts(d.strength);
    sub = strengthDone(d) ? `${n} of ${tot} sets done` : tot ? `${tot} sets planned` : "Add exercises below";
    actions = `<button class="mini" data-act="j-lifts">Open</button>`;
  } else if (c.id === "fast") {
    const fa = state.profile.fastActive, r = state.profile.routine;
    const kept = fastsOf(d).filter(f => (f.e - f.s) / H >= 10);
    if (fa) { const el = (Date.now() - fa.s) / 1000; sub = `Fasting ${hm(el)} of ${fa.h} h`; actions = `<button class="mini" data-act="tab" data-v="fast">Open</button>`; }
    else if (kept.length) { const f = kept[kept.length - 1]; sub = `${round1((f.e - f.s) / H)} h fast finished`; actions = `<button class="mini" data-act="tab" data-v="fast">Open</button>`; }
    else if (!c.applies) { sub = "Not a fast day on your routine"; actions = `<button class="mini" data-act="tab" data-v="fast">Open</button>`; }
    else { sub = r && r.on && isScheduled(r, t) ? "A fast day on your routine" : `${planFor(state.profile).label} plan`; actions = planFor(state.profile).hours >= 36 ? `<button class="mini primary" data-act="tab" data-v="fast">Start</button>` : `<button class="mini primary" data-act="fast-start">${ICON.play} Start</button>`; }
  } else if (c.id === "water") {
    const ml = d.water || 0, tg = targetFor(t);
    sub = `${num(ml)} of ${num(tg)} ml`;
    actions = `<button class="mini" data-act="water" data-ml="250" data-date="${t}">+250</button><button class="mini" data-act="water" data-ml="500" data-date="${t}">+500</button>`;
    extra = `<div class="minibar"><i style="width:${Math.min(100, 100 * ml / tg).toFixed(0)}%;background:var(--water)"></i></div>`;
  } else if (c.id === "food") {
    const ft = foodTotals(d), kT = state.profile.kcalTarget;
    sub = ft.n ? `${num(ft.k)}${kT ? " of " + num(kT) : ""} kcal &middot; ${ft.n} item${ft.n === 1 ? "" : "s"}` : kT ? `Target ${num(kT)} kcal` : "Nothing logged yet";
    if (ft.n && kT && ft.k > kT * 1.05) sub += " &middot; over target";
    actions = `<button class="mini primary" data-act="j-food" data-date="${t}">${ICON.plus} Meal</button>`;
    if (kT) extra = `<div class="minibar"><i style="width:${Math.min(100, 100 * ft.k / kT).toFixed(0)}%;background:${ft.k > kT * 1.05 ? "var(--warn)" : "var(--rose)"}"></i></div>`;
  } else if (c.id === "weight") {
    sub = d.weight ? `${d.weight} ${u} today` : "Not weighed today";
    if (!d.weight) extra = `<div class="quickw"><input type="number" id="j-w" aria-label="Weight in ${u}" inputmode="decimal" step="0.1" placeholder="Weight in ${u}"><button class="btn primary" data-act="j-wsave">Save</button></div>`;
  } else if (c.id === "note") {
    const jr = d.journal || {};
    sub = jr.text ? "Written" : "How did today go?";
    extra = noteEditor(t, jr);
  }
  return `<div class="jrow${c.done ? " done" : ""}${c.applies ? "" : " na"}">
    <i class="ic" style="background:${L.soft};color:${L.color}">${c.done ? ICON.tick : ICON[L.icon]}</i>
    <div class="txt"><b>${esc(p.label)}${week ? `<span class="jwkn">${week}</span>` : ""}</b><span>${sub}</span></div>
    <div class="acts">${actions}</div>${extra ? `<div class="extra">${extra}</div>` : ""}</div>`;
}
const noteEditor = (date, jr) => `<textarea data-in="j-note" data-date="${date}" rows="2" placeholder="Energy, sleep, cravings, a win...">${esc(jr.text || "")}</textarea>
  ${segHtml("j-mood-" + date, MOODS.map((m, i) => [i + 1, m]), jr.mood || "", `data-act="j-mood" data-date="${date}"`)}`;

function trainingList(d) {
  const out = [];
  if (d.runDone) out.push(runText(d));
  if (d.crossDone) { const a = activityById(d.crossAct); out.push(`${a ? a.name : "Cardio"} ${Math.round(crossSecs(d) / 60)} min`); }
  actsOf(d).forEach(x => { const a = activityById(x.type); if (a) out.push(`${a.name} ${x.min} min`); });
  if (strengthDone(d)) { const [n] = setCounts(d.strength); out.push(`Strength, ${n} sets`); }
  return out;
}
function runText(d) {
  const dist = runDist(d, state.profile.dunit), s = runSecs(d);
  if (d.runDone) return `Run ${dist ? fmtDist(dist) + " " + state.profile.dunit + ", " : ""}${s ? mmss(s) : ""}`.replace(/, $/, "");
  const r = actsOf(d).find(x => { const a = activityById(x.type); return a && a.run; });
  return r ? `${activityById(r.type).name} ${r.min} min` : "Run";
}

// ---------- week, map, totals, milestones ----------
function weekHtml(j, ctx) {
  const t = today(), n = Math.min(weekNumber(j, t), j.weeks), upTo = t > journeyEnd(j) ? journeyEnd(j) : t;
  const wp = weekProgress(j, state.days, n, upTo, ctx);
  return `<div class="card"><div class="card-head"><h3>Week ${n} of ${j.weeks}</h3><span class="note">${esc(nice(iso(addDays(parse(j.start), (n - 1) * 7))))} to ${esc(nice(iso(addDays(parse(j.start), n * 7 - 1))))}</span></div>
    <div class="jmeters">${wp.map(x => { const p = pillarById(x.id), L = LOOK[x.id], pc = x.target ? Math.min(1, x.n / x.target) : 0;
      return `<div class="meter"><div class="card-head"><span>${esc(p.label)}</span><b>${x.n}<small> / ${x.target}${x.kind === "day" ? " days" : ""}</small></b></div><div class="minibar"><i style="width:${(pc * 100).toFixed(0)}%;background:${L.color}"></i></div></div>`; }).join("")}</div></div>`;
}

function mapHtml(j, st) {
  const t = today(), first = parse(j.start), byDate = {};
  st.scores.forEach(x => (byDate[x.date] = x.s));
  let rows = "";
  for (let w = 0; w < j.weeks; w++) {
    let cells = "";
    for (let i = 0; i < 7; i++) {
      const k = iso(addDays(first, w * 7 + i)), s = byDate[k], fut = k > t;
      const bg = fut || s == null ? "" : s === 0 ? "var(--surface-2)" : `color-mix(in srgb, var(--accent) ${Math.round(25 + s * 75)}%, var(--surface-2))`;
      cells += `<button class="jd${fut ? " fut" : ""}${k === t ? " today" : ""}${s >= KEPT ? " kept" : ""}" data-act="j-day" data-d="${k}" style="${bg ? "background:" + bg : ""}" aria-label="${nice(k)}${s != null ? ", " + Math.round(s * 100) + "%" : ""}"></button>`;
    }
    rows += `<div class="jwk"><span>W${w + 1}</span>${cells}</div>`;
  }
  const d0 = first.getDay();
  return `<div class="card"><div class="card-head"><h3>Journey map</h3><span class="note">tap a day</span></div>
    <div class="jmap"><div class="jwk head"><span></span>${Array.from({ length: 7 }, (_, i) => `<small>${DOW[(d0 + i) % 7].slice(0, 2)}</small>`).join("")}</div>${rows}</div>
    <div class="row note jlegend"><span><i style="background:var(--surface-2)"></i>Missed</span><span><i style="background:color-mix(in srgb, var(--accent) 55%, var(--surface-2))"></i>Partly</span><span><i style="background:var(--accent)"></i>Kept</span></div></div>`;
}

function totalsHtml(j) {
  const x = journeyTotals(j, state.days, today());
  const cell = (v, l) => `<div><b>${v}</b><span>${l}</span></div>`;
  return `<div class="card"><h3>So far</h3><div class="jtotals">
    ${cell(x.sessions, "training days")}${cell(x.runs, "run days")}${cell(x.sets, "sets lifted")}
    ${cell(x.fasts, "fasts")}${cell(Math.round(x.fastH), "hours fasted")}${cell(x.longest ? round1(x.longest) + " h" : "-", "longest fast")}
    ${cell(x.meals, "foods logged")}${cell(round1(x.water / 1000) + " L", "water")}${cell(x.notes, "notes")}</div></div>`;
}

function milestonesHtml(j, ctx) {
  const list = milestones(j, state.days, today(), ctx, state.profile.unit), got = list.filter(m => m.date);
  const next = list.filter(m => !m.date).slice(0, 3);
  return `<div class="card"><div class="card-head"><h3>Milestones</h3><span class="pill">${got.length} of ${list.length}</span></div>
    <div class="jmiles">${got.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).map(m => `<div class="ms got"><i>${ICON.star}</i><span><b>${esc(m.label)}</b><small>${esc(nice(m.date))}</small></span></div>`).join("")}
    ${next.map(m => `<div class="ms"><i>${ICON.lock}</i><span><b>${esc(m.label)}</b><small>Up next</small></span></div>`).join("")}</div></div>`;
}

// ---------- diary ----------
function entrySummary(d) {
  const bits = [];
  trainingList(d).forEach(x => bits.push(["train", x]));
  fastsOf(d).forEach(f => bits.push(["fast", `${round1((f.e - f.s) / H)} h fast`]));
  const ft = foodTotals(d); if (ft.n) bits.push(["food", `${num(ft.k)} kcal, ${ft.n} item${ft.n === 1 ? "" : "s"}`]);
  if (d.water) bits.push(["water", `${round1(d.water / 1000)} L water`]);
  if (d.weight) bits.push(["weight", `${d.weight} ${state.profile.unit}`]);
  return bits;
}
function diaryHtml(j) {
  const t = today(), end = t < journeyEnd(j) ? t : journeyEnd(j), out = [];
  for (let x = parse(end); iso(x) >= j.start; x = addDays(x, -1)) {
    const k = iso(x), d = state.days[k]; if (!d) continue;
    const bits = entrySummary(d), jr = d.journal || {};
    if (!bits.length && !jr.text) continue;
    out.push({ k, bits, jr });
  }
  const shown = diaryAll ? out : out.slice(0, 7);
  return `<div class="card"><div class="card-head"><h3>Diary</h3><span class="note">${out.length} day${out.length === 1 ? "" : "s"} logged</span></div>
    ${out.length ? `<div class="jdiary">${shown.map(e => `<button class="jentry" data-act="j-day" data-d="${e.k}">
      <div class="when"><b>${parse(e.k).getDate()}</b><small>${MON[parse(e.k).getMonth()]}</small></div>
      <div class="body"><div class="hd">${DOW[parse(e.k).getDay()]} &middot; Day ${dayNumber(j, e.k)}${e.jr.mood ? ` &middot; ${esc(MOODS[e.jr.mood - 1])}` : ""}</div>
        <div class="tags">${e.bits.map(([id, s]) => `<span style="color:${LOOK[id].color}">${ICON[LOOK[id].icon]}${esc(s)}</span>`).join("")}</div>
        ${e.jr.text ? `<p>${esc(e.jr.text)}</p>` : ""}</div></button>`).join("")}</div>
      ${out.length > 7 ? `<button class="linkbtn" data-act="j-diary-all">${diaryAll ? "Show less" : `Show all ${out.length} days`}</button>` : ""}`
    : `<div class="empty"><b>Your diary starts today</b>Everything you log (training, fasts, meals, water, weight and notes) appears here, day by day.</div>`}</div>`;
}

// ---------- one day ----------
function openDay(k) {
  const j = J(), d = state.days[k] || {}, ctx = ctxFor(j), checks = dayChecks(j, d, k, ctx), u = state.profile.unit;
  const sc = dayScore(checks), dn = dayNumber(j, k), jr = d.journal || {};
  const meals = ["Breakfast", "Lunch", "Dinner", "Snacks"].filter(m => (d.food || []).some(f => f.m === m));
  const sec = (title, body) => body ? `<div class="card"><div class="eyebrow">${title}</div>${body}</div>` : "";
  const train = trainingList(d), ft = foodTotals(d);
  openSheet({ title: nice(k), onClose: render, html: `
    <div class="jdayhead"><div><h1 class="big-title">${esc(nice(k))}</h1><p class="note" style="margin-top:4px">${dn >= 1 && dn <= totalDays(j) ? `Day ${dn} of ${totalDays(j)}` : "Outside the journey"}</p></div>
      ${k <= today() ? ring(sc, { size: 72, stroke: 7, color: "var(--accent)", inner: `<span class="k" style="font-size:18px">${Math.round(sc * 100)}%</span>` }) : ""}</div>
    <div class="card tight">${checks.map(c => `<div class="frow static${c.applies ? "" : " na"}"><span><b>${esc(pillarById(c.id).label)}</b></span><span class="pill${c.done ? " good" : ""}">${!c.applies ? "Rest day" : c.done ? "Done" : k > today() ? "To do" : c.kind === "week" ? "Not today" : "Missed"}</span></div>`).join("")}</div>
    ${sec("Training", train.length ? `<ul class="jlist">${train.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "")}
    ${sec("Fasting", fastsOf(d).length ? `<ul class="jlist">${fastsOf(d).map(f => `<li>${round1((f.e - f.s) / H)} h, ended ${new Date(f.e).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</li>`).join("")}</ul>` : "")}
    ${sec("Food", ft.n ? meals.map(m => `<div class="jmeal"><b>${m}</b>${(d.food || []).filter(f => f.m === m).map(f => `<div class="card-head"><span>${esc(f.n)}</span><span class="note">${f.k || 0} kcal</span></div>`).join("")}</div>`).join("") + `<div class="card-head"><b>Total</b><b>${num(ft.k)} kcal &middot; ${Math.round(ft.p)} g protein</b></div>` : "")}
    ${sec("Water and weight", d.water || d.weight ? `<div class="card-head"><span>Water</span><b>${num(d.water || 0)} ml</b></div>${d.weight ? `<div class="card-head"><span>Weight</span><b>${d.weight} ${u}</b></div>` : ""}` : "")}
    ${k <= today() ? `<div class="card"><div class="eyebrow">Note</div>${noteEditor(k, jr)}</div>` : ""}
    <div class="row"><button class="btn" style="flex:1" data-act="j-open-today" data-d="${k}">Open on Today</button>${k <= today() ? `<button class="btn" style="flex:1" data-act="j-food" data-date="${k}">Food this day</button>` : ""}</div>` });
}

// ---------- setup ----------
function startJourneyDraft(templateId, from) {
  const j = from ? JSON.parse(JSON.stringify(from)) : newJourney(templateId, today(), { goalWeight: state.profile.goalWeight || null });
  draft = { ...j, editing: !!from };
  drawSetup();
}
function drawSetup() {
  const html = setupHtml();
  if (document.getElementById("jsetup")) { $("sh-body").innerHTML = html; return; }
  openSheet({ title: draft.editing ? "Edit journey" : "New journey", html });
}
function setupHtml() {
  const t = today(), mon = iso(addDays(parse(t), (8 - parse(t).getDay()) % 7 || 7)), u = state.profile.unit;
  const starts = [[t, "Today"], [iso(addDays(parse(t), 1)), "Tomorrow"], [mon, "Next Monday"]];
  return `<div id="jsetup" style="display:flex;flex-direction:column;gap:14px">
    ${draft.editing ? "" : `<div class="eyebrow">Package</div><div class="chips">${TEMPLATES.map(x => `<button class="chip${draft.template === x.id ? " on" : ""}" data-act="j-tpl" data-id="${x.id}">${esc(x.name)}</button>`).join("")}</div>`}
    <label class="f">Name<input data-in="j-name" value="${esc(draft.name)}" maxlength="40"></label>
    <div class="card"><div class="eyebrow">Starts</div>
      <div class="chips">${starts.map(([v, l]) => `<button class="chip${draft.start === v ? " on" : ""}" data-act="j-start" data-v="${v}">${l}</button>`).join("")}</div>
      <label class="f">Or pick a date<input type="date" data-chg="j-startdate" value="${draft.start}"></label>
      <div class="eyebrow">Length</div>
      <div class="chips">${JOURNEY_WEEKS.map(w => `<button class="chip${draft.weeks === w ? " on" : ""}" data-act="j-weeks" data-w="${w}">${w} weeks</button>`).join("")}</div>
      <p class="note">${esc(nice(draft.start))} to ${esc(nice(iso(addDays(parse(draft.start), draft.weeks * 7 - 1))))}</p></div>
    <div class="eyebrow">What's in your journey</div>
    <div class="card tight">${PILLARS.map(p => { const v = draft.pillars[p.id] || { on: false }, L = LOOK[p.id];
      return `<div class="jpick${v.on ? " on" : ""}"><i class="ic" style="background:${L.soft};color:${L.color}">${ICON[L.icon]}</i>
        <div class="txt"><b>${esc(p.label)}</b><span class="note">${esc(p.blurb)}</span>
        ${v.on && p.kind === "week" ? `<div class="stepper"><button data-act="j-target" data-id="${p.id}" data-d="-1" aria-label="Fewer">${ICON.minus}</button><b>${v.target}</b><span>${p.unit} a week</span><button data-act="j-target" data-id="${p.id}" data-d="1" aria-label="More">${ICON.plus}</button></div>` : ""}</div>
        <label class="switch" style="margin-left:auto"><input type="checkbox" data-act="j-pillar" data-id="${p.id}"${v.on ? " checked" : ""} aria-label="${esc(p.label)}"></label></div>`; }).join("")}</div>
    ${draft.pillars.fast && draft.pillars.fast.on ? `<p class="note">Fasting follows ${state.profile.routine && state.profile.routine.on ? "your fasting routine (fast days only)" : `your ${esc(planFor(state.profile).label)} plan every day. Set a routine on the Fast tab to fast on chosen days`}.</p>` : ""}
    <div class="row"><label class="f" style="flex:1">Goal weight (${u})<input type="number" inputmode="decimal" step="0.1" data-in="j-goal" value="${esc(draft.goalWeight || "")}" placeholder="Optional"></label></div>
    <label class="f">Why are you doing this?<textarea data-in="j-why" rows="2" maxlength="160" placeholder="Run a half under 1:35 again. Feel good at 41.">${esc(draft.why || "")}</textarea></label>
    <button class="btn primary big" data-act="j-save">${draft.editing ? "Save changes" : "Start my journey"}</button>
    ${draft.editing ? `<button class="btn danger" data-act="j-end">End this journey</button>` : ""}
  </div>`;
}

// ---------- actions ----------
act("j-template", el => startJourneyDraft(el.dataset.id));
act("j-edit", () => startJourneyDraft(null, J()));
act("j-tpl", el => { const keep = { start: draft.start, why: draft.why, goalWeight: draft.goalWeight }; draft = { ...newJourney(el.dataset.id, draft.start), ...keep, editing: false }; drawSetup(); });
act("j-start", el => { draft.start = el.dataset.v; drawSetup(); });
onChange("j-startdate", el => { if (el.value) { draft.start = el.value; drawSetup(); } });
act("j-weeks", el => { draft.weeks = Number(el.dataset.w); drawSetup(); });
act("j-pillar", el => { const p = pillarById(el.dataset.id); draft.pillars[p.id] = { ...(draft.pillars[p.id] || {}), on: el.checked, ...(p.kind === "week" && !(draft.pillars[p.id] || {}).target ? { target: p.def } : {}) }; drawSetup(); });
act("j-target", el => { const p = pillarById(el.dataset.id), v = draft.pillars[p.id]; v.target = Math.max(1, Math.min(p.max, (v.target || p.def) + Number(el.dataset.d))); drawSetup(); });
onInput("j-name", el => { draft.name = el.value; });
onInput("j-why", el => { draft.why = el.value; });
onInput("j-goal", el => { draft.goalWeight = el.value ? Number(el.value) : null; });
act("j-save", () => {
  if (!activePillars(draft).length) { toast("Turn on at least one goal"); return; }
  const { editing, ...j } = draft;
  j.name = (j.name || "").trim() || "My journey"; j.on = true;
  state.profile.journey = j;
  if (j.goalWeight && !state.profile.goalWeight) state.profile.goalWeight = j.goalWeight;
  saveProfile(); closeSheet(); draft = null;
  toast(editing ? "Journey updated" : `${j.name} starts ${j.start === today() ? "today" : nice(j.start)}`);
  state.view = "journey"; render(); window.scrollTo(0, 0);
});
act("j-end", el => {
  if (!confirmTap("j-end", el, "Tap again to end it")) return;
  const j = J(), t = today(), st = journeyStats(j, state.days, t, ctxFor(j));
  const end = t < journeyEnd(j) ? t : journeyEnd(j);
  if (st.dayN >= 1) state.profile.pastJourneys = [{ name: j.name, start: j.start, end, days: st.dayN, score: Math.round(st.score * 100) }, ...(state.profile.pastJourneys || [])].slice(0, 20);
  state.profile.journey = { ...j, on: false };
  saveProfile(); closeSheet(); draft = null; toast("Journey ended. It's saved under Past journeys."); render();
});
act("j-day", el => openDay(el.dataset.d));
act("j-diary-all", () => { diaryAll = !diaryAll; render(); });
act("j-workout", () => startFreeWorkout(today(), openWorkout));
act("j-log", () => openLogActivity(today()));
act("j-run", () => {
  const t = today(), s = sessionFor(t, state.profile);
  if (s.kind === "run" && !(state.days[t] || {}).runDone) openWorkout(s, t);
  else openLogActivity(t, { type: "run-out" });
});
act("j-lifts", () => { const c = document.getElementById("liftcard"); if (c) c.scrollIntoView({ behavior: "smooth", block: "start" }); });
act("j-food", el => { closeSheet(); setFoodDate(el.dataset.date || today()); state.view = "food"; render(); window.scrollTo(0, 0); });
act("j-open-today", el => { closeSheet(); state.sel = el.dataset.d; state.view = "today"; render(); window.scrollTo(0, 0); });
act("j-wsave", () => {
  const v = Number(document.getElementById("j-w").value); if (!v) { toast("Enter your weight"); return; }
  const t = today(); day(t).weight = v; saveDay(t);
  if (!state.profile.startWeight) { state.profile.startWeight = v; saveProfile(); }
  toast("Weight saved"); render();
});
onInput("j-note", el => { const d = day(el.dataset.date); d.journal = { ...(d.journal || {}), text: el.value }; saveDay(el.dataset.date); });
act("j-mood", (el, ev) => {
  const b = ev.target.closest("button"); if (!b) return;
  const k = el.dataset.date, d = day(k), v = Number(b.dataset.v);
  d.journal = { ...(d.journal || {}), mood: (d.journal || {}).mood === v ? null : v }; saveDay(k);
  el.querySelectorAll("button").forEach(x => x.classList.toggle("on", Number(x.dataset.v) === d.journal.mood));
});

// Compact strip for Today.
export function journeyStrip() {
  const j = J(); if (!j || !j.on) return `<button class="jstrip" data-act="tab" data-v="journey"><i>${ICON.flag}</i><div><b>Start My Journey</b><span>Training, fasting, water and food in one plan</span></div><i class="go">${ICON.next}</i></button>`;
  const t = today(), ctx = ctxFor(j), checks = dayChecks(j, state.days[t], t, ctx).filter(c => c.applies), done = checks.filter(c => c.done).length, dn = dayNumber(j, t);
  const label = dn < 1 ? `Starts ${nice(j.start)}` : dn > totalDays(j) ? "Journey complete" : `Day ${dn} of ${totalDays(j)}, week ${weekNumber(j, t)}`;
  // lead with the next step, not a deficit
  const next = checks.filter(c => !c.done).map(c => pillarById(c.id).label.toLowerCase()).slice(0, 3).join(", ");
  const status = done === checks.length ? "Every goal done today" : done ? `${done} of ${checks.length} done, next: ${next}` : `Next: ${next}`;
  return `<button class="jstrip" data-act="tab" data-v="journey"><i>${ICON.flag}</i><div><b>${esc(j.name)}</b><span>${esc(label)} &middot; ${esc(status)}</span></div>
    <span class="jdots" aria-hidden="true">${checks.map(c => `<i class="${c.done ? "on" : ""}" style="--c:${LOOK[c.id].color}" title="${esc(pillarById(c.id).label)}"></i>`).join("")}</span></button>`;
}
