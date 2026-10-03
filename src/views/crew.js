// Crew: train with friends. Weekly points, a clear "your week" summary, cheers, and a simple
// invite. The crew_board function shares weekly totals only: never weight, food, notes or routes.
import { act, onChange, confirmTap, toast, ICON } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { iso, addDays, today, weekStart, shortDate } from "../lib/dates.js";
import { state, S, render } from "../core/state.js";
import { sb, saveProfile } from "../core/store.js";
import { showAuth, onSignedIn } from "../core/auth.js";
import { buzz } from "../lib/sound.js";

// Points make the ranking easy to read. A run is the plan's core, so it counts most.
export const POINTS = { run: 10, train: 5, fast: 3 };
export const pointsOf = m => m.runs * POINTS.run + Math.max(m.strength, m.cross_days) * POINTS.train + m.fast_days * POINTS.fast;

let crews = null, board = null, back = 0, busy = false, msg = "", pending = null, showSettings = false;
const setPending = v => { pending = v; try { if (v) localStorage.setItem("runback.join", v); else localStorage.removeItem("runback.join"); } catch (e) { /* ignore */ } };

// An invite link (?join=CODE) is remembered until used, so it survives sign-up and email confirmation.
export function captureInvite() {
  try {
    const q = new URLSearchParams(location.search).get("join");
    if (q) { setPending(q.toUpperCase().slice(0, 12)); history.replaceState(null, "", location.pathname); }
    else pending = localStorage.getItem("runback.join");
  } catch (e) { /* ignore */ }
  return pending != null;
}
onSignedIn(() => { crews = null; board = null; });

const myName = () => (state.profile.displayName || "").trim() || (S.email ? S.email.split("@")[0] : "");
const weekFrom = () => addDays(weekStart(today()), -7 * back);
const current = () => (crews || []).find(x => x.id === state.profile.crewId) || (crews || [])[0];
// stable colour per person, from their id
const hue = id => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const avatar = m => `<span class="avatar" style="background:hsl(${hue(m.user_id)} 55% 42%)" aria-hidden="true">${esc((m.display_name || "?").trim().charAt(0).toUpperCase())}</span>`;

async function load() {
  const { data, error } = await sb.from("crew_members").select("crew_id, crews(id, name, code)").eq("user_id", S.uid);
  if (error) throw error;
  crews = (data || []).filter(r => r.crews).map(r => ({ id: r.crews.id, name: r.crews.name, code: r.crews.code }));
  if (crews.length && !crews.some(c => c.id === state.profile.crewId)) { state.profile.crewId = crews[0].id; saveProfile(); }
  const c = current(); if (!c) { board = null; return; }
  const ws = weekFrom();
  const r = await sb.rpc("crew_board", { p_crew: c.id, p_from: iso(ws), p_to: iso(addDays(ws, 6)) });
  if (r.error) throw r.error;
  board = (r.data || []).map(m => ({ ...m, pts: pointsOf(m) })).sort((a, b) => (b.pts - a.pts) || (b.run_sec - a.run_sec));
}
export async function refreshCrew() {
  if (!sb || !S.uid || busy) return;
  busy = true;
  try { await load(); msg = ""; } catch (e) { msg = navigator.onLine ? "Couldn't load your crew. Try again in a moment." : "You're offline. The leaderboard needs a connection."; }
  busy = false;
  if (state.view === "crew") render();
}

export function renderCrew(root) {
  let h;
  if (S.localOnly || !sb || !S.uid) h = `<div class="card empty"><b>Crews need an account</b>Sign in so your friends can see your week and cheer you on.<br><br><button class="btn primary" data-act="crew-signin">Sign in or create account</button></div>`;
  else if (crews === null) { h = `<div class="card empty"><b>Loading your crew...</b></div>`; refreshCrew(); }
  else if (msg) h = `<div class="card empty"><b>Leaderboard unavailable</b>${esc(msg)}<br><br><button class="btn" data-act="crew-retry">Try again</button></div>`;
  else if (!crews.length || pending !== null) h = joinHtml();
  else h = boardHtml();
  root.innerHTML = `<section class="view"><h1 class="big-title">Crew</h1>${h}</section>`;
}

function meter(label, v, max, color) {
  return `<div class="meter"><div class="card-head"><span>${label}</span><b>${v}${max ? "/" + max : ""}</b></div><div class="bar"><i style="width:${max ? Math.min(100, 100 * v / max) : Math.min(100, v * 15)}%;background:${color}"></i></div></div>`;
}
function boardHtml() {
  const c = current(), ws = weekFrom(), we = addDays(ws, 6), link = location.origin + "/?join=" + c.code;
  const me = board && board.find(m => m.is_me), rank = board ? board.findIndex(m => m.is_me) + 1 : 0;
  const weekLabel = back === 0 ? "This week" : back === 1 ? "Last week" : "Week of " + shortDate(ws);
  return `
  <div class="card crew-head">
    <div class="card-head"><div style="min-width:0"><div class="eyebrow">Your crew &middot; ${board ? board.length : "-"} ${board && board.length === 1 ? "member" : "members"}</div><h2 class="big-title" style="font-size:30px;overflow-wrap:anywhere">${esc(c.name)}</h2></div></div>
    <button class="btn primary big" data-act="crew-share" data-code="${esc(c.code)}" data-name="${esc(c.name)}">${ICON.share} Invite friends</button>
    ${board && board.length === 1 ? `<p class="note">It's just you so far. Send the invite to your training friends: they tap the link, create an account, and they're in.</p>` : ""}
  </div>
  ${me ? `<div class="card"><div class="card-head"><h3>Your week</h3><span class="pill run">${me.pts} pts${board.length > 1 ? " &middot; #" + rank + " of " + board.length : ""}</span></div>
    ${meter("Runs", me.runs, 3, "var(--accent)")}
    ${meter("Strength or cardio days", Math.max(me.strength, me.cross_days), 2, "var(--violet)")}
    ${meter("Fasting days", me.fast_days, 0, "var(--fast)")}
    ${me.cheers ? `<p class="note">${me.cheers} ${me.cheers === 1 ? "teammate has" : "teammates have"} cheered you on this week.</p>` : ""}</div>` : ""}
  <div class="card">
    <div class="datenav"><button class="iconbtn" data-act="crew-week" data-n="1" aria-label="Previous week">${ICON.back}</button>
      <div><div class="t" style="font-size:20px">${weekLabel}</div><div class="note">${shortDate(ws)} - ${shortDate(we)}</div></div>
      <button class="iconbtn" data-act="crew-week" data-n="-1" aria-label="Next week"${back === 0 ? ' disabled style="opacity:.3"' : ""}>${ICON.next}</button></div>
    <div class="board">${!board ? `<p class="note">Loading...</p>` : board.map((m, i) => `
      <div class="brow${i === 0 ? " first" : ""}${m.is_me ? " me" : ""}">
        <div class="rk${i === 0 && m.pts ? " gold" : ""}">${i + 1}</div>
        ${avatar(m)}
        <div style="min-width:0"><div class="nm">${esc(m.display_name)}${m.is_me ? " (you)" : ""}</div>
          <div class="statline"><span class="stc run">${m.runs}/3 runs</span><span class="stc train">${Math.max(m.strength, m.cross_days)} train</span><span class="stc fast">${m.fast_days} fast</span></div></div>
        <div class="right"><b class="pts">${m.pts}</b><span class="note">pts</span>
          ${m.is_me ? (m.cheers ? `<span class="cheers">${ICON.star} ${m.cheers}</span>` : "") : back === 0
            ? `<button class="cheer${m.cheered_by_me ? " on" : ""}" data-act="crew-cheer" data-to="${m.user_id}" aria-pressed="${m.cheered_by_me}">${ICON.star} ${m.cheered_by_me ? "Cheered" : "Cheer"}${m.cheers ? " " + m.cheers : ""}</button>`
            : (m.cheers ? `<span class="cheers">${ICON.star} ${m.cheers}</span>` : "")}</div>
      </div>`).join("")}</div>
    <details class="manual"><summary>How points work</summary>
      <p class="note">Each run day scores ${POINTS.run}, each strength or cardio day ${POINTS.train}, and each day with a completed fast ${POINTS.fast}. The aim is consistency, not extremes: 3 runs, 2 strength or cardio days and a fasting routine is a top week. Friends only see these totals, never your weight, food, notes or routes.</p></details>
  </div>
  <div class="card"><h3>Invite code</h3>
    <div class="card-head"><span class="code">${esc(c.code)}</span><button class="btn" data-act="crew-copy" data-link="${esc(link)}">Copy link</button></div>
    <p class="note">Friends can also type this code on their Crew tab.</p></div>
  <button class="linkbtn" data-act="crew-settings">${showSettings ? "Hide crew settings" : "Crew settings"}</button>
  ${showSettings ? `<div class="card">
    ${crews.length > 1 ? `<label class="f">Show crew<select data-chg="crew-pick">${crews.map(x => `<option value="${x.id}"${x.id === c.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>` : ""}
    <div class="row"><button class="btn" data-act="crew-join-another">Join or start another crew</button><button class="btn danger" data-act="crew-leave" data-id="${c.id}" data-name="${esc(c.name)}">Leave crew</button></div></div>` : ""}`;
}
function joinHtml() {
  const has = crews && crews.length, name = myName();
  return `${has ? `<button class="linkbtn" data-act="crew-back">&larr; Back to your crew</button>` : `
    <div class="card"><h3>Train together, stay consistent</h3>
      <div class="steps">
        <div><span class="n">1</span><p><b>Start or join a crew</b><br><span class="note">Name it after your running group, gym or family.</span></p></div>
        <div><span class="n">2</span><p><b>Invite your friends</b><br><span class="note">Share a link. They create an account and they're in.</span></p></div>
        <div><span class="n">3</span><p><b>Keep your week, cheer each other</b><br><span class="note">Points for runs, training and fasts. Only weekly totals are shared.</span></p></div>
      </div></div>`}
    <div class="card"><h3>${pending ? "You've been invited" : "Join a crew"}</h3>
      <div class="row"><label class="f">Invite code<input id="cj-code" maxlength="12" autocapitalize="characters" autocomplete="off" value="${esc(pending || "")}" style="text-transform:uppercase;letter-spacing:.15em;font-weight:800"></label>
      <label class="f">Your name<input id="cj-name" maxlength="40" value="${esc(name)}" placeholder="First name"></label></div>
      <button class="btn primary big" data-act="crew-join">Join crew</button></div>
    <div class="card"><h3>Start a new crew</h3>
      <div class="row"><label class="f">Crew name<input id="cc-name" maxlength="60" placeholder="e.g. Sunday Runners"></label>
      <label class="f">Your name<input id="cc-me" maxlength="40" value="${esc(name)}" placeholder="First name"></label></div>
      <button class="btn big" data-act="crew-create">Create crew</button></div>`;
}

const joined = (crew, display) => {
  state.profile.crewId = crew.id; if (!state.profile.displayName) state.profile.displayName = display; saveProfile();
  setPending(null); crews = null; board = null; back = 0; render();
};
act("crew-signin", () => { S.localOnly = false; try { localStorage.removeItem("runback.localOnly"); } catch (e) { /* ignore */ } showAuth(true); });
act("crew-retry", () => { msg = ""; crews = null; render(); });
act("crew-week", el => { const n = Number(el.dataset.n); if (back + n < 0) return; back += n; board = null; render(); refreshCrew(); });
act("crew-settings", () => { showSettings = !showSettings; render(); });
act("crew-join-another", () => { pending = ""; showSettings = false; render(); });
act("crew-back", () => { setPending(null); render(); });
act("crew-share", async el => {
  const link = location.origin + "/?join=" + el.dataset.code, text = `Join my crew "${el.dataset.name}" and let's keep each other on track. Code ${el.dataset.code}: ${link}`;
  try { if (navigator.share) { await navigator.share({ title: "Join my crew", text, url: link }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast("Invite copied: paste it to your friends"); } catch (e) { toast("Code: " + el.dataset.code); }
});
act("crew-copy", async el => { try { await navigator.clipboard.writeText(el.dataset.link); toast("Link copied"); } catch (e) { toast(el.dataset.link); } });
act("crew-cheer", async el => {
  const c = current(), to = el.dataset.to, m = board.find(x => x.user_id === to), ws = iso(weekFrom());
  el.disabled = true;
  const q = m.cheered_by_me
    ? sb.from("crew_cheers").delete().eq("crew_id", c.id).eq("from_user", S.uid).eq("to_user", to).eq("week_start", ws)
    : sb.from("crew_cheers").insert({ crew_id: c.id, from_user: S.uid, to_user: to, week_start: ws });
  const { error } = await q;
  el.disabled = false;
  if (error) { toast("Couldn't send that. Try again."); return; }
  m.cheered_by_me = !m.cheered_by_me; m.cheers += m.cheered_by_me ? 1 : -1;
  if (m.cheered_by_me) { buzz(20); toast("Cheered " + m.display_name); }
  render();
});
act("crew-leave", async el => {
  if (!confirmTap("leave" + el.dataset.id, el, "Tap again to leave")) return;
  const { error } = await sb.from("crew_members").delete().eq("crew_id", el.dataset.id).eq("user_id", S.uid);
  if (error) { toast("Couldn't leave: " + error.message); return; }
  state.profile.crewId = null; saveProfile(); crews = null; board = null; showSettings = false; toast("You left " + el.dataset.name); render();
});
act("crew-join", async el => {
  const code = document.getElementById("cj-code").value.trim().toUpperCase(), display = document.getElementById("cj-name").value.trim();
  if (!code || !display) { toast("Enter the code and your name"); return; }
  el.disabled = true;
  const { data, error } = await sb.rpc("join_crew", { p_code: code, p_display: display });
  el.disabled = false;
  if (error) { toast(/No crew/.test(error.message) ? "No crew with that code. Check it and try again." : error.message); return; }
  toast("Welcome to " + data.name); joined(data, display);
});
act("crew-create", async el => {
  const nm = document.getElementById("cc-name").value.trim(), display = document.getElementById("cc-me").value.trim();
  if (!nm || !display) { toast("Name the crew and yourself"); return; }
  el.disabled = true;
  const { data, error } = await sb.rpc("create_crew", { p_name: nm, p_display: display });
  el.disabled = false;
  if (error) { toast(error.message); return; }
  toast("Crew created. Now invite your friends."); joined(data, display);
});
onChange("crew-pick", el => { state.profile.crewId = el.value; saveProfile(); board = null; render(); refreshCrew(); });
