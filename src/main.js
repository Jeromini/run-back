// Entry point: navigation, rendering, the one-second ticker, and start-up.
import "@fontsource-variable/manrope";
import "./styles/app.css";
import { APP_NAME } from "./config.js";
import { $, act, ICON, closeSheet, sheetOpen, typing } from "./lib/dom.js";
import { esc } from "./lib/format.js";
import { today } from "./lib/dates.js";
import { state, S, setRenderer } from "./core/state.js";
import { connect } from "./core/auth.js";
import { renderToday } from "./views/today.js";
import { renderFast, tickFast, checkStagePopup } from "./views/fast.js";
import { renderFood, resetFood } from "./views/food.js";
import { renderTrends } from "./views/trends.js";
import { renderCrew, captureInvite, refreshCrew } from "./views/crew.js";
import { renderMe, applyTheme } from "./views/me.js";
import { renderJourney } from "./views/journey.js";
import { renderMore } from "./views/more.js";
import "./features/quickadd.js";
import { checkBadges } from "./features/badges.js";
import "./features/paywall.js";
import "./features/guides.js";
import "./features/calendar.js";
import { maybeOnboard } from "./features/onboarding.js";
import { onPulled, sb } from "./core/store.js";
import { initErrorReporting } from "./lib/errors.js";

const VIEWS = { today: renderToday, journey: renderJourney, fast: renderFast, food: renderFood, trends: renderTrends, crew: renderCrew, me: renderMe, more: renderMore };
const TAB_ICONS = { today: "run", journey: "flag", fast: "timer", food: "food", trends: "chart" };

// static chrome
(() => {
  const [a, ...b] = APP_NAME.split(" ");
  $("brand").innerHTML = `${esc(a)} <span>${esc(b.join(" "))}</span>`;
  document.querySelectorAll("#tabs button").forEach(btn => { btn.innerHTML = ICON[TAB_ICONS[btn.dataset.v]] + btn.textContent; });
  document.querySelector('[data-act="open-guides"]').innerHTML = ICON.book;
  document.querySelector('[data-act="go-more"]').innerHTML = ICON.user;
  $("fab").innerHTML = ICON.plus;
  $("sh-back").innerHTML = ICON.back;
})();

let lastView = null;
function render() {
  applyTheme();
  const fn = VIEWS[state.view] || renderToday, y = window.scrollY, main = $("main");
  // the entrance animation only plays when switching screens, not on every update
  main.classList.toggle("still", lastView === state.view);
  lastView = state.view;
  fn(main);
  window.scrollTo(0, y);
  // screens reached from More keep the More (profile) button lit instead of a tab
  const sub = { crew: "more", me: "more" }[state.view] || state.view;
  document.querySelectorAll("#tabs button").forEach(b => { const on = b.dataset.v === sub; b.classList.toggle("on", on); b.setAttribute("aria-current", on ? "page" : "false"); });
  const mb = document.querySelector('[data-act="go-more"]'); if (mb) mb.classList.toggle("on", sub === "more");
  const pro = document.querySelector("#brand .pro-tag");
  if (S.pro && !pro) $("brand").insertAdjacentHTML("beforeend", '<span class="pro-tag">Pro</span>');
  if (!S.pro && pro) pro.remove();
  checkBadges();
}
setRenderer(render);
// "System" appearance: follow the phone switching between light and dark while the app is open
try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme); } catch (e) { /* older browsers */ }

act("tab", el => {
  const v = el.dataset.v;
  if (sheetOpen()) closeSheet();
  const same = state.view === v;
  state.view = v;
  if (v === "today") state.sel = today();
  if (v === "food") resetFood();
  if (v === "crew") refreshCrew();
  try { sessionStorage.setItem("runback.view", v); } catch (e) { /* ignore */ }
  render();
  if (!same) window.scrollTo(0, 0);
});
act("sheet-close", closeSheet);
document.addEventListener("keydown", e => { if (e.key === "Escape" && sheetOpen()) closeSheet(); });

// one-second ticker for live clocks (fasting); skips while someone is typing
setInterval(() => { if (!typing()) { tickFast(); checkStagePopup(); } }, 1000);
// a new day while the app is open: move Today along
let lastDay = today();
setInterval(() => { const t = today(); if (t !== lastDay) { if (state.sel === lastDay) state.sel = t; lastDay = t; render(); } }, 60000);

// start-up
try { const v = sessionStorage.getItem("runback.view"); if (VIEWS[v]) state.view = v; } catch (e) { /* ignore */ }
if (captureInvite()) state.view = "crew";
const hashView = location.hash.slice(1);
if (VIEWS[hashView]) state.view = hashView;
initErrorReporting(sb, () => S.uid, () => state.view);
onPulled(maybeOnboard);
connect().then(() => { if (S.localOnly) maybeOnboard(); });

if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
