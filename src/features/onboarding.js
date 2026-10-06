// First run: a one-minute setup that ends on a real plan. Four short steps (your numbers, a
// Journey package, a fasting rhythm, reminders), skippable at any point, never shown twice.
// profile.onboarded = "YYYY-MM-DD" once finished or skipped.
import { $, act, onInput, openSheet, closeSheet, sheetOpen, segHtml, toast, ICON } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { today } from "../lib/dates.js";
import { state, S, render } from "../core/state.js";
import { saveProfile, saveDay } from "../core/store.js";
import { isPro } from "../core/premium.js";
import { TEMPLATES, newJourney } from "../domain/journey.js";
import { ROUTINE_PRESETS } from "../domain/fasting.js";
import { pushSupport, enableReminders } from "./push.js";
import { APP_NAME } from "../config.js";

const STEPS = ["you", "journey", "fast", "remind"];
let f = null, step = -1;

// A brand-new account: nothing logged and no numbers yet.
const isNew = () => { const p = state.profile; return !p.onboarded && !p.startWeight && !Object.keys(state.days).length; };
// An existing account missing the numbers that drive water, calorie and BMI targets.
export const needsSetup = () => { const p = state.profile; return !p.onboarded && !p.setupDismissed && (!p.heightCm || !p.goalWeight || !p.startWeight); };

export function maybeOnboard() { if (isNew() && !document.getElementById("onb")) startOnboarding(-1); }

export function startOnboarding(from = -1) {
  const p = state.profile;
  f = { name: p.displayName || "", unit: p.unit || "lb", age: p.age || "", ft: "", inch: "", cm: p.heightCm ? Math.round(p.heightCm) : "", weight: p.startWeight || "", goal: p.goalWeight || "",
    journey: (p.journey && p.journey.on && p.journey.template) || "comeback", fast: p.routine && p.routine.on ? "keep" : p.fastPlan || "16:8" };
  if (p.heightCm) { const inches = Math.round(p.heightCm / 2.54); f.ft = Math.floor(inches / 12); f.inch = inches % 12; }
  step = from; draw();
}

function draw() {
  const html = `<div id="onb" class="onb">${step < 0 ? welcome() : `
    <div class="onb-top"><div class="onb-prog" role="progressbar" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${step + 1}" aria-label="Step ${step + 1} of ${STEPS.length}">${STEPS.map((_, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>
      <button class="linkbtn" data-act="onb-skip">Skip setup</button></div>
    ${[you, journey, fast, remind][step]()}`}</div>`;
  if (sheetOpen() && $("onb")) { $("sh-body").innerHTML = html; $("sheet").scrollTop = 0; return; }
  openSheet({ title: "Welcome", html, cls: "onb-sheet", onClose: () => { if (!state.profile.onboarded) finish(true); } });
}

function welcome() {
  return `<div class="onb-hero"><span class="onb-mark">${ICON.flag}</span>
    <h1>Fasting, training and food, coached as one plan</h1>
    <p>${esc(APP_NAME)} times your training around your fast, tracks what you eat and drink, and keeps it all in one journey you can follow day by day.</p></div>
    <ul class="onb-points">
      <li>${ICON.timer}<span><b>Fast with a plan</b>From 14:10 to multi-day fasts, with every stage explained.</span></li>
      <li>${ICON.run}<span><b>Train at the right moment</b>The coach tells you when to train, or to eat first.</span></li>
      <li>${ICON.food}<span><b>Log in seconds</b>Pick a food and a portion; the calories are worked out.</span></li></ul>
    <button class="btn primary big" data-act="onb-next">Set up my plan</button>
    <p class="note onb-time">About a minute. You can change everything later.</p>
    <button class="linkbtn onb-later" data-act="onb-skip">I'll explore on my own</button>`;
}

function you() {
  return `<h2 class="onb-h">Your numbers</h2>
    <p class="note">They set your daily water target, calorie suggestion and weight trend.</p>
    <label class="f">First name<input data-in="onb" data-k="name" value="${esc(f.name)}" autocomplete="given-name" placeholder="Shown to your crew"></label>
    <label class="f">Units${segHtml("onb-unit", [["lb", "lb, ft"], ["kg", "kg, cm"]], f.unit, 'data-act="onb-unit" aria-label="Units"')}</label>
    <div class="row">${f.unit === "kg"
      ? `<label class="f">Height (cm)<input type="number" inputmode="numeric" data-in="onb" data-k="cm" value="${esc(f.cm)}"></label>`
      : `<label class="f">Height (ft)<input type="number" inputmode="numeric" data-in="onb" data-k="ft" value="${esc(f.ft)}"></label><label class="f">(in)<input type="number" inputmode="numeric" data-in="onb" data-k="inch" value="${esc(f.inch)}"></label>`}
      <label class="f">Age<input type="number" inputmode="numeric" data-in="onb" data-k="age" value="${esc(f.age)}"></label></div>
    <div class="row"><label class="f">Weight today (${f.unit})<input type="number" inputmode="decimal" step="0.1" data-in="onb" data-k="weight" value="${esc(f.weight)}"></label>
      <label class="f">Goal weight (${f.unit})<input type="number" inputmode="decimal" step="0.1" data-in="onb" data-k="goal" value="${esc(f.goal)}"></label></div>
    ${nav("Continue")}`;
}

function journey() {
  return `<h2 class="onb-h">Pick your journey</h2>
    <p class="note">One plan that ties training, fasting, water and food together, with a daily score and a diary.</p>
    <div class="onb-choices" role="radiogroup">${TEMPLATES.map(t => choice("onb-journey", t.id, f.journey === t.id, t.name, `${t.weeks} weeks. ${t.blurb}`)).join("")}
      ${choice("onb-journey", "none", f.journey === "none", "Decide later", "Start with Today and add a journey any time.")}</div>
    ${nav("Continue")}`;
}

function fast() {
  const pro = isPro(), mwf = ROUTINE_PRESETS.find(r => r.id === "mwf-24");
  return `<h2 class="onb-h">Your fasting rhythm</h2>
    <p class="note">Start gentle. Consistency beats intensity, and you can change this any time on the Fast tab.</p>
    <div class="onb-choices" role="radiogroup">
      ${f.fast === "keep" ? choice("onb-fast", "keep", true, "Keep my routine", "Your current fasting routine stays as it is.") : ""}
      ${choice("onb-fast", "14:10", f.fast === "14:10", "14:10 every day", "A gentle start: 14 hours fasting, 10 eating.")}
      ${choice("onb-fast", "16:8", f.fast === "16:8", "16:8 every day", "The classic. For example 8 pm to 12 pm.")}
      ${choice("onb-fast", "18:6", f.fast === "18:6", "18:6 every day", "Stronger appetite control once 16:8 feels easy.")}
      ${choice("onb-fast", "mwf-24", f.fast === "mwf-24", mwf.name, mwf.blurb, !pro)}
      ${choice("onb-fast", "none", f.fast === "none", "Not now", "Track training and food first.")}</div>
    <p class="note">Fasting isn't suitable if you're pregnant, have a history of eating disorders, or have diabetes or take medication without your doctor's advice.</p>
    ${nav("Continue")}`;
}

function remind() {
  const sup = pushSupport();
  return `<h2 class="onb-h">Reminders</h2>
    <p class="note">A nudge 30 minutes before each fast, when it's time to start, and as you reach each fasting stage. Nothing else.</p>
    ${sup.ok ? `<button class="btn primary big" data-act="onb-remind">${ICON.timer} Turn on reminders</button>` : `<div class="callout">${esc(sup.why)}</div>`}
    <button class="btn big" data-act="onb-done">${sup.ok ? "Not now, finish" : "Finish"}</button>`;
}

const choice = (actName, v, on, title, sub, locked = false) => `<button class="onb-choice${on ? " on" : ""}" role="radio" aria-checked="${on}" data-act="${actName}" data-v="${v}"${locked ? ' data-pro="1"' : ""}>
  <span><b>${esc(title)}${locked ? ` <i class="lock" aria-label="Premium">${ICON.lock}</i>` : ""}</b><small>${esc(sub)}</small></span><i class="tick" aria-hidden="true">${ICON.tick}</i></button>`;
const nav = label => `<div class="onb-nav"><button class="btn" data-act="onb-back">${ICON.back} Back</button><button class="btn primary" data-act="onb-next">${label}</button></div>`;

// Save whatever the person entered so far; blanks never overwrite existing values.
function apply() {
  const p = state.profile, num = v => (v === "" || v == null ? null : Number(v));
  if (f.name.trim()) p.displayName = f.name.trim();
  p.unit = f.unit; p.dunit = f.unit === "kg" ? "km" : "mi";
  if (num(f.age)) p.age = num(f.age);
  const cm = f.unit === "kg" ? num(f.cm) : (num(f.ft) || num(f.inch)) ? ((num(f.ft) || 0) * 12 + (num(f.inch) || 0)) * 2.54 : null;
  if (cm) p.heightCm = cm;
  if (num(f.goal)) p.goalWeight = num(f.goal);
  if (num(f.weight)) {
    if (!p.startWeight) p.startWeight = num(f.weight);
    const t = today(), d = state.days[t] || (state.days[t] = { date: t });
    if (!d.weight) { d.weight = num(f.weight); saveDay(t); }
  }
}

function finish(skipped) {
  const p = state.profile;
  if (!skipped) {
    apply();
    if (f.journey !== "none" && !(p.journey && p.journey.on && p.journey.template === f.journey)) p.journey = newJourney(f.journey, today(), { goalWeight: p.goalWeight || null });
    if (f.fast === "mwf-24") {
      const r = ROUTINE_PRESETS.find(x => x.id === "mwf-24");
      p.routine = { on: true, pattern: r.pattern, days: r.days, hours: r.hours, start: r.start, startMode: r.startMode, anchor: today(), since: today(), skip: [], times: {} };
      p.tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } else if (f.fast !== "none" && f.fast !== "keep") { p.fastPlan = f.fast; if (p.routine && p.routine.on) p.routine = { ...p.routine, on: false }; }
  }
  p.onboarded = today();
  saveProfile();
}

act("onb-next", () => {
  if (step >= 0 && STEPS[step] === "you" && !f.weight) { toast("Add your weight today, or skip setup"); return; }
  step = Math.min(STEPS.length - 1, step + 1); draw();
});
act("onb-back", () => { step = Math.max(-1, step - 1); draw(); });
act("onb-skip", () => { finish(true); closeSheet(); toast("Setup skipped. Finish it any time from Profile."); render(); });
act("onb-unit", (el, ev) => { const b = ev.target.closest("button"); if (b) { f.unit = b.dataset.v; draw(); } });
onInput("onb", el => { f[el.dataset.k] = el.value; });
act("onb-journey", el => { f.journey = el.dataset.v; draw(); });
act("onb-fast", el => { if (el.dataset.pro && !isPro()) { toast("That routine is part of Premium. Unlock it any time on the Fast tab."); return; } f.fast = el.dataset.v; draw(); });
act("onb-remind", async el => {
  el.disabled = true;
  try { await enableReminders(); toast("Reminders are on"); doneFlow(); }
  catch (e) { el.disabled = false; toast(e.message || "Couldn't turn on reminders"); }
});
act("onb-done", () => doneFlow());
function doneFlow() {
  finish(false); closeSheet();
  const p = state.profile;
  state.view = p.journey && p.journey.on ? "journey" : "today"; state.sel = today();
  toast(p.journey && p.journey.on ? `${p.journey.name} starts today` : "You're set", "badge-t");
  render(); window.scrollTo(0, 0);
}
act("onb-open", () => startOnboarding(0));
act("onb-later", () => { state.profile.setupDismissed = true; saveProfile(); render(); });

// Today card for existing accounts that never added their numbers.
export function setupCard() {
  if (!needsSetup() || S.workoutLive) return "";
  const p = state.profile, missing = [!p.startWeight && "weight", !p.heightCm && "height", !p.goalWeight && "goal weight"].filter(Boolean);
  return `<div class="urow-wrap"><button class="urow" data-act="onb-open"><i class="ui">${ICON.edit}</i><span class="ut"><b>Finish your setup</b><small>Add your ${missing.join(", ").replace(/, ([^,]*)$/, " and $1")}</small></span><em class="chev" aria-hidden="true">${ICON.next}</em></button><button class="urow-x" data-act="onb-later" aria-label="Hide for now">${ICON.close}</button></div>`;
}
