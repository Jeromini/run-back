// Activity history (runs, cardio, strength), route maps and the detail sheet.
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { act, openSheet, closeSheet, confirmTap, toast, ICON } from "../lib/dom.js";
import { esc, mmss, fmtPace, UNIT_M, num } from "../lib/format.js";
import { nice } from "../lib/dates.js";
import { state, day, render } from "../core/state.js";
import { saveDay } from "../core/store.js";
import { sessionFor } from "../domain/plan.js";
import { runDist, runSecs, crossSecs, strengthDone, setCounts, liftVolume } from "../domain/metrics.js";

const du = () => state.profile.dunit || "mi";
export const fmtDist = m => (m / UNIT_M[du()]).toFixed(2);
export const paceOf = (secs, m) => (m > 100 && secs ? fmtPace(secs / (m / UNIT_M[du()])) : "-");

// ---------- maps ----------
let maps = [];
export function routeSvg(route, stroke = "var(--accent)") {
  if (!route || route.length < 2) return `<svg viewBox="0 0 84 84"><path d="M26 58l10-16 8 8 14-22" fill="none" stroke="var(--line)" stroke-width="4"/></svg>`;
  const k = Math.cos(route[0][0] * Math.PI / 180), xs = route.map(p => p[1] * k), ys = route.map(p => -p[0]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) || 1e-6, S = 84, pad = 10, sc = (S - 2 * pad) / span;
  const ox = (S - (maxX - minX) * sc) / 2, oy = (S - (maxY - minY) * sc) / 2;
  const pts = route.map((p, i) => ((xs[i] - minX) * sc + ox).toFixed(1) + "," + ((ys[i] - minY) * sc + oy).toFixed(1));
  const [sx, sy] = pts[0].split(","), [ex, ey] = pts[pts.length - 1].split(",");
  return `<svg viewBox="0 0 ${S} ${S}"><polyline points="${pts.join(" ")}" fill="none" stroke="${stroke}" stroke-width="3.5"/><circle cx="${sx}" cy="${sy}" r="3.5" fill="var(--good)" stroke="none"/><circle cx="${ex}" cy="${ey}" r="3.5" fill="var(--bad)" stroke="none"/></svg>`;
}
export function drawMap(el, route, dark) {
  if (!route || route.length < 2) { el.innerHTML = `<div class="empty" style="height:100%;display:grid;place-items:center"><div><b>No route</b>GPS was off or had no signal for this session.</div></div>`; return; }
  if (!navigator.onLine) { el.innerHTML = routeSvg(route); return; }
  try {
    const m = L.map(el, { zoomControl: false, scrollWheelZoom: false });
    const isDark = dark || matchMedia("(prefers-color-scheme: dark)").matches && document.documentElement.dataset.theme !== "light";
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors", className: isDark ? "tiles-dark" : "" }).addTo(m);
    const line = L.polyline(route, { color: isDark ? "#3cc7be" : "#0a7f7a", weight: 5, opacity: .95, lineJoin: "round" }).addTo(m);
    L.circleMarker(route[0], { radius: 6, color: "#fff", weight: 2, fillColor: "#23824f", fillOpacity: 1 }).addTo(m);
    L.circleMarker(route[route.length - 1], { radius: 6, color: "#fff", weight: 2, fillColor: "#b8382f", fillOpacity: 1 }).addTo(m);
    m.fitBounds(line.getBounds(), { padding: [24, 24] });
    setTimeout(() => m.invalidateSize(), 60);
    maps.push(m);
  } catch (e) { el.innerHTML = routeSvg(route); }
}
export function clearMaps() { maps.forEach(m => { try { m.remove(); } catch (e) { /* ignore */ } }); maps = []; }

// ---------- list ----------
export function activities() {
  const out = [];
  Object.values(state.days).forEach(d => {
    if (d.runDone) { const s = sessionFor(d.date, state.profile); out.push({ date: d.date, kind: "run", title: d.runTitle || (s.kind === "run" ? s.title : "Run"), dist: runDist(d, du()), dur: runSecs(d), route: d.route }); }
    if (d.crossDone) out.push({ date: d.date, kind: "cross", title: d.crossType || "Cardio", dist: d.crossDistM || 0, dur: crossSecs(d), route: d.crossRoute });
    if (strengthDone(d)) { const [n] = setCounts(d.strength); out.push({ date: d.date, kind: "strength", title: "Strength workout", ex: d.strength.filter(x => (x.sets || []).some(t => t.done)).length, sets: n, vol: liftVolume(d.strength) }); }
  });
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}
export function feedHtml(acts) {
  if (!acts.length) return `<div class="card empty"><b>No activities yet</b>Start today's session from Today. Runs recorded with the timer show up here with their route.</div>`;
  return `<div class="feed">${acts.map(a => a.kind === "strength"
    ? `<button class="act" data-act="open-activity" data-date="${a.date}" data-kind="strength">
      <div><div class="when">${esc(nice(a.date))} &middot; Strength</div><h3>${esc(a.title)}</h3>
      <div class="st"><div><b>${a.ex}</b><span>exercises</span></div><div><b>${a.sets}</b><span>sets</span></div>${a.vol ? `<div><b>${num(a.vol)}</b><span>${state.profile.unit} lifted</span></div>` : ""}</div></div>
      <div class="thumb" style="color:var(--violet)"><span class="ic">${ICON.dumbbell}</span></div></button>`
    : `<button class="act" data-act="open-activity" data-date="${a.date}" data-kind="${a.kind}">
      <div><div class="when">${esc(nice(a.date))} &middot; ${a.kind === "run" ? "Run" : "Cardio"}</div><h3>${esc(a.title)}</h3>
      <div class="st"><div><b>${a.dist ? fmtDist(a.dist) : "-"}</b><span>${du()}</span></div><div><b>${a.dur ? mmss(a.dur) : "-"}</b><span>time</span></div>${a.kind === "run" ? `<div><b>${paceOf(a.dur, a.dist)}</b><span>/${du()}</span></div>` : ""}</div></div>
      <div class="thumb">${routeSvg(a.route, a.kind === "run" ? "var(--accent)" : "var(--violet)")}</div></button>`).join("")}</div>`;
}

// ---------- detail ----------
export function intervalTable(ints, dark) {
  if (!ints || !ints.filter(x => x.k !== "w").length) return "";
  let n = 0;
  return `<div class="tablewrap"><table class="ints"><thead><tr><th>Interval</th><th>Time</th><th>${du()}</th><th>Pace</th></tr></thead><tbody>${ints.map(x => {
    if (x.k === "w" && (x.label === "Warm-up" || x.label === "Cool-down")) return "";
    const lbl = x.k === "w" ? "Walk" : (x.k === "h" ? "Quick " : "Jog ") + (++n);
    const col = x.k === "r" ? (dark ? "#3cc7be" : "var(--accent)") : x.k === "h" ? "#f5be4a" : "#8fa3bb";
    return `<tr><td><span class="k" style="background:${col}"></span>${lbl}</td><td>${mmss(x.sec)}</td><td>${x.m ? fmtDist(x.m) : "-"}</td><td>${x.m > 20 ? fmtPace(x.sec / (x.m / UNIT_M[du()])) : "-"}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}
function splitTable(splits) {
  if (!splits || !splits.length) return "";
  return `<div class="card"><div class="eyebrow">Splits</div><div class="tablewrap"><table class="ints"><thead><tr><th>${du() === "mi" ? "Mile" : "Km"}</th><th>Pace</th></tr></thead><tbody>${splits.map((s, i) => `<tr><td>${i + 1}</td><td>${mmss(s)}</td></tr>`).join("")}</tbody></table></div></div>`;
}
const actions = (date, kind) => `<div class="row"><button class="btn" data-act="activity-edit" data-date="${date}">Edit on Today</button><button class="btn danger" data-act="activity-del" data-date="${date}" data-kind="${kind}">Delete</button></div>`;

export function openActivity(date, kind) {
  const d = state.days[date]; if (!d) return;
  if (kind === "strength") {
    const items = d.strength || [], u = state.profile.unit, [n, t] = setCounts(items), vol = liftVolume(items);
    openSheet({ title: nice(date) + " · Strength", onClose: clearMaps, html: `<h1 class="big-title">Strength workout</h1>
      <div class="stats"><div class="stat"><b>${items.length}</b><span>exercises</span></div><div class="stat"><b>${n}/${t}</b><span>sets done</span></div><div class="stat"><b>${vol ? num(vol) : "-"}</b><span>${u} lifted</span></div></div>
      ${items.map(x => `<div class="card"><div class="eyebrow">${esc(x.name)}</div><div class="tablewrap"><table class="ints"><thead><tr><th>Set</th><th>Reps</th><th>${u}</th><th>Done</th></tr></thead><tbody>${(x.sets || []).map((st, j) =>
        `<tr><td>${j + 1}</td><td>${st.r === "" || st.r == null ? "-" : esc(st.r)}</td><td>${st.w === "" || st.w == null ? "-" : esc(st.w)}</td><td>${st.done ? "Yes" : "-"}</td></tr>`).join("")}</tbody></table></div></div>`).join("")}
      ${actions(date, kind)}` });
    return;
  }
  const isRun = kind === "run";
  const dist = isRun ? runDist(d, du()) : d.crossDistM || 0, dur = isRun ? runSecs(d) : crossSecs(d);
  const title = isRun ? (d.runTitle || sessionFor(date, state.profile).title) : (d.crossType || "Cardio");
  const bits = [];
  if (d.rpe) bits.push(`<div><span class="eyebrow">Effort</span><p style="font-size:18px;font-weight:800">${d.rpe}/10</p></div>`);
  if (d.pain) bits.push(`<div><span class="eyebrow">Pain</span><p style="font-size:18px;font-weight:800">${d.pain === "no" ? "None" : d.pain === "niggle" ? "Niggle" : "Yes"}</p></div>`);
  const body = openSheet({ title: nice(date) + " · " + (isRun ? "Run" : "Cardio"), onClose: clearMaps, html: `<h1 class="big-title">${esc(title)}</h1>
    <div class="map" id="sh-map"></div>
    <div class="stats"><div class="stat"><b>${dist ? fmtDist(dist) : "-"}</b><span>${du()}</span></div><div class="stat"><b>${dur ? mmss(dur) : "-"}</b><span>time</span></div><div class="stat"><b>${paceOf(dur, dist)}</b><span>avg /${du()}</span></div></div>
    ${isRun && d.ints ? `<div class="card"><div class="eyebrow">Intervals</div>${intervalTable(d.ints)}</div>` : ""}
    ${isRun ? splitTable(d.splits) : ""}
    ${bits.length || d.notes ? `<div class="card"><div class="row">${bits.join("")}</div>${d.notes ? `<p>${esc(d.notes)}</p>` : ""}</div>` : ""}
    ${actions(date, kind)}` });
  drawMap(body.querySelector("#sh-map"), isRun ? d.route : d.crossRoute, false);
}
act("open-activity", el => openActivity(el.dataset.date, el.dataset.kind));
act("activity-edit", el => { closeSheet(); state.sel = el.dataset.date; state.view = "today"; render(); window.scrollTo(0, 0); });
act("activity-del", el => {
  if (!confirmTap("del-" + el.dataset.date + el.dataset.kind, el, "Tap again to delete")) return;
  const date = el.dataset.date, kind = el.dataset.kind, dd = day(date);
  const fields = kind === "run" ? ["runDone", "runMin", "dist", "runDistM", "runDur", "route", "ints", "splits", "runTitle"]
    : kind === "cross" ? ["crossDone", "crossMin", "crossType", "crossDistM", "crossDur", "crossRoute"] : ["strength", "lifts"];
  fields.forEach(f => delete dd[f]);
  if (Object.keys(dd).filter(k => k !== "date" && dd[k] != null && dd[k] !== "").length === 0) delete state.days[date];
  saveDay(date); closeSheet(); toast("Deleted"); render();
});
