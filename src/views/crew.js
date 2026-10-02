// Crew: create or join a group, weekly leaderboard. The crew_board function returns weekly
// totals only; friends never see weight, food, notes or routes.
import { act, onChange, confirmTap, toast, ICON } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { iso, addDays, today, weekStart, shortDate } from "../lib/dates.js";
import { state, S, render } from "../core/state.js";
import { sb, saveProfile } from "../core/store.js";
import { showAuth, onSignedIn } from "../core/auth.js";
import { fmtDist } from "../features/activity.js";

let crews = null, board = null, back = 0, busy = false, msg = "", pending = null;
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
async function load() {
  const { data, error } = await sb.from("crew_members").select("crew_id, display_name, crews(id, name, code)").eq("user_id", S.uid);
  if (error) throw error;
  crews = (data || []).filter(r => r.crews).map(r => ({ id: r.crews.id, name: r.crews.name, code: r.crews.code }));
  if (crews.length && !crews.some(c => c.id === state.profile.crewId)) { state.profile.crewId = crews[0].id; saveProfile(); }
  const c = crews.find(x => x.id === state.profile.crewId);
  if (!c) { board = null; return; }
  const ws = addDays(weekStart(today()), -7 * back);
  const r = await sb.rpc("crew_board", { p_crew: c.id, p_from: iso(ws), p_to: iso(addDays(ws, 6)) });
  if (r.error) throw r.error;
  board = (r.data || []).sort((a, b) => (b.runs - a.runs) || (b.run_sec - a.run_sec) || (b.strength + b.cross_days - a.strength - a.cross_days));
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
  if (S.localOnly || !sb || !S.uid) h = `<div class="card empty"><b>Crews need an account</b>Sign in so your friends can see your weekly runs.<br><br><button class="btn primary" data-act="crew-signin">Sign in or create account</button></div>`;
  else if (crews === null) { h = `<div class="card empty"><b>Loading your crew...</b></div>`; refreshCrew(); }
  else if (msg) h = `<div class="card empty"><b>Leaderboard unavailable</b>${esc(msg)}<br><br><button class="btn" data-act="crew-retry">Try again</button></div>`;
  else if (!crews.length || pending !== null) h = joinHtml();
  else h = boardHtml();
  root.innerHTML = `<section class="view"><h1 class="big-title">Crew</h1>${h}</section>`;
}
function boardHtml() {
  const c = crews.find(x => x.id === state.profile.crewId) || crews[0];
  const ws = addDays(weekStart(today()), -7 * back), we = addDays(ws, 6), link = location.origin + "/?join=" + c.code;
  return `<div class="card"><div class="card-head"><div><div class="eyebrow">Your crew</div><h2 class="big-title" style="font-size:28px">${esc(c.name)}</h2></div>
      ${crews.length > 1 ? `<select data-chg="crew-pick" style="width:auto">${crews.map(x => `<option value="${x.id}"${x.id === c.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>` : ""}</div>
    <div class="datenav"><button class="iconbtn" data-act="crew-week" data-n="1" aria-label="Previous week">${ICON.back}</button>
      <div><div class="t" style="font-size:20px">${back === 0 ? "This week" : back === 1 ? "Last week" : shortDate(ws)}</div><div class="note">${shortDate(ws)} - ${shortDate(we)}</div></div>
      <button class="iconbtn" data-act="crew-week" data-n="-1" aria-label="Next week"${back === 0 ? ' disabled style="opacity:.3"' : ""}>${ICON.next}</button></div>
    <div class="board">${!board ? `<p class="note">Loading...</p>` : board.map((m, i) => {
      const mins = Math.round(m.run_sec / 60), extra = m.strength + m.cross_days;
      return `<div class="brow${i === 0 ? " first" : ""}${m.is_me ? " me" : ""}${i === 0 && m.runs ? " r1" : ""}"><div class="rk">${i + 1}</div>
        <div><div class="nm">${esc(m.display_name)}${m.is_me ? " (you)" : ""}</div><div class="sub">${mins} min${m.dist_m > 50 ? " &middot; " + fmtDist(m.dist_m) + " " + state.profile.dunit : ""}${extra ? " &middot; " + extra + " strength/cardio" : ""}</div></div>
        <div class="dots3" aria-label="${m.runs} of 3 runs">${[0, 1, 2].map(k => `<i class="${k < m.runs ? "on" : ""}"></i>`).join("")}${m.runs > 3 ? `<b style="font-size:12px">+${m.runs - 3}</b>` : ""}</div></div>`; }).join("")}</div>
    <p class="note">Ranked by runs, then running minutes. Everyone's goal is 3 runs a week. Only these totals are shared.</p></div>
  <div class="card"><h3>Invite friends</h3>
    <div class="card-head"><span class="code">${esc(c.code)}</span><button class="btn" data-act="crew-share" data-code="${esc(c.code)}" data-name="${esc(c.name)}">${ICON.share} Share invite</button></div>
    <p class="note">Friends open <span style="user-select:all;-webkit-user-select:all;font-weight:700;overflow-wrap:anywhere">${esc(link)}</span>, create an account, and they're in. Or they can enter the code on their Crew tab.</p></div>
  <div class="row"><button class="btn" data-act="crew-join-another">Join another crew</button><button class="btn danger" data-act="crew-leave" data-id="${c.id}" data-name="${esc(c.name)}">Leave crew</button></div>`;
}
function joinHtml() {
  const has = crews && crews.length, name = myName();
  return `${has ? `<button class="linkbtn" data-act="crew-back">&larr; Back to your crew</button>` : `<p class="note">Make a group for the friends you train with. Everyone sees who has done their 3 runs this week. Only weekly totals are shared, never your weight, food or routes.</p>`}
    <div class="card"><h3>Join with a code</h3>
      <div class="row"><label class="f">Invite code<input id="cj-code" maxlength="12" autocapitalize="characters" autocomplete="off" value="${esc(pending || "")}" style="text-transform:uppercase;letter-spacing:.15em;font-weight:800"></label>
      <label class="f">Your name<input id="cj-name" maxlength="40" value="${esc(name)}"></label></div>
      <button class="btn primary big" data-act="crew-join">Join crew</button></div>
    <div class="card"><h3>Or start a new crew</h3>
      <div class="row"><label class="f">Crew name<input id="cc-name" maxlength="60" placeholder="e.g. Sunday Runners"></label>
      <label class="f">Your name<input id="cc-me" maxlength="40" value="${esc(name)}"></label></div>
      <button class="btn big" data-act="crew-create">Create crew</button></div>`;
}
const joined = (crew, display) => {
  state.profile.crewId = crew.id; if (!state.profile.displayName) state.profile.displayName = display; saveProfile();
  setPending(null); crews = null; board = null; back = 0; render();
};
act("crew-signin", () => { S.localOnly = false; try { localStorage.removeItem("runback.localOnly"); } catch (e) { /* ignore */ } showAuth(true); });
act("crew-retry", () => { msg = ""; crews = null; render(); });
act("crew-week", el => { const n = Number(el.dataset.n); if (back + n < 0) return; back += n; board = null; render(); refreshCrew(); });
act("crew-join-another", () => { pending = ""; render(); });
act("crew-back", () => { setPending(null); render(); });
act("crew-share", async el => {
  const link = location.origin + "/?join=" + el.dataset.code, text = `Join my crew "${el.dataset.name}". Code ${el.dataset.code}: ${link}`;
  try { if (navigator.share) { await navigator.share({ title: "Join my crew", text, url: link }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast("Invite copied"); } catch (e) { toast("Code: " + el.dataset.code); }
});
act("crew-leave", async el => {
  if (!confirmTap("leave" + el.dataset.id, el, "Tap again to leave")) return;
  const { error } = await sb.from("crew_members").delete().eq("crew_id", el.dataset.id).eq("user_id", S.uid);
  if (error) { toast("Couldn't leave: " + error.message); return; }
  state.profile.crewId = null; saveProfile(); crews = null; board = null; toast("You left " + el.dataset.name); render();
});
act("crew-join", async el => {
  const code = document.getElementById("cj-code").value.trim().toUpperCase(), display = document.getElementById("cj-name").value.trim();
  if (!code || !display) { toast("Enter the code and your name"); return; }
  el.disabled = true;
  const { data, error } = await sb.rpc("join_crew", { p_code: code, p_display: display });
  el.disabled = false;
  if (error) { toast(/No crew/.test(error.message) ? "No crew with that code. Check it and try again." : error.message); return; }
  toast("Joined " + data.name); joined(data, display);
});
act("crew-create", async el => {
  const nm = document.getElementById("cc-name").value.trim(), display = document.getElementById("cc-me").value.trim();
  if (!nm || !display) { toast("Name the crew and yourself"); return; }
  el.disabled = true;
  const { data, error } = await sb.rpc("create_crew", { p_name: nm, p_display: display });
  el.disabled = false;
  if (error) { toast(error.message); return; }
  toast("Crew created. Share the code with your friends."); joined(data, display);
});
onChange("crew-pick", el => { state.profile.crewId = el.value; saveProfile(); board = null; render(); refreshCrew(); });
