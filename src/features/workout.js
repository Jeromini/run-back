// Guided workout: pre-start sheet, countdown, live interval coach with GPS, and summary.
import { $, toast, segHtml, ICON } from "../lib/dom.js";
import { esc, mmss, fmtPace, UNIT_M } from "../lib/format.js";
import { nice, pad } from "../lib/dates.js";
import { beep, buzz, say, setVoice, setSound, unlockAudio, unlockSpeech, keepAwake, releaseAwake, hush } from "../lib/sound.js";
import { state, S, day, render } from "../core/state.js";
import { saveDay } from "../core/store.js";
import { drawMap, clearMaps, intervalTable, fmtDist } from "./activity.js";
import { activityById } from "../domain/activities.js";
import { pickActivity } from "./activitylog.js";

const C_RING = 2 * Math.PI * 140;
let W = null, gpsWatch = null, gpsFix = null;
const du = () => state.profile.dunit || "mi";
const kindColor = k => (k === "r" ? "var(--wk-run)" : k === "h" ? "var(--wk-hard)" : "var(--wk-walk)");
const kindName = seg => seg.label || (seg.kind === "r" ? "Jog" : seg.kind === "h" ? "Quick" : "Walk");
const durWords = s => (s < 60 ? s + " seconds" : s % 60 === 0 ? s / 60 + (s === 60 ? " minute" : " minutes") : s < 120 ? s + " seconds" : Math.floor(s / 60) + " and a half minutes");

// ---------- GPS ----------
function gpsStart() {
  if (gpsWatch != null || !navigator.geolocation) return;
  try { gpsWatch = navigator.geolocation.watchPosition(onPos, err => { gpsFix = { err: err.code }; paintGps(); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }); }
  catch (e) { gpsFix = { err: 2 }; }
}
function gpsStop() { if (gpsWatch != null) { try { navigator.geolocation.clearWatch(gpsWatch); } catch (e) { /* ignore */ } } gpsWatch = null; gpsFix = null; }
export function hav(a, b) {
  const R = 6371000, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function onPos(pos) {
  const c = pos.coords, pt = [c.latitude, c.longitude], t = pos.timestamp || Date.now();
  gpsFix = { acc: c.accuracy, t }; paintGps();
  if (!W || !W.gps || W.phase !== "live" || W.pausedAt) return;
  if (c.accuracy > 35) return;                       // too vague to trust
  const G = W.gps;
  if (!G.last) { G.last = { pt, t }; G.route.push(pt); return; }
  const d = hav(G.last.pt, pt), dt = (t - G.last.t) / 1000;
  if (d < 4) return;                                 // jitter while standing still
  if (dt > 0 && d / dt > 8) { G.last = { pt, t }; return; } // a jump faster than any runner
  G.dist += d; G.last = { pt, t }; G.route.push(pt);
  G.recent.push({ t, dist: G.dist }); while (G.recent.length && t - G.recent[0].t > 25000) G.recent.shift();
  if (W.idx >= 0) W.segDist[W.idx] += d;
  if (G.dist >= UNIT_M[du()] * (G.splits.length + 1)) {
    const e = elapsed(), split = e - G.lastSplitAt; G.splits.push(split); G.lastSplitAt = e;
    say((du() === "mi" ? "Mile " : "Kilometer ") + G.splits.length + ". Pace " + Math.floor(split / 60) + " " + pad(Math.round(split % 60)) + ".");
  }
}
function curPace() {
  const r = W && W.gps && W.gps.recent; if (!r || r.length < 2) return null;
  const a = r[0], b = r[r.length - 1], d = b.dist - a.dist, t = (b.t - a.t) / 1000;
  return d < 12 || t < 5 ? null : t / (d / UNIT_M[du()]);
}
function gpsLabel() {
  if (!navigator.geolocation) return ["off", "GPS not available"];
  if (!gpsFix) return ["", "Finding GPS..."];
  if (gpsFix.err === 1) return ["off", "Location blocked. Allow it in settings."];
  if (gpsFix.err) return ["weak", "Searching for GPS"];
  return gpsFix.acc <= 20 ? ["good", "GPS ready"] : gpsFix.acc <= 35 ? ["weak", "GPS weak"] : ["weak", "GPS weak (" + Math.round(gpsFix.acc) + " m)"];
}
function paintGps() { const el = $("wk-gps"); if (!el) return; const [c, t] = gpsLabel(); el.className = "gpsdot " + c; el.querySelector("span").textContent = t; }

// ---------- flow ----------
export function openWorkout(session, date, opts = {}) {
  const segs = []; let t = 0;
  session.blocks.forEach(b => { segs.push({ kind: b[0], len: b[1], at: t, label: b[2] || null }); t += b[1]; });
  const p = state.profile;
  W = { session, date, segs, total: t, runs: segs.filter(x => x.kind !== "w").length, phase: "pre", voice: p.voice !== false, gpsOn: p.gps !== false, idx: -1, segDist: segs.map(() => 0), half: false, lastCount: null, gps: null,
    where: "outdoor", act: opts.type ? activityById(opts.type) : session.kind === "cross" ? activityById("walk-out") : null, manualDist: "", free: !!opts.free };
  if (W.act) W.gpsOn = W.gpsOn && W.act.gps;
  setSound(p.beeps !== false); setVoice(W.voice);
  S.workoutLive = true;
  $("wk").hidden = false; document.body.classList.add("locked");
  if (W.gpsOn) gpsStart();
  renderPre();
}
function closeWorkout() {
  if (W && W.timer) clearInterval(W.timer);
  gpsStop(); clearMaps(); releaseAwake(); hush();
  W = null; S.workoutLive = false;
  $("wk").hidden = true; $("wk").className = "wk"; document.body.classList.remove("locked");
  render();
}
function renderPre() {
  const s = W.session, rows = [], body = W.segs.filter(x => !x.label);
  rows.push(...W.segs.filter(x => x.label === "Warm-up" || x.label === "Easy cardio").map(x => [x.kind, x.label === "Easy cardio" && W.act ? W.act.name : x.label, mmss(x.len)]));
  if (body.length) {
    const runs = body.filter(x => x.kind !== "w"), walk = body.find(x => x.kind === "w");
    const same = runs.every(r => r.len === runs[0].len && r.kind === runs[0].kind);
    if (same && runs.length > 1) rows.push([runs[0].kind, `${runs.length} x ${runs[0].kind === "h" ? "quick" : "jog"} ${mmss(runs[0].len)}${walk ? " / walk " + mmss(walk.len) : ""}`, mmss(body.reduce((a, x) => a + x.len, 0))]);
    else body.forEach(x => rows.push([x.kind, x.kind === "r" ? "Easy jog" : x.kind === "h" ? "Quick" : "Walk", mmss(x.len)]));
  }
  rows.push(...W.segs.filter(x => x.label === "Cool-down").map(x => [x.kind, x.label, mmss(x.len)]));
  const [gc, gt] = gpsLabel(), fa = state.profile.fastActive, fastH = fa ? (Date.now() - fa.s) / 3600000 : 0;
  $("wk-inner").innerHTML = `
    <div class="bar-top"><button class="iconbtn" id="wk-close" aria-label="Close">${ICON.close}</button><span class="t">${esc(nice(W.date))}</span><span style="width:44px"></span></div>
    <div><div class="eyebrow">${s.kind === "run" ? "Run" : "Cardio"} &middot; ${Math.round(W.total / 60)} min</div><h2>${esc(W.act ? W.act.name : s.title)}</h2></div>
    <p class="desc">${esc(W.act ? "Easy, conversational effort for the whole session. Strength work follows on Today." : s.how)}</p>
    ${s.kind === "run" ? `<div class="seg" id="wk-where" role="group" aria-label="Where"><button type="button" data-v="outdoor" class="${W.where === "outdoor" ? "on" : ""}">Outdoor</button><button type="button" data-v="treadmill" class="${W.where === "treadmill" ? "on" : ""}">Treadmill</button></div>` : ""}
    ${W.act ? `<button class="btn" id="wk-change">${ICON.edit} Change activity</button>` : ""}
    ${fa ? `<div class="card" style="border-color:${fastH >= 20 ? "#e9a04d" : "var(--wk-line)"}"><span class="eyebrow">Fasted session &middot; ${Math.floor(fastH)} h in</span><p class="desc">${fastH >= 24 ? "You're more than 24 hours into a fast. Eat first, then train." : fastH >= 20 ? "Keep it easy, sip water, and stop if you feel light-headed." : "Easy effort only. Break your fast with protein within an hour after."}</p></div>` : ""}
    <div class="blocks">${rows.map(r => `<div><i style="background:${kindColor(r[0])}"></i><span>${esc(r[1])}</span><b>${r[2]}</b></div>`).join("")}</div>
    <div class="opts">
      <label class="switch"><span>Voice coaching<small>Tells you when to jog, walk and how you're doing</small></span><input type="checkbox" id="o-voice"${W.voice ? " checked" : ""}></label>
      <label class="switch"><span>GPS distance and pace<small id="wk-gps" class="gpsdot ${W.gpsOn ? gc : "off"}"><i></i><span>${W.gpsOn ? gt : "Off"}</span></small></span><input type="checkbox" id="o-gps"${W.gpsOn ? " checked" : ""}></label>
    </div>
    <p class="desc" style="font-size:13px">Keep the screen on and the app open. Turn your volume up to hear the cues over music.</p>
    <button class="start" id="wk-start">Start</button>`;
  $("wk-close").onclick = closeWorkout;
  $("o-voice").onchange = e => { W.voice = e.target.checked; setVoice(W.voice); };
  $("o-gps").onchange = e => { W.gpsOn = e.target.checked; if (W.gpsOn) gpsStart(); else gpsStop(); const el = $("wk-gps"); if (!W.gpsOn) { el.className = "gpsdot off"; el.querySelector("span").textContent = "Off"; } else paintGps(); };
  $("wk-start").onclick = startCountdown;
  const wh = $("wk-where");
  if (wh) wh.onclick = ev => { const b = ev.target.closest("button"); if (!b) return; W.where = b.dataset.v; W.gpsOn = W.where === "outdoor" && state.profile.gps !== false; if (W.gpsOn) gpsStart(); else gpsStop(); renderPre(); };
  if ($("wk-change")) $("wk-change").onclick = () => pickActivity(a => { W.act = a; W.gpsOn = a.gps && state.profile.gps !== false; if (W.gpsOn) gpsStart(); else gpsStop(); $("wk").hidden = false; renderPre(); }, "Which cardio?");
}
function startCountdown() {
  unlockAudio(); if (W.voice) unlockSpeech(); keepAwake();
  W.phase = "count";
  let n = 3;
  const show = () => { $("wk-inner").innerHTML = `<div class="count"><span>${n}</span></div>`; beep(660, 0.12); buzz(60); };
  show();
  const t = setInterval(() => { n--; if (!W) { clearInterval(t); return; } if (n > 0) show(); else { clearInterval(t); startLive(); } }, 1000);
}
function startLive() {
  W.phase = "live"; W.started = Date.now(); W.pausedAt = null; W.pausedFor = 0;
  W.gps = W.gpsOn ? { dist: 0, route: [], recent: [], splits: [], lastSplitAt: 0, last: null } : null;
  beep(880, 0.25); buzz([200]);
  $("wk-inner").innerHTML = `
    <div class="bar-top"><span class="t" id="lv-rnd"></span><span class="t" id="lv-left"></span></div>
    <div class="paused-banner" id="lv-paused" hidden>Paused</div>
    <div class="live">
      <div class="ringwrap"><svg viewBox="0 0 300 300"><circle class="bg" cx="150" cy="150" r="140" fill="none" stroke-width="14"/><circle class="fg" id="lv-ring" cx="150" cy="150" r="140" fill="none" stroke-width="14" stroke-dasharray="${C_RING}" stroke-dashoffset="0"/></svg>
        <div class="mid"><div class="lbl" id="lv-lbl"></div><div class="clock" id="lv-clock"></div><div class="rnd" id="lv-sub"></div></div></div>
      <div class="nextup" id="lv-next"></div>
      <div class="livestats"><div><b id="lv-dist">${W.gps ? "0.00" : "-"}</b><span>${du()}</span></div><div><b id="lv-pace">--:--</b><span>pace /${du()}</span></div><div><b id="lv-el">0:00</b><span>elapsed</span></div></div>
      <div class="tl" id="lv-tl">${W.segs.map(s => `<i class="${s.kind}" style="flex:${s.len}"></i>`).join("")}<span class="needle" id="lv-needle"></span></div>
      <div class="ctrl">
        <button class="side" id="lv-end"><span class="fill" id="lv-endfill"></span><span>Hold to end</span></button>
        <button class="main" id="lv-play" aria-label="Pause"></button>
        <button class="side" id="lv-skip"><span>Skip</span></button>
      </div>
    </div>`;
  $("lv-play").onclick = togglePause;
  $("lv-skip").onclick = skipSeg;
  holdToEnd($("lv-end"));
  W.timer = setInterval(tick, 200);
  tick();
}
function holdToEnd(btn) {
  let t0 = null, raf = null;
  const fill = $("lv-endfill");
  const cancel = () => { if (raf) cancelAnimationFrame(raf); raf = null; if (fill) fill.style.transform = "scaleX(0)"; };
  const step = () => {
    const p = Math.min(1, (Date.now() - t0) / 1000); fill.style.transform = `scaleX(${p})`;
    if (p >= 1) { cancel(); buzz([80, 60, 80]); finish(false); return; }
    raf = requestAnimationFrame(step);
  };
  btn.addEventListener("pointerdown", e => { e.preventDefault(); t0 = Date.now(); raf = requestAnimationFrame(step); });
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => btn.addEventListener(ev, cancel));
  btn.addEventListener("click", () => { if (!raf) toast("Press and hold to end"); });
}
const elapsed = () => (W ? ((W.pausedAt || Date.now()) - W.started - W.pausedFor) / 1000 : 0);
function togglePause() {
  if (!W || W.phase !== "live") return;
  if (W.pausedAt) { W.pausedFor += Date.now() - W.pausedAt; W.pausedAt = null; say("Resumed"); if (W.gps) { W.gps.last = null; W.gps.recent = []; } }
  else { W.pausedAt = Date.now(); say("Paused"); }
  buzz(40); tick();
}
function skipSeg() {
  if (!W || W.idx < 0) return;
  const seg = W.segs[W.idx], jump = seg.at + seg.len - elapsed() + 0.01;
  W.pausedFor -= jump * 1000; tick();
}
function cueFor(i) {
  const s = W.segs[i], runsLeft = W.segs.slice(i).filter(x => x.kind !== "w").length;
  if (s.label === "Warm-up") return "Warm up. Brisk walk for " + durWords(s.len) + ".";
  if (s.label === "Cool-down") return "Last part. Cool down walk for " + durWords(s.len) + ". Great work.";
  if (s.label === "Easy cardio") return (W.act ? W.act.name.replace(/\s*\(.*\)$/, "").replace(/\s*\/.*$/, "") : "Easy cardio") + " for " + durWords(s.len) + ". Conversational pace.";
  if (s.kind === "r") return (runsLeft === 1 && W.runs > 1 ? "Last one. " : "") + "Jog for " + durWords(s.len) + ". Easy pace.";
  if (s.kind === "h") return (runsLeft === 1 ? "Last one. " : "") + "Pick it up for " + durWords(s.len) + ". Quick but relaxed.";
  return "Walk for " + durWords(s.len) + ".";
}
function tick() {
  if (!W || W.phase !== "live") return;
  const e = elapsed();
  if (e >= W.total) { finish(true); return; }
  const i = W.segs.findIndex(s => e < s.at + s.len), seg = W.segs[i];
  if (i !== W.idx) {
    if (W.idx !== -1) { if (seg.kind === "w") { beep(520, 0.3); buzz([300]); } else { beep(880, 0.15, 3); buzz([150, 80, 150, 80, 150]); } }
    say(cueFor(i));
    W.idx = i; W.lastCount = null;
  }
  if (!W.half && e >= W.total / 2) { W.half = true; if (W.total > 600) say("Halfway done."); }
  const left = seg.at + seg.len - e;
  if (!W.pausedAt && left <= 3.2 && i < W.segs.length - 1 && Math.ceil(left) !== W.lastCount) { W.lastCount = Math.ceil(left); beep(700, 0.07); }
  $("wk").className = "wk " + (seg.kind === "r" ? "ph-r" : seg.kind === "h" ? "ph-h" : "");
  $("lv-lbl").textContent = seg.label === "Easy cardio" && W.act ? "Cardio" : kindName(seg);
  $("lv-clock").textContent = mmss(left);
  $("lv-ring").setAttribute("stroke-dashoffset", (C_RING * (1 - (e - seg.at) / seg.len)).toFixed(1));
  const runNo = W.segs.slice(0, i + 1).filter(x => x.kind !== "w").length;
  $("lv-sub").textContent = seg.kind !== "w" && W.runs > 1 ? (seg.kind === "h" ? "Quick " : "Jog ") + runNo + " of " + W.runs : seg.label ? "" : "Recover";
  $("lv-rnd").textContent = W.session.title;
  $("lv-left").textContent = mmss(W.total - e) + " left";
  const nx = W.segs[i + 1];
  $("lv-next").innerHTML = nx ? `Next: <b>${esc(kindName(nx))} ${mmss(nx.len)}</b>` : "Last stretch. Nice and easy.";
  $("lv-el").textContent = mmss(e);
  if (W.gps) { $("lv-dist").textContent = fmtDist(W.gps.dist); $("lv-pace").textContent = fmtPace(curPace()); }
  $("lv-tl").querySelectorAll("i").forEach((el, k) => { el.className = W.segs[k].kind + (k < i ? " past" : k === i ? " cur" : ""); });
  $("lv-needle").style.left = `calc(${(100 * e / W.total).toFixed(2)}% - 1.5px)`;
  $("lv-paused").hidden = !W.pausedAt;
  $("lv-play").innerHTML = W.pausedAt ? ICON.play : ICON.pause;
  $("lv-play").setAttribute("aria-label", W.pausedAt ? "Resume" : "Pause");
}
function finish(complete) {
  if (!W || W.phase !== "live") return;
  clearInterval(W.timer);
  const e = Math.min(elapsed(), W.total);
  W.phase = "done"; W.complete = complete; W.elapsed = e;
  W.ints = W.segs.map((s, k) => ({ k: s.kind, label: s.label || undefined, sec: Math.round(k < W.idx ? s.len : k === W.idx ? Math.max(0, e - s.at) : 0), m: Math.round(W.segDist[k]) })).filter(x => x.sec > 0);
  gpsStop(); releaseAwake();
  beep(988, 0.18, 3); buzz([100, 60, 100, 60, 250]);
  const dist = W.gps ? W.gps.dist : 0;
  if (complete) say("Workout complete. " + Math.round(e / 60) + " minutes" + (dist > 100 ? ", " + (dist / UNIT_M[du()]).toFixed(2) + (du() === "mi" ? " miles" : " kilometers") : "") + ". Well done.");
  renderSummary();
}
const RPE_TXT = { 2: "Very easy. Perfect.", 3: "Easy. Perfect.", 4: "Comfortable. Right on target.", 5: "Moderate. Slow the jogs a touch.", 6: "Getting hard for an easy run.", 7: "Hard. Slow down next time.", 8: "Very hard. Repeat this week." };
function renderSummary() {
  const s = W.session, e = W.elapsed, dist = W.gps ? W.gps.dist : 0, route = W.gps ? simplify(W.gps.route) : [];
  const runSec = W.ints.filter(x => x.k !== "w").reduce((a, x) => a + x.sec, 0);
  W.route = route; W.rpe = null; W.pain = null;
  $("wk").className = "wk";
  $("wk-inner").innerHTML = `
    <div class="bar-top"><span class="t">${esc(nice(W.date))}</span><span></span></div>
    <div><div class="eyebrow">${W.complete ? "Session complete" : "Session ended early"}</div><h2 style="font-size:48px">${esc(s.title)}</h2></div>
    <div class="sumstats">
      <div><b>${mmss(e)}</b><span>Time</span></div>
      <div><b>${dist > 20 ? fmtDist(dist) : "-"}</b><span>${du() === "mi" ? "Miles" : "Km"}</span></div>
      <div><b>${dist > 100 ? fmtPace(e / (dist / UNIT_M[du()])) : "-"}</b><span>Avg pace /${du()}</span></div>
      <div><b>${s.kind === "run" ? mmss(runSec) : W.ints.length}</b><span>${s.kind === "run" ? "Time jogging" : "Blocks"}</span></div>
    </div>
    ${route.length > 1 ? `<div class="map" id="sum-map"></div>` : ""}
    ${dist < 20 && (s.kind === "run" || (W.act && W.act.distance)) ? `<div class="card"><label class="f"><span class="eyebrow">Distance (${du()}, optional)</span><input type="number" inputmode="decimal" step="0.01" id="sm-dist" placeholder="From the ${W.where === "treadmill" ? "treadmill" : "machine"} display" style="background:rgba(255,255,255,.05);border-color:var(--wk-line);color:var(--wk-ink)"></label></div>` : ""}
    ${s.kind === "run" ? `<div class="card"><div class="eyebrow">Intervals</div>${intervalTable(W.ints, true) || `<p class="desc">No jog intervals recorded.</p>`}</div>` : ""}
    <div class="card">
      <div class="eyebrow">How hard did it feel?</div>
      ${segHtml("sm-rpe", [[2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"], [7, "7"], [8, "8+"]], null, 'aria-label="Effort"')}
      <p class="desc" id="sm-rpel">2-4 is easy, where these weeks should be.</p>
      <div class="eyebrow" style="margin-top:6px">Any pain?</div>
      ${segHtml("sm-pain", [["no", "No"], ["niggle", "Niggle"], ["yes", "Yes"]], null, 'aria-label="Any pain"')}
      <textarea id="sm-notes" placeholder="Notes: heat, who you ran with, how your legs felt"></textarea>
    </div>
    ${state.profile.fastActive ? `<div class="card"><span class="eyebrow">You're still fasting</span><p class="desc">Break your fast within about an hour with 30-40 g of protein and some carbs.</p></div>` : ""}
    <button class="start" id="sm-save">Save activity</button>
    <button class="btn danger" id="sm-discard">Discard</button>`;
  if (route.length > 1) drawMap($("sum-map"), route, true);
  [["sm-rpe", "rpe", Number], ["sm-pain", "pain", String]].forEach(([id, k, cast]) => {
    $(id).querySelectorAll("button").forEach(b => (b.onclick = () => {
      W[k] = cast(b.dataset.v); $(id).querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
      if (k === "rpe") $("sm-rpel").textContent = RPE_TXT[W.rpe] || "";
    }));
  });
  let arm = false;
  $("sm-discard").onclick = () => { if (!arm) { arm = true; $("sm-discard").textContent = "Tap again to discard"; return; } closeWorkout(); toast("Discarded"); };
  $("sm-save").onclick = saveWorkout;
}
function simplify(route) {
  // keep the route small enough to store: drop points closer than 8 m, then thin to at most 600
  const out = [];
  route.forEach(p => { if (!out.length || hav(out[out.length - 1], p) >= 8) out.push([+p[0].toFixed(5), +p[1].toFixed(5)]); });
  if (out.length <= 600) return out;
  const step = out.length / 600, thin = [];
  for (let i = 0; i < 600; i++) thin.push(out[Math.floor(i * step)]);
  thin.push(out[out.length - 1]);
  return thin;
}
function saveWorkout() {
  const d = day(W.date), s = W.session, notes = $("sm-notes").value.trim();
  let dist = W.gps ? Math.round(W.gps.dist) : 0;
  const md = $("sm-dist") ? Number($("sm-dist").value) : 0;
  if (dist < 20 && md > 0) dist = Math.round(md * UNIT_M[du()]);
  const intensity = W.rpe ? (W.rpe <= 4 ? 0 : W.rpe <= 6 ? 1 : 2) : 1;
  if (W.free) {
    const rec = { id: Math.random().toString(36).slice(2, 9), type: W.act.id, min: Math.max(1, Math.round(W.elapsed / 60)), int: intensity, distM: dist || null, route: W.route.length > 1 ? W.route : null };
    d.acts = [...(Array.isArray(d.acts) ? d.acts : []), rec];
  } else if (s.kind === "run") Object.assign(d, { runDone: true, runTitle: s.title + (W.where === "treadmill" ? " (treadmill)" : ""), runWhere: W.where, runAct: W.where === "treadmill" ? "run-tread" : "run-out", runDur: Math.round(W.elapsed), runMin: Math.round(W.elapsed / 60), runDistM: dist || null, route: W.route.length > 1 ? W.route : null, ints: W.ints, splits: W.gps && W.gps.splits.length ? W.gps.splits.map(Math.round) : null });
  else Object.assign(d, { crossDone: true, crossDur: Math.round(W.elapsed), crossMin: Math.round(W.elapsed / 60), crossDistM: dist || null, crossRoute: W.route.length > 1 ? W.route : null, crossType: W.act.name, crossAct: W.act.id, crossInt: intensity });
  if (W.rpe) d.rpe = W.rpe;
  if (W.pain) d.pain = W.pain;
  if (notes) d.notes = d.notes ? d.notes + "\n" + notes : notes;
  saveDay(W.date);
  state.sel = W.date; state.view = "today";
  closeWorkout();
  toast("Activity saved");
}
document.addEventListener("visibilitychange", () => { if (W && W.phase === "live" && document.visibilityState === "visible") { keepAwake(); tick(); } });
