// Sign-in / sign-up screen and session handling.
import { APP_NAME, APP_TAGLINE } from "../config.js";
import { $, act, toast, segHtml } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { state, S, DEFAULT_PROFILE, render } from "./state.js";
import { sb, lsLoad, lsSave, flush, pull, setSync, readLocal, markAllDirty, hasPending } from "./store.js";
import { loadEntitlement } from "./premium.js";

let mode = "in";
const brandHtml = () => { const [a, ...b] = APP_NAME.split(" "); return `${esc(a)} <span>${esc(b.join(" "))}</span>`; };

export function showAuth(show) {
  const el = $("auth");
  el.hidden = !show;
  if (!show) return;
  el.innerHTML = `<form class="inner" id="a-form" novalidate>
    <div class="brand">${brandHtml()}</div>
    <p class="tagline">${esc(APP_TAGLINE)}</p>
    <p class="note">Fasting, training and food in one coach. It tells you when to train around your fast, and keeps your data synced across devices.</p>
    ${segHtml("a-mode", [["in", "Sign in"], ["up", "Create account"]], mode, 'data-act="auth-mode" aria-label="Sign in or create account"')}
    <label class="f">Email<input type="email" id="a-email" autocomplete="email" inputmode="email" required></label>
    <label class="f">Password<input type="password" id="a-pass" autocomplete="${mode === "in" ? "current-password" : "new-password"}" minlength="6" required></label>
    <p class="err" id="a-err" hidden></p><p class="ok" id="a-ok" hidden></p>
    <button class="btn primary big" type="submit" id="a-go">${mode === "in" ? "Sign in" : "Create account"}</button>
    <button class="linkbtn" type="button" data-act="auth-forgot">Forgot password?</button>
    <button class="linkbtn" type="button" data-act="auth-local" style="color:var(--muted)">Use without an account (this phone only)</button>
  </form>`;
  $("a-form").addEventListener("submit", submit);
}
function msg(err, ok) {
  $("a-err").hidden = !err; $("a-err").textContent = err || "";
  $("a-ok").hidden = !ok; $("a-ok").textContent = ok || "";
}
act("auth-mode", (el, ev) => {
  const b = ev.target.closest("button"); if (!b) return;
  const em = $("a-email").value;
  mode = b.dataset.v; showAuth(true); $("a-email").value = em;
});
async function submit(ev) {
  ev.preventDefault();
  const em = $("a-email").value.trim(), pw = $("a-pass").value;
  if (!em || pw.length < 6) { msg("Enter your email and a password of at least 6 characters."); return; }
  if (!sb) { msg("Can't reach the sync service. Check your connection, or use the app on this phone only."); return; }
  $("a-go").disabled = true; msg();
  try {
    if (mode === "in") {
      const { error } = await sb.auth.signInWithPassword({ email: em, password: pw });
      if (error) throw error;
    } else {
      const { data, error } = await sb.auth.signUp({ email: em, password: pw, options: { emailRedirectTo: location.origin } });
      if (error) throw error;
      if (!data.session) msg(null, "Check your email and tap the confirmation link, then come back and sign in.");
    }
  } catch (e) {
    const m = (e && e.message) || "";
    msg(/invalid login/i.test(m) ? "That email and password don't match. Try again, or create an account."
      : /not confirmed/i.test(m) ? "Confirm your email first: tap the link we sent you, then sign in."
      : /already registered/i.test(m) ? "That email already has an account. Sign in instead."
      : m || "Something went wrong. Check your connection and try again.");
  }
  if ($("a-go")) $("a-go").disabled = false;
}
act("auth-forgot", async () => {
  const em = $("a-email").value.trim();
  if (!em) { msg("Type your email above first."); return; }
  if (!sb) return;
  try {
    const { error } = await sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin });
    msg(error ? error.message : null, error ? null : "If that email has an account, a reset link is on its way.");
  } catch (e) { msg("Couldn't send the reset link. Check your connection and try again."); }
});
act("auth-local", () => {
  S.localOnly = true; try { localStorage.setItem("runback.localOnly", "1"); } catch (e) { /* ignore */ }
  S.uid = null; lsLoad(); showAuth(false); setSync("local"); render();
});

export async function signOut() {
  if (S.localOnly) { S.localOnly = false; try { localStorage.removeItem("runback.localOnly"); } catch (e) { /* ignore */ } showAuth(true); return; }
  if (hasPending()) await flush();
  if (sb) await sb.auth.signOut();
}
export async function changePassword(pw) {
  if (pw.length < 6) { toast("Use at least 6 characters"); return false; }
  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) { toast(error.message); return false; }
  toast("Password changed"); return true;
}

const listeners = [];
export const onSignedIn = fn => listeners.push(fn);

async function onSession(session) {
  const uid = session ? session.user.id : null;
  if (uid === S.uid && !S.localOnly) return;
  if (!uid) { S.uid = null; S.pro = false; if (!S.localOnly) { lsLoad(); showAuth(true); } return; }
  const hadLocal = !S.uid ? readLocal("runback.v2:local") : null;
  S.localOnly = false; try { localStorage.removeItem("runback.localOnly"); } catch (e) { /* ignore */ }
  S.uid = uid; S.email = session.user.email || "";
  lsLoad();
  // first sign-in after using the app without an account: carry those entries over
  const realLocal = hadLocal && hadLocal.days && (Object.keys(hadLocal.days).length > 0 || (hadLocal.profile && (hadLocal.profile.onboarded || hadLocal.profile.startWeight)));
  if (realLocal && !Object.keys(state.days).length) {
    state.days = hadLocal.days; state.profile = { ...DEFAULT_PROFILE, ...hadLocal.profile };
    markAllDirty(); lsSave();
  }
  showAuth(false); setSync("connecting");
  try { S.pro = localStorage.getItem("runback.pro:" + uid) === "1"; } catch (e) { /* ignore */ }
  listeners.forEach(fn => fn());
  render(); pull();
  loadEntitlement().then(render);
}

export async function connect() {
  try { S.localOnly = localStorage.getItem("runback.localOnly") === "1"; } catch (e) { /* ignore */ }
  if (!sb) { S.localOnly = true; lsLoad(); render(); setSync("local"); return; }
  sb.auth.onAuthStateChange((ev, session) => setTimeout(() => {
    onSession(session);
    if (ev === "PASSWORD_RECOVERY") { state.view = "me"; render(); toast("Set a new password under Account"); }
  }, 0));
  let data = {};
  try { ({ data } = await sb.auth.getSession()); } catch (e) { data = {}; }
  if (data && data.session) onSession(data.session);
  else if (S.localOnly) { lsLoad(); render(); setSync("local"); }
  else { lsLoad(); render(); showAuth(true); }
  window.addEventListener("online", () => { flush(); pull(); });
  window.addEventListener("offline", () => setSync("offline"));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { flush(); pull(); } });
}
