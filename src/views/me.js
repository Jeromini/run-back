// Profile and settings.
import { APP_NAME } from "../config.js";
import { act, onChange, segHtml, toast, ICON } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { today } from "../lib/dates.js";
import { state, S, render } from "../core/state.js";
import { saveProfile, sb } from "../core/store.js";
import { isPro } from "../core/premium.js";
import { signOut, changePassword } from "../core/auth.js";
import { weekOf } from "../domain/plan.js";
import { planFor } from "../domain/fasting.js";
import { badgesSummary } from "../features/badges.js";

const ftIn = cm => { const t = cm / 2.54; let f = Math.floor(t / 12), i = Math.round(t - f * 12); if (i === 12) { f++; i = 0; } return [f, i]; };

export function applyTheme() {
  const t = state.profile.theme || "system";
  if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
}

export function renderMe(root) {
  const p = state.profile, [ft, inch] = p.heightCm ? ftIn(p.heightCm) : ["", ""];
  root.innerHTML = `<section class="view"><button class="backlink" data-act="go-more">${ICON.back} More</button><h1 class="big-title">My profile</h1>
    ${isPro()
      ? `<button class="card" data-act="paywall" style="text-align:left;cursor:pointer;border-color:var(--gold-2)"><div class="card-head"><h3>${esc(APP_NAME)} Premium</h3><span class="pro-tag">Active</span></div><p class="note">Every feature unlocked. Thank you for your support.</p></button>`
      : `<div class="card" style="border-color:var(--gold-2)"><div class="card-head"><h3>Go Premium</h3><span class="pro-tag">Pro</span></div><p class="note">The Fast + Train coach, every fasting plan, deep trends, the full guide library and data export.</p><button class="btn gold" data-act="paywall">${ICON.star} See Premium</button></div>`}
    ${badgesSummary()}
    <div class="card"><h3>Your numbers</h3>
      <label class="f">Your name (shown to your crew)<input type="text" id="s-name" maxlength="40" placeholder="First name" value="${esc(p.displayName || "")}"></label>
      <div class="row"><label class="f">Units${segHtml("s-unit", [["lb", "lb, mi"], ["kg", "kg, km"]], p.unit, 'data-act="set-units"')}</label>
        <label class="f">Age<input type="number" id="s-age" inputmode="numeric" value="${esc(p.age || "")}"></label></div>
      ${p.unit === "kg"
        ? `<label class="f">Height (cm)<input type="number" id="s-cm" inputmode="numeric" value="${esc(p.heightCm ? Math.round(p.heightCm) : "")}"></label>`
        : `<div class="row"><label class="f">Height (ft)<input type="number" id="s-ft" inputmode="numeric" value="${esc(ft)}"></label><label class="f">(in)<input type="number" id="s-in" inputmode="numeric" value="${esc(inch)}"></label></div>`}
      <div class="row"><label class="f">Starting weight (${p.unit})<input type="number" id="s-start" inputmode="decimal" step="0.1" value="${esc(p.startWeight || "")}"></label>
        <label class="f">Goal weight (${p.unit})<input type="number" id="s-goal" inputmode="decimal" step="0.1" value="${esc(p.goalWeight || "")}"></label></div>
      <label class="f">Plan start date<input type="date" id="s-startdate" value="${esc(p.startDate || "")}"></label>
      <label class="f">Injuries or health notes<textarea id="s-health" placeholder="Anything that affects training or fasting">${esc(p.health || "")}</textarea></label>
      <button class="btn primary big" data-act="me-save">Save</button>
      <button class="linkbtn" data-act="onb-open">Run the setup again</button></div>
    <div class="card"><h3>Training plan</h3>
      <p class="note">You're in week ${weekOf(today(), p) || "-"}. Repeat a week when the runs feel hard or something aches. Weeks repeated so far: ${p.weekOffset || 0}.</p>
      <div class="row"><button class="btn" data-act="week-repeat">Repeat this week</button><button class="btn ghost" data-act="week-unrepeat">Undo a repeat</button></div></div>
    <div class="card"><h3>Fasting</h3><div class="card-head"><span class="note">Current plan</span><button class="planbtn" data-act="fast-plans">${ICON.timer} ${esc(planFor(p).label)}</button></div></div>
    <div class="card"><h3>Workouts</h3>
      <label class="switch">Voice coaching<input type="checkbox" data-chg="pref" data-k="voice"${p.voice !== false ? " checked" : ""}></label>
      <label class="switch">GPS distance and pace<input type="checkbox" data-chg="pref" data-k="gps"${p.gps !== false ? " checked" : ""}></label>
      <label class="switch">Beeps<input type="checkbox" data-chg="pref" data-k="beeps"${p.beeps !== false ? " checked" : ""}></label></div>
    <div class="card"><h3>Appearance</h3>${segHtml("s-theme", [["system", "Auto"], ["dark", "Dark"], ["light", "Light"]], p.theme || "system", 'data-act="set-theme"')}</div>
    <div class="card"><h3>Account</h3>
      <p class="note">${S.localOnly ? "Using the app without an account. Entries stay on this phone. Sign in to sync them." : "Signed in as " + esc(S.email) + ". Your data syncs to any device you sign in on."}</p>
      ${S.localOnly ? "" : `<div class="quickw"><input type="password" id="s-newpw" autocomplete="new-password" placeholder="New password"><button class="btn" data-act="me-pw">Change</button></div>`}
      <button class="btn ghost" data-act="me-signout">${S.localOnly ? "Sign in or create account" : "Sign out"}</button></div>
    <p class="note">Stop and get medical advice for chest pain, faintness or unusual breathlessness. Fasting isn't suitable if you're pregnant, have a history of eating disorders, or have diabetes or take medication without your doctor's advice. In the heat, run early or late and carry water.</p>
  </section>`;
}

act("me-save", () => {
  const p = state.profile, v = id => { const el = document.getElementById(id); return el && el.value !== "" ? Number(el.value) : null; };
  const name = document.getElementById("s-name").value.trim();
  if (name && name !== p.displayName && sb && S.uid && !S.localOnly) sb.from("crew_members").update({ display_name: name }).eq("user_id", S.uid).then(() => {});
  p.displayName = name; p.age = v("s-age");
  if (p.unit === "kg") { const cm = v("s-cm"); p.heightCm = cm || null; }
  else { const f = v("s-ft"), i = v("s-in"); p.heightCm = f || i ? Math.round(((f || 0) * 12 + (i || 0)) * 2.54 * 10) / 10 : null; }
  p.startWeight = v("s-start"); p.goalWeight = v("s-goal");
  p.startDate = document.getElementById("s-startdate").value || p.startDate;
  p.health = document.getElementById("s-health").value.trim();
  saveProfile(); toast("Saved"); render();
});
act("set-units", (el, ev) => {
  const b = ev.target.closest("button"); if (!b || b.dataset.v === state.profile.unit) return;
  state.profile.unit = b.dataset.v; state.profile.dunit = b.dataset.v === "kg" ? "km" : "mi";
  saveProfile(); toast("Units changed. Existing weights keep their numbers, so re-enter them if needed."); render();
});
act("set-theme", (el, ev) => { const b = ev.target.closest("button"); if (!b) return; state.profile.theme = b.dataset.v; saveProfile(); applyTheme(); render(); });
onChange("pref", el => { state.profile[el.dataset.k] = el.checked; saveProfile(); });
act("week-repeat", () => { state.profile.weekOffset = (state.profile.weekOffset || 0) + 1; saveProfile(); toast("This week will repeat"); render(); });
act("week-unrepeat", () => { state.profile.weekOffset = Math.max(0, (state.profile.weekOffset || 0) - 1); saveProfile(); render(); });
act("me-pw", async () => { const i = document.getElementById("s-newpw"); if (await changePassword(i.value)) i.value = ""; });
act("me-signout", () => signOut());
act("go-me", () => { state.view = "more"; render(); window.scrollTo(0, 0); });
