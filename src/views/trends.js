// Trends: body and goal summary, achievements, BMI, period charts, correlations, records,
// plus the activity history and the 12-week roadmap.
import { act, segHtml, confirmTap, toast, ICON } from "../lib/dom.js";
import { esc, mmss, num, round1, UNIT_M } from "../lib/format.js";
import { iso, addDays, parse, today, nice, shortDate, MON } from "../lib/dates.js";
import { barChart, lineChart } from "../lib/charts.js";
import { state, day, render } from "../core/state.js";
import { saveDay, saveProfile } from "../core/store.js";
import { isPro } from "../core/premium.js";
import { runFor, weekOf } from "../domain/plan.js";
import { weights, avg7, currentWeight, bmi, bmiClass, weightAtBmi, buckets, series, weeklyTrend, foodTotals, fastHours, runSecs, runDist, weekCounts } from "../domain/metrics.js";
import { activities, feedHtml, fmtDist } from "../features/activity.js";
import { badgesSummary } from "../features/badges.js";
import { openPaywall, unlockRow } from "../features/paywall.js";
import { shareProgress } from "../features/share.js";
import { targetFor } from "../features/water.js";

const period = { weight: "D", run: "D", fast: "D", kcal: "D", water: "D" };
let allWeeks = false;

function summaryCard() {
  const p = state.profile, list = weights(state.days), t = today();
  const now = currentWeight(state.days, t), start = p.startWeight || (list[0] && list[0].w), goal = p.goalWeight;
  if (!now) return `<div class="card empty"><b>Start with a weigh-in</b>Log your weight on Today. Your start, current and goal weight will appear here.</div>`;
  const chg = start ? now - start : 0;
  const lastDate = list.length ? list[list.length - 1].date : t;
  let h = `<div class="card wcard">
    <div class="whead"><div><span class="wlbl">Weight</span><div class="wnow"><b>${round1(now)}</b><span>${p.unit}</span></div><span class="note">Latest &middot; ${esc(nice(lastDate))}</span></div>
      ${start ? `<div class="wchg ${chg > 0 ? "up" : "down"}"><b>${chg > 0 ? "+" : ""}${round1(chg)} ${p.unit}</b><span>since day 1</span></div>` : ""}</div>
    <div class="stats wstats"><div class="stat"><b>${start ? round1(start) : "-"}</b><span>Start</span></div><div class="stat"><b>${round1(now)}</b><span>Current</span></div><div class="stat"><b>${goal ? round1(goal) : "-"}</b><span>Goal</span></div></div>`;
  if (start && goal && start > goal) {
    const pct = Math.max(0, Math.min(1, (start - now) / (start - goal)));
    h += `<div class="goalbar"><div class="bar"><i style="width:${(pct * 100).toFixed(1)}%"></i></div><div class="ends"><span>${Math.round(pct * 100)}% of the way</span><span>${round1(Math.max(0, now - goal))} ${p.unit} to go</span></div></div>`;
    const tr = weeklyTrend(list, t);
    if (tr == null) h += `<p class="note">A projected goal date appears after about two weeks of weigh-ins.</p>`;
    else if (tr >= -0.05) h += `<p class="note">Your trend is flat (${tr > 0 ? "+" : ""}${round1(tr)} ${p.unit}/week). One small change, like 150-200 kcal less a day or an extra walk, usually restarts it.</p>`;
    else {
      const date = addDays(new Date(), Math.round((now - goal) / -tr * 7));
      const fast = p.unit === "lb" ? tr < -2.5 : tr < -1.1;
      h += `<p class="note">Losing about <b style="color:var(--ink)">${round1(-tr)} ${p.unit} a week</b>. At this rate you reach ${goal} around <b style="color:var(--ink)">${shortDate(date)} ${date.getFullYear()}</b>.${fast ? " That's faster than tends to last; make sure you're eating enough protein to recover." : ""}</p>`;
    }
  } else if (!goal) h += `<p class="note">Set a goal weight under your profile to see progress and a projected date.</p>`;
  return h + `</div>`;
}

function bmiCard() {
  const p = state.profile, now = currentWeight(state.days, today());
  if (!p.heightCm) return `<div class="card"><div class="card-head"><h3>Body mass index</h3></div><p class="note">Add your height to see your BMI and the milestones below each band.</p><button class="btn" data-act="go-me">Add height</button></div>`;
  if (!now) return "";
  const b = bmi(now, p.unit, p.heightCm), cls = bmiClass(b), goalB = p.goalWeight ? bmi(p.goalWeight, p.unit, p.heightCm) : null;
  const lo = 15, hi = 45, pos = v => Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100));
  const bands = [[15, 18.5, "#5aa9f0"], [18.5, 25, "#4fc184"], [25, 30, "#e9c46a"], [30, 35, "#e9a04d"], [35, 40, "#ef7469"], [40, 45, "#c24a5a"]];
  const nextBand = [40, 35, 30, 25].find(x => b >= x);
  return `<div class="card bmi"><div class="card-head"><h3>Body mass index</h3>${goalB ? `<span class="note">Goal ${goalB.toFixed(1)}</span>` : ""}</div>
    <div class="val"><b>${b.toFixed(1)}</b><span class="${cls.tone}">${cls.label}</span></div>
    <div class="gauge"><span class="mk" style="left:${pos(b)}%" aria-hidden="true"></span>${goalB ? `<span class="mk goal" style="left:${pos(goalB)}%" aria-hidden="true"></span>` : ""}
      <div class="segs">${bands.map(([a, z, c]) => `<i style="flex:${z - a};background:${c}"></i>`).join("")}</div>
      <div class="ticks">${[18.5, 25, 30, 35, 40].map(v => `<span style="left:${pos(v)}%">${v}</span>`).join("")}</div></div>
    ${nextBand ? `<p class="note">Next milestone: below BMI ${nextBand} at <b style="color:var(--ink)">${round1(weightAtBmi(nextBand, p.heightCm, p.unit))} ${p.unit}</b>. BMI is a rough screen; waist size and how you feel matter too.</p>` : ""}</div>`;
}

function chartCard(key, title, { unit, valueOf, agg, kind = "bar", color, target, fmtK = v => num(v), headline = "avg" }) {
  const per = period[key], bks = buckets(per, today()), vals = series(state.days, bks, valueOf, agg);
  const shown = vals.filter(v => v != null && v !== 0);
  const big = headline === "total" ? vals.reduce((a, v) => a + (v || 0), 0) : headline === "latest" ? [...vals].reverse().find(v => v != null) : (shown.length ? shown.reduce((a, v) => a + v, 0) / shown.length : null);
  const label = headline === "total" ? "Total" : headline === "latest" ? "Latest" : per === "D" ? "Daily average" : "Average per " + (per === "W" ? "week" : "month");
  const chart = !shown.length ? `<div class="empty" style="padding:18px 0">No data in this period yet.</div>`
    : kind === "line" ? lineChart({ labels: bks.map(b => b.label), values: vals, target, targetLabel: target ? "goal " + target : "", fmt: v => v.toFixed(0) })
    : barChart({ labels: bks.map(b => b.label), values: vals, target, targetLabel: target ? "target " + num(target) : "", color, fmt: v => fmtK(v) });
  return `<div class="card chartcard"><div class="head"><div><h3>${title}</h3>
      <div class="range">${label} &middot; ${shortDate(parse(bks[0].from))} - ${shortDate(parse(bks[bks.length - 1].to))}</div>
      <div class="k">${big != null ? fmtK(big) : "-"}<small>${unit}</small>${kind === "line" && target ? `<small>&middot; goal ${target}</small>` : ""}</div></div>
    ${segHtml("per-" + key, [["D", "Day"], ["W", "Week", !isPro()], ["M", "Month", !isPro()]], per, `data-act="period" data-k="${key}" aria-label="Chart period"`)}</div>${chart}</div>`;
}

function correlations() {
  const p = state.profile;
  if (!isPro()) return `<div class="card"><div class="card-head"><h3>What's moving your weight</h3></div><div class="locked-body" aria-hidden="true"><p class="note blur">Weeks you fasted on 5 or more days, you lost 1.4 lb on average, versus 0.3 lb in other weeks. Weeks under your calorie target averaged 1.6 lb lost.</p></div>${unlockRow("correlations", "See how fasting and food move your weight")}</div>`;
  const bks = buckets("W", today()), wAvg = series(state.days, bks, d => d.weight, "avg");
  const fDays = bks.map(b => { let n = 0; for (let x = parse(b.from); iso(x) <= b.to; x = addDays(x, 1)) if (fastHours(state.days[iso(x)]) > 0) n++; return n; });
  const kAvg = series(state.days, bks, d => foodTotals(d).k || null, "avg");
  const rows = [];
  for (let i = 1; i < bks.length; i++) if (wAvg[i] != null && wAvg[i - 1] != null) rows.push({ chg: wAvg[i] - wAvg[i - 1], fast: fDays[i], kcal: kAvg[i] });
  if (rows.length < 3) return `<div class="card"><div class="card-head"><h3>What's moving your weight</h3></div><p class="note">Needs about 4 weeks of weigh-ins, fasts and food logs. Keep logging and this card will show which habits move your weight most.</p></div>`;
  const mean = a => (a.length ? a.reduce((s, x) => s + x.chg, 0) / a.length : null);
  const fHi = rows.filter(r => r.fast >= 5), fLo = rows.filter(r => r.fast < 5);
  const kHi = p.kcalTarget ? rows.filter(r => r.kcal != null && r.kcal <= p.kcalTarget) : [], kLo = p.kcalTarget ? rows.filter(r => r.kcal != null && r.kcal > p.kcalTarget) : [];
  const line = (a, b, what) => a.length && b.length ? `<li>Weeks ${what}: <b>${round1(mean(a))} ${p.unit}</b> a week, versus <b>${round1(mean(b))} ${p.unit}</b> otherwise.</li>` : "";
  return `<div class="card"><div class="card-head"><h3>What's moving your weight</h3><span class="note">${rows.length} weeks</span></div>
    <ul class="note" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px">${line(fHi, fLo, "with 5+ fasting days") || "<li>Fast on 5+ days in a week to compare.</li>"}${line(kHi, kLo, "at or under your calorie target") || (p.kcalTarget ? "<li>Log food for a few more weeks to compare calorie weeks.</li>" : "<li>Set a calorie target on Food to compare.</li>")}</ul>
    ${lineChart({ labels: bks.map(b => b.label), values: wAvg, fmt: v => v.toFixed(0) })}
    ${barChart({ labels: bks.map(b => b.label), values: fDays, color: "var(--fast)", fmt: v => Math.round(v) + "d", height: 120 })}
    <p class="note">Top: weekly average weight. Bottom: fasting days per week. Patterns, not proof; small samples move around.</p></div>`;
}

function records() {
  const du = state.profile.dunit, runs = Object.values(state.days).filter(d => d.runDone);
  const longest = Math.max(0, ...runs.map(runSecs)), far = Math.max(0, ...runs.map(d => runDist(d, du)));
  const fastest = runs.reduce((b, d) => (d.splits || []).reduce((bb, s) => Math.min(bb, s), b), Infinity);
  const total = runs.reduce((a, d) => a + runDist(d, du), 0);
  return `<div class="card"><h3>Personal records</h3><div class="recs">${[[longest ? mmss(longest) : "-", "Longest run"], [far ? fmtDist(far) + " " + du : "-", "Farthest run"], [isFinite(fastest) ? mmss(fastest) : "-", "Fastest " + (du === "mi" ? "mile" : "km")], [total ? fmtDist(total) + " " + du : "-", "Total distance"]].map(r => `<div class="rec"><b>${r[0]}</b><span>${r[1]}</span></div>`).join("")}</div></div>`;
}

function weighIns() {
  const p = state.profile, list = weights(state.days);
  return `<div class="card"><div class="card-head"><h3>Weigh-ins</h3><span class="note">${list.length} logged</span></div>
    <div class="row"><label class="f">Date<input type="date" id="w-date" value="${today()}" max="${today()}"></label><label class="f">Weight (${p.unit})<input type="number" id="w-val" inputmode="decimal" step="0.1" placeholder="e.g. 208.4"></label></div>
    <button class="btn primary" data-act="w-save">Save weigh-in</button>
    ${list.length ? `<div class="hist">${list.slice().reverse().slice(0, 30).map(x => `<div class="h"><span class="d">${esc(nice(x.date))}</span><span class="w">${x.w.toFixed(1)} <small class="note">${p.unit}</small></span><span class="note">avg ${(avg7(list, x.date) || x.w).toFixed(1)}</span>
      <button class="x" data-act="w-del" data-date="${x.date}" aria-label="Delete weigh-in">&times;</button></div>`).join("")}</div>` : ""}</div>`;
}

function roadmap() {
  const p = state.profile, wk = weekOf(today(), p), start0 = parse(p.startDate || "2026-10-01"), off = p.weekOffset || 0;
  let h = "";
  for (let w = 1; w <= 12; w++) {
    const thu = runFor(w, 4), sun = runFor(w, 0), wed = runFor(w, 3), same = thu.title === sun.title && sun.title === wed.title;
    const ws0 = addDays(start0, (w - 1 + off) * 7), done = weekCounts(state.days, ws0).runs;
    const status = w < wk ? `<span class="pill ${done >= 3 ? "good" : ""}">${done >= 3 ? "Done" : done + "/3 runs"}</span>` : w === wk ? `<span class="pill run">This week &middot; ${done}/3</span>` : `<span class="pill">Starts ${ws0.getDate()} ${MON[ws0.getMonth()]}</span>`;
    const hide = !allWeeks && (w < wk - 1 || w > Math.max(wk, 1) + 2);
    h += `<div class="plan-week${w === wk ? " cur" : ""}"${hide ? " hidden" : ""}><div class="pw-num">${w}<small>${w <= 9 ? "Build" : "Speed"}</small></div><div>
      <div class="card-head" style="align-items:flex-start"><b>${same ? esc(thu.title) : "3 runs"}</b>${status}</div>
      <div class="note">${same ? "Thu, Sun, Wed. " + esc(thu.how) : `Thu ${esc(thu.title)} &middot; Sun ${esc(sun.title)} &middot; Wed ${esc(wed.title)}`}</div></div></div>`;
  }
  return `<div class="card"><div class="card-head"><h3>12-week roadmap</h3><span class="pill">${wk ? "Week " + wk : "Not started"}</span></div>
    <p class="note">What's coming up. Each week shows how many of its 3 runs you've done.</p>${h}
    <button class="linkbtn" data-act="weeks-all">${allWeeks ? "Show fewer weeks" : "Show all 12 weeks"}</button>
    <p class="note">Fri and Mon: easy cardio plus strength. Sat and Tue: rest. After week 12 the long run keeps growing by 5 minutes a week. Repeat any week that feels too hard.</p></div>`;
}

export function renderTrends(root) {
  const tab = state.trendsTab, p = state.profile;
  let body = "";
  if (tab === "overview") {
    body = summaryCard() + badgesSummary() + bmiCard()
      + chartCard("weight", "Weight", { unit: p.unit, valueOf: d => d.weight, agg: "avg", kind: "line", target: p.goalWeight, headline: "latest", fmtK: v => v.toFixed(1) })
      + chartCard("run", "Running", { unit: "min", valueOf: d => runSecs(d) / 60 || null, agg: "sum", color: "var(--accent)", headline: "total" })
      + chartCard("fast", "Fasting", { unit: "h", valueOf: d => fastHours(d) || null, agg: "sum", color: "var(--fast)", headline: "total", fmtK: v => round1(v) })
      + chartCard("kcal", "Calories", { unit: "kcal", valueOf: d => foodTotals(d).k || null, agg: "avg", color: "var(--rose)", target: p.kcalTarget })
      + chartCard("water", "Water", { unit: "ml", valueOf: d => d.water || null, agg: "avg", color: "var(--water)", target: targetFor(today()) })
      + correlations() + records() + weighIns()
      + `<div class="row"><button class="btn" data-act="share">${ICON.share} Share my week</button><button class="btn" data-act="export">${isPro() ? "" : ICON.lock} Export data</button></div>`;
  } else if (tab === "activity") {
    const acts = activities(), runs = acts.filter(a => a.kind === "run");
    body = `<div class="stats"><div class="stat"><b>${runs.length}</b><span>runs</span></div><div class="stat"><b>${fmtDist(runs.reduce((a, x) => a + x.dist, 0))}</b><span>${p.dunit} run</span></div><div class="stat"><b>${acts.filter(a => a.kind === "strength").length}</b><span>strength</span></div></div>` + feedHtml(acts);
  } else body = roadmap();
  root.innerHTML = `<section class="view"><h1 class="big-title">Progress</h1>
    <div class="subnav"><nav class="toptabs" aria-label="Progress sections" data-act="trends-tab">${[["overview", "Overview"], ["activity", "Activities"], ["plan", "Run plan"]].map(([v, l]) => `<button aria-current="${tab === v ? "page" : "false"}" class="${tab === v ? "on" : ""}" data-v="${v}">${l}</button>`).join("")}</nav></div>${body}</section>`;
}

act("trends-tab", (el, ev) => { const b = ev.target.closest("button"); if (b) { state.trendsTab = b.dataset.v; render(); } });
act("period", (el, ev) => {
  const b = ev.target.closest("button"); if (!b) return;
  if (b.dataset.pro && !isPro()) { openPaywall("trendsHistory"); return; }
  period[el.dataset.k] = b.dataset.v; render();
});
act("weeks-all", () => { allWeeks = !allWeeks; render(); });
act("w-save", () => {
  const date = document.getElementById("w-date").value, v = Number(document.getElementById("w-val").value);
  if (!date || !v) { toast("Enter a date and a weight"); return; }
  day(date).weight = v; saveDay(date);
  if (!state.profile.startWeight) { state.profile.startWeight = v; saveProfile(); }
  toast("Weigh-in saved"); render();
});
act("w-del", el => {
  if (!confirmTap("w" + el.dataset.date, el, "?")) return;
  delete day(el.dataset.date).weight; saveDay(el.dataset.date); toast("Weigh-in deleted"); render();
});
act("share", () => shareProgress());
act("export", () => {
  if (!isPro()) { openPaywall("export"); return; }
  const rows = [["date", "weight", "run_min", "run_km", "fast_h", "kcal", "protein_g", "water_ml", "strength_sets", "notes"]];
  Object.keys(state.days).sort().forEach(k => {
    const d = state.days[k], ft = foodTotals(d);
    rows.push([k, d.weight || "", d.runDone ? Math.round(runSecs(d) / 60) : "", d.runDone ? (runDist(d, state.profile.dunit) / UNIT_M.km).toFixed(2) : "", fastHours(d) ? round1(fastHours(d)) : "", ft.n ? ft.k : "", ft.n ? Math.round(ft.p) : "", d.water || "",
      Array.isArray(d.strength) ? d.strength.reduce((a, x) => a + (x.sets || []).filter(s => s.done).length, 0) || "" : "", (d.notes || "").replace(/\s+/g, " ")]);
  });
  const csv = rows.map(r => r.map(v => /[",]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "run-back-export-" + today() + ".csv"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast("Export downloaded");
});
