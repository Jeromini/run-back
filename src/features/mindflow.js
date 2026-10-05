// Mind flows: the guided Unload (feel, release, sort one by one, pick three), Focus (one priority at a
// time with a timer), and the toolkit (breathing, grounding, thought check, body relax, worry time,
// three good things, calm walk). Everything saves to day.mind (see src/domain/mind.js).
import { $, act, onInput, openSheet, closeSheet, segHtml, toast, ICON } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { today, nice } from "../lib/dates.js";
import { state, day, render } from "../core/state.js";
import { saveDay } from "../core/store.js";
import { buzz } from "../lib/sound.js";
import { LEVELS, SIGNALS, CAUSES, WHEN, TOP_MAX, BREATHS, RELAX, THOUGHT_STEPS, quadrantOf, suggestTop, focusQueue, parkedWorries, unloadSummary } from "../domain/mind.js";
import { openWorkout } from "./workout.js";

const uid = () => Math.random().toString(36).slice(2, 9);
const M = (date = today()) => { const d = day(date); if (!d.mind) d.mind = {}; return d.mind; };
const mindOf = (date = today()) => (state.days[date] || {}).mind || {};
const commit = () => { saveDay(today()); render(); };
export function logTool(id) { const m = M(); m.tools = [...(m.tools || []), { id, at: Date.now() }]; saveDay(today()); }
let timers = [];
const stopTimers = () => { timers.forEach(clearInterval); timers = []; };
// paint into the open sheet, or open it
function sheet(title, html, onClose) {
  if ($("mflow") && $("mflow").dataset.t === title) { $("sh-body").innerHTML = `<div id="mflow" class="uflow" data-t="${esc(title)}">${html}</div>`; $("sheet").scrollTop = 0; return; }
  openSheet({ title, html: `<div id="mflow" class="uflow" data-t="${esc(title)}">${html}</div>`, onClose: () => { stopTimers(); if (onClose) onClose(); render(); } });
}
const prog = (i, n) => `<div class="onb-prog" style="grid-template-columns:repeat(${n},1fr)" role="progressbar" aria-valuenow="${i + 1}" aria-valuemax="${n}" aria-label="Step ${i + 1} of ${n}">${Array.from({ length: n }, (_, k) => `<i class="${k <= i ? "on" : ""}"></i>`).join("")}</div>`;

// =============== Unload ===============
let u = null;
const STEPS = ["feel", "release", "sort", "three", "done"];
export function openUnload(fromRelease = false) {
  const m = mindOf();
  u = { step: fromRelease && m.am ? 1 : 0, level: m.am ? m.am.level : null, signals: m.am ? [...(m.am.signals || [])] : [], causes: m.am ? [...(m.am.causes || [])] : [], note: m.am ? m.am.note || "" : "",
    items: [], i: 0, draft: "", cur: null };
  drawUnload();
}
function drawUnload() {
  const s = STEPS[u.step], N = 4;
  let h = s === "done" ? "" : prog(Math.min(u.step, 3), N);
  if (s === "feel") h += `<h1 class="big-title">How are you feeling?</h1>
    <p class="note">No right answer. Noticing it is the first step.</p>
    <span class="eyebrow">Stress right now</span>${segHtml("u-level", LEVELS.map((l, i) => [i + 1, l]), u.level || "", 'data-act="u-level" aria-label="Stress level"')}
    <span class="eyebrow">What's your body telling you?</span><div class="chips">${SIGNALS.map(([id, l]) => chip("u-signal", id, l, u.signals.includes(id))).join("")}</div>
    <span class="eyebrow">What's behind it?</span><div class="chips">${CAUSES.map(([id, l]) => chip("u-cause", id, l, u.causes.includes(id))).join("")}</div>
    <label class="f">Anything else? (just for you)<textarea data-in="u-note" rows="2" maxlength="600" placeholder="Big meeting at 10, slept badly">${esc(u.note)}</textarea></label>
    <button class="btn primary big" data-act="u-next"${u.level ? "" : " disabled"}>Next: empty your head</button>`;
  else if (s === "release") h += `<h1 class="big-title">What's on your mind?</h1>
    <p class="note">Write down everything taking up space: tasks, worries, things you keep remembering. One at a time, big or small. You'll sort them next.</p>
    <div class="tadd"><input id="u-new" data-in="u-new" value="${esc(u.draft)}" placeholder="e.g. Reply to the bank" maxlength="140" enterkeyhint="done" autocomplete="off"><button class="btn primary" data-act="u-add">Add</button></div>
    ${u.items.length ? `<div class="ulist">${u.items.map((x, k) => `<div class="uitem"><span>${esc(x.text)}</span><button class="x" data-act="u-remove" data-k="${k}" aria-label="Remove ${esc(x.text)}">&times;</button></div>`).join("")}</div>
      <p class="note">${u.items.length} out of your head. Anything else? Keep going until nothing is left.</p>` : ""}
    <button class="btn primary big" data-act="u-next"${u.items.length ? "" : " disabled"}>That's everything: sort them</button>
    ${u.items.length ? "" : `<button class="linkbtn" style="text-align:center" data-act="u-skip">Nothing to write down? Take a minute to breathe instead</button>`}`;
  else if (s === "sort") {
    const x = u.items[u.i], c = u.cur || (u.cur = { act: null, imp: false, urg: false, step: "", when: "today", outcome: null, reframe: "" });
    h += `<p class="note">Item ${u.i + 1} of ${u.items.length}</p><div class="uitemcard">${esc(x.text)}</div>
      <span class="eyebrow">Can you do something about this?</span>
      <div class="ubin"><button class="ubtn${c.act === true ? " on" : ""}" data-act="u-can" data-v="1"><b>Yes</b><small>There's an action I can take</small></button><button class="ubtn${c.act === false ? " on" : ""}" data-act="u-can" data-v="0"><b>No, not really</b><small>It's a worry, or out of my hands</small></button></div>`;
    if (c.act === true) h += `<span class="eyebrow">How does it rank?</span>
      <div class="row"><button class="tag big${c.imp ? " on" : ""}" data-act="u-imp" aria-pressed="${c.imp}">Important</button><button class="tag big${c.urg ? " on" : ""}" data-act="u-urg" aria-pressed="${c.urg}">Urgent</button></div>
      <p class="note">${esc(quadrantOf(c).name)}: ${esc(quadrantOf(c).why)}</p>
      <label class="f">What's the very next small step?<input data-in="u-step" value="${esc(c.step)}" maxlength="140" placeholder="e.g. Open the email and write two lines"></label>
      <span class="eyebrow">When?</span>${segHtml("u-when", WHEN, c.when, 'data-act="u-when" aria-label="When"')}`;
    if (c.act === false) h += `<span class="eyebrow">What would help?</span>
      <div class="ubin"><button class="ubtn${c.outcome === "let" ? " on" : ""}" data-act="u-out" data-v="let"><b>Let it go</b><small>Notice it, put it down</small></button><button class="ubtn${c.outcome === "park" ? " on" : ""}" data-act="u-out" data-v="park"><b>Park it</b><small>Save it for worry time later</small></button></div>
      ${c.outcome === "let" ? `<label class="f">What would you say to a friend who had this worry? (optional)<textarea data-in="u-reframe" rows="2" maxlength="300" placeholder="You've handled harder things. You can't control this today.">${esc(c.reframe)}</textarea></label>` : ""}
      ${c.outcome === "park" ? `<p class="note">You'll find it in Worry time on the Mind screen. Giving worries a set time makes it easier to stop chewing on them the rest of the day.</p>` : ""}`;
    const ready = c.act === true || (c.act === false && c.outcome);
    h += `<button class="btn primary big" data-act="u-item"${ready ? "" : " disabled"}>${u.i < u.items.length - 1 ? "Next item" : "Done sorting"}</button>`;
  } else if (s === "three") {
    const acts = u.items.filter(x => x.kind === "task"), todayOnes = acts.filter(x => x.when === "today");
    h += `<h1 class="big-title">Pick today's three</h1>
      <p class="note">Three things that would make today a good day. A short list you finish beats a long one you don't.</p>
      ${acts.length ? `<div class="tlist">${[...todayOnes, ...acts.filter(x => x.when !== "today")].map(x => `<div class="trow"><span class="tcheck dim"></span><span class="ttext">${esc(x.text)}<small>${esc(quadrantOf(x).name)}${x.when !== "today" ? " &middot; " + esc(WHEN.find(w => w[0] === x.when)[1]) : ""}${x.step ? " &middot; next: " + esc(x.step) : ""}</small></span><button class="tstar${x.top ? " on" : ""}" data-act="u-top" data-id="${x.id}" aria-pressed="${!!x.top}" aria-label="Star ${esc(x.text)}">${ICON.star}</button></div>`).join("")}</div>
        <button class="linkbtn" data-act="u-suggest">Suggest three for me</button>` : `<p class="note">Nothing on your list needs action today. That's a good place to be.</p>`}
      <button class="btn primary big" data-act="u-finish">Save and finish</button>`;
  } else {
    const sm = unloadSummary(mindOf());
    h += `<div class="udone"><span class="onb-mark">${ICON.tick}</span><h1 class="big-title">Your head is clearer</h1>
      <p class="dlead">${sm.total} thing${sm.total === 1 ? "" : "s"} out of your head: ${[sm.today && sm.today + " for today", sm.later && sm.later + " scheduled", sm.letGo && sm.letGo + " let go", sm.parked && sm.parked + " parked"].filter(Boolean).join(", ") || "all sorted"}.</p></div>
      ${sm.top ? `<button class="btn primary big" data-act="focus-open">Start on the first one</button>` : ""}
      <button class="btn big" data-act="tool-open" data-id="breathe">Breathe for a minute first</button>
      <button class="linkbtn" style="text-align:center" data-act="sheet-close">Done for now</button>`;
  }
  sheet("Unload", `<div class="uflow">${h}</div>`);
  if (s === "release") setTimeout(() => { const i = $("u-new"); if (i) i.focus(); }, 40);
}
const chip = (a, id, l, on) => `<button class="chip${on ? " on" : ""}" data-act="${a}" data-id="${id}" aria-pressed="${on}">${esc(l)}</button>`;
const toggle = (arr, id) => (arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
act("u-level", (el, ev) => { const b = ev.target.closest("button"); if (b) { u.level = Number(b.dataset.v); drawUnload(); } });
act("u-signal", el => { u.signals = toggle(u.signals, el.dataset.id); drawUnload(); });
act("u-cause", el => { u.causes = toggle(u.causes, el.dataset.id); drawUnload(); });
onInput("u-note", el => { u.note = el.value; });
onInput("u-new", el => { u.draft = el.value; });
function uAdd() { const t = ($("u-new") || {}).value || u.draft; if (!t.trim()) return; u.items.push({ id: uid(), text: t.trim() }); u.draft = ""; drawUnload(); }
act("u-add", uAdd);
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.id === "u-new") { e.preventDefault(); uAdd(); } });
act("u-remove", el => { u.items.splice(Number(el.dataset.k), 1); drawUnload(); });
act("u-next", () => {
  if (u.step === 0) { const m = M(); m.am = { level: u.level, signals: u.signals, causes: u.causes, note: u.note.trim() }; saveDay(today()); }
  u.step++; u.i = 0; u.cur = null; drawUnload();
});
act("u-skip", () => { closeSheet(); openTool("breathe"); });
act("u-can", el => { u.cur.act = el.dataset.v === "1"; drawUnload(); });
act("u-imp", () => { u.cur.imp = !u.cur.imp; drawUnload(); });
act("u-urg", () => { u.cur.urg = !u.cur.urg; drawUnload(); });
onInput("u-step", el => { u.cur.step = el.value; });
act("u-when", (el, ev) => { const b = ev.target.closest("button"); if (b) { u.cur.when = b.dataset.v; drawUnload(); } });
act("u-out", el => { u.cur.outcome = el.dataset.v; drawUnload(); });
onInput("u-reframe", el => { u.cur.reframe = el.value; });
act("u-item", () => {
  const x = u.items[u.i], c = u.cur;
  Object.assign(x, c.act ? { kind: "task", imp: c.imp, urg: c.urg, step: c.step.trim(), when: c.when, top: false, done: false } : { kind: "worry", outcome: c.outcome, reframe: c.reframe.trim() });
  u.cur = null;
  if (u.i < u.items.length - 1) { u.i++; drawUnload(); } else { u.step++; drawUnload(); }
});
act("u-top", el => { const x = u.items.find(i => i.id === el.dataset.id); if (!x.top && u.items.filter(i => i.top).length >= TOP_MAX) { toast("Three is the limit"); return; } x.top = !x.top; drawUnload(); });
act("u-suggest", () => { const ids = suggestTop(u.items.filter(x => x.kind === "task")); u.items.forEach(x => (x.top = ids.includes(x.id))); drawUnload(); });
act("u-finish", () => {
  const m = M(), have = new Set((m.tasks || []).map(t => t.text.toLowerCase()));
  // stars from this unload replace any older ones, so today's three stay three
  if (u.items.some(x => x.top)) (m.tasks || []).forEach(t => (t.top = false));
  m.tasks = [...(m.tasks || []), ...u.items.filter(x => x.kind === "task" && !have.has(x.text.toLowerCase())).map(({ kind, ...t }) => t)];
  m.worries = [...(m.worries || []), ...u.items.filter(x => x.kind === "worry").map(({ id, text, outcome, reframe }) => ({ id, text, outcome, reframe }))];
  saveDay(today()); u.step = 4; drawUnload(); buzz(30);
});

// =============== Focus: one priority at a time ===============
let fIdx = 0, fLeft = 0, fRun = false, fMins = 25;
export function openFocus() { fIdx = 0; fLeft = 0; fRun = false; stopTimers(); drawFocus(); }
function drawFocus() {
  const q = focusQueue(mindOf().tasks), all = (mindOf().tasks || []).filter(t => t.top);
  let h;
  if (!all.length) h = `<h1 class="big-title">Nothing to focus on yet</h1><p class="note">Unload your mind and star up to three priorities first.</p><button class="btn primary big" data-act="unload-open">Unload my mind</button>`;
  else if (!q.length) h = `<div class="udone"><span class="onb-mark">${ICON.tick}</span><h1 class="big-title">All three done</h1><p class="dlead">That's a good day's work. Take a moment to notice how that feels.</p></div><button class="btn big" data-act="sheet-close">Close</button>`;
  else {
    const t = q[Math.min(fIdx, q.length - 1)], doneN = all.length - q.length;
    h = `${prog(doneN, all.length)}<p class="note">Priority ${doneN + 1} of ${all.length}</p>
      <h1 class="big-title ftask">${esc(t.text)}</h1>
      ${t.step ? `<div class="fstep"><span class="eyebrow">Next small step</span><b>${esc(t.step)}</b></div>` : `<p class="note">Start with the smallest possible piece: two minutes of it counts.</p>`}
      <div class="ftimer"><b id="f-clock">${fRun || fLeft ? fmt(fLeft) : fMins + ":00"}</b>
        ${fRun ? `<button class="btn" data-act="f-pause">Pause</button>` : `${segHtml("f-mins", [[10, "10 min"], [25, "25 min"], [45, "45 min"]], fMins, 'data-act="f-mins" aria-label="Focus length"')}<button class="btn primary big" data-act="f-start">${fLeft ? "Resume" : "Start focus timer"}</button>`}</div>
      <div class="row"><button class="btn" style="flex:1" data-act="f-skip"${q.length > 1 ? "" : " disabled"}>Not now</button><button class="btn primary" style="flex:1" data-act="f-done">${ICON.tick} Done</button></div>
      <p class="note">One thing at a time. Phone face down, one tab open. If your mind wanders, that's normal: come back to the step.</p>`;
  }
  sheet("Focus", h);
}
const fmt = s => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
act("focus-open", () => { if ($("mflow")) closeSheet(); openFocus(); });
act("f-mins", (el, ev) => { const b = ev.target.closest("button"); if (b) { fMins = Number(b.dataset.v); fLeft = 0; drawFocus(); } });
act("f-start", () => {
  if (!fLeft) fLeft = fMins * 60; fRun = true; stopTimers(); drawFocus();
  timers.push(setInterval(() => { fLeft--; const c = $("f-clock"); if (c) c.textContent = fmt(Math.max(0, fLeft)); if (fLeft <= 0) { stopTimers(); fRun = false; buzz([80, 60, 80]); toast("Time's up. Done, or another round?"); drawFocus(); } }, 1000));
});
act("f-pause", () => { fRun = false; stopTimers(); drawFocus(); });
act("f-skip", () => { const q = focusQueue(mindOf().tasks); fIdx = (fIdx + 1) % Math.max(1, q.length); fLeft = 0; fRun = false; stopTimers(); drawFocus(); });
act("f-done", () => {
  const q = focusQueue(mindOf().tasks), t = q[Math.min(fIdx, q.length - 1)];
  const x = (M().tasks || []).find(k => k.id === t.id); x.done = true; saveDay(today()); buzz(40);
  fIdx = 0; fLeft = 0; fRun = false; stopTimers(); toast("Done. One less thing."); drawFocus();
});

// =============== Toolkit ===============
let tState = {};
export function openTool(id) {
  stopTimers(); tState = { id, step: 0 };
  if (id === "walk") { logTool("walk"); openWorkout({ kind: "cross", title: "10 min calm walk", how: "Easy pace. Leave the phone in your pocket and notice what's around you.", blocks: [["w", 600, "Easy walk"]] }, today(), { type: "walk-out", free: true }); return; }
  drawTool();
}
act("tool-open", el => { if ($("mflow")) closeSheet(); openTool(el.dataset.id); });
function drawTool() {
  const s = tState;
  if (s.id === "breathe") return drawBreathe();
  if (s.id === "ground") {
    const G = [["5", "things you can see", "Look around slowly and name them in your head: a cup, a window, your hand."], ["4", "things you can feel", "Your feet on the floor, the chair, your clothes, the air on your skin."],
      ["3", "things you can hear", "Near and far: traffic, a fan, your own breathing."], ["2", "things you can smell", "Or two smells you like, if nothing is around."], ["1", "thing you can taste", "Or take one slow sip of water."]];
    const [n, what, how] = G[s.step];
    return sheet("Grounding", `${prog(s.step, 5)}<div class="gstep"><b>${n}</b><span>${what}</span></div><p class="dlead">${how}</p>
      <button class="btn primary big" data-act="t-next">${s.step < 4 ? "Next" : "Done"}</button>`);
  }
  if (s.id === "relax") {
    const [g, how] = RELAX[s.step];
    return sheet("Body relax", `${prog(s.step, RELAX.length)}<h1 class="big-title">${esc(g)}</h1><p class="dlead">${esc(how)}</p>
      <p class="note">Tense for about 5 seconds, release for 10. Never to the point of pain.</p><button class="btn primary big" data-act="t-next">${s.step < RELAX.length - 1 ? "Next" : "Done"}</button>`);
  }
  if (s.id === "thought") {
    if (s.step === 0 && s.before == null) return sheet("Thought check", `<h1 class="big-title">Thought check</h1><p class="dlead">When a thought keeps stinging, test it like a detective: facts for, facts against, then a fairer version.</p>
      <span class="eyebrow">How upsetting is it right now?</span>${segHtml("t-before", LEVELS.map((l, i) => [i + 1, l]), "", 'data-act="t-before" aria-label="How upsetting"')}`);
    if (s.step < THOUGHT_STEPS.length) {
      const [k, q, hint, ph] = THOUGHT_STEPS[s.step];
      return sheet("Thought check", `${prog(s.step, THOUGHT_STEPS.length + 1)}<h1 class="big-title">${esc(q)}</h1><p class="note">${esc(hint)}</p>
        <textarea data-in="t-text" data-k="${k}" rows="4" maxlength="600" placeholder="${esc(ph)}">${esc(s[k] || "")}</textarea>
        <button class="btn primary big" data-act="t-next">Next</button>`);
    }
    return sheet("Thought check", `${prog(THOUGHT_STEPS.length, THOUGHT_STEPS.length + 1)}<h1 class="big-title">Read it back</h1>
      <div class="tcheckback"><span class="eyebrow">The thought</span><p>${esc(s.thought || "")}</p><span class="eyebrow">A fairer way to see it</span><p><b>${esc(s.balanced || "")}</b></p></div>
      <span class="eyebrow">How upsetting is it now?</span>${segHtml("t-after", LEVELS.map((l, i) => [i + 1, l]), s.after || "", 'data-act="t-after" aria-label="How upsetting now"')}
      <button class="btn primary big" data-act="t-save"${s.after ? "" : " disabled"}>Save</button>`);
  }
  if (s.id === "worry") {
    const list = parkedWorries(state.days, today());
    return sheet("Worry time", `<h1 class="big-title">Worry time</h1><p class="dlead">Fifteen minutes to look at what you parked. For each one: can you act on it now? If not, let it go until tomorrow's slot.</p>
      ${s.started ? `<div class="ftimer"><b id="w-clock">${fmt(s.left)}</b></div>` : `<button class="btn big" data-act="w-start">Start 15-minute timer</button>`}
      ${list.length ? `<div class="tlist">${list.map(w => `<div class="trow wrow"><span class="ttext">${esc(w.text)}<small>Parked ${esc(nice(w.date))}</small></span>
        <div class="ttags"><button class="tag" data-act="w-act" data-id="${w.id}" data-d="${w.date}">I can act: add to today</button><button class="tag" data-act="w-let" data-id="${w.id}" data-d="${w.date}">Let it go</button></div></div>`).join("")}</div>`
        : `<p class="note">Nothing parked. Worries you park during an Unload wait here.</p>`}
      <button class="btn primary big" data-act="w-close">Finish worry time</button>`);
  }
  if (s.id === "good") {
    const g = mindOf().good || ["", "", ""];
    return sheet("Three good things", `<h1 class="big-title">Three good things</h1><p class="dlead">What went well today, however small, and why? Ending the day here helps your mind notice the good, not just the threats.</p>
      ${[0, 1, 2].map(i => `<label class="f">${i + 1}.<input data-in="g-thing" data-i="${i}" value="${esc(g[i] || "")}" maxlength="140" placeholder="${["Finished my run in the heat", "Good chat with an old friend", "Said no to the extra meeting"][i]}"></label>`).join("")}
      <button class="btn primary big" data-act="g-save">Save</button>`);
  }
}
act("t-next", () => {
  const s = tState;
  const max = s.id === "ground" ? 5 : s.id === "relax" ? RELAX.length : THOUGHT_STEPS.length + 1;
  if (s.step >= max - 1 && s.id !== "thought") { logTool(s.id); closeSheet(); toast(s.id === "ground" ? "Grounded. Take that calm with you." : "Nicely done. Notice how your body feels now."); return; }
  s.step++; drawTool();
});
act("t-before", (el, ev) => { const b = ev.target.closest("button"); if (b) { tState.before = Number(b.dataset.v); drawTool(); } });
act("t-after", (el, ev) => { const b = ev.target.closest("button"); if (b) { tState.after = Number(b.dataset.v); drawTool(); } });
onInput("t-text", el => { tState[el.dataset.k] = el.value; });
act("t-save", () => {
  const s = tState, m = M();
  m.thoughts = [...(m.thoughts || []), { situation: s.situation || "", thought: s.thought || "", before: s.before, for: s.for || "", against: s.against || "", balanced: s.balanced || "", after: s.after, at: Date.now() }];
  logTool("thought"); closeSheet();
  toast(s.after < s.before ? `From ${LEVELS[s.before - 1]} to ${LEVELS[s.after - 1]}. That's the thought losing its grip.` : "Saved. Some thoughts need a few goes; that's normal.");
});
act("w-start", () => {
  tState.started = true; tState.left = 900; drawTool();
  timers.push(setInterval(() => { tState.left--; const c = $("w-clock"); if (c) c.textContent = fmt(Math.max(0, tState.left)); if (tState.left <= 0) { stopTimers(); buzz([80, 60, 80]); toast("Worry time is over. Anything left can wait for tomorrow's."); } }, 1000));
});
function reviewWorry(date, id, fn) { const m = M(date), w = (m.worries || []).find(x => x.id === id); if (w) { w.reviewed = true; fn && fn(w); saveDay(date); } }
act("w-act", el => { reviewWorry(el.dataset.d, el.dataset.id, w => { const m = M(); m.tasks = [...(m.tasks || []), { id: uid(), text: w.text, imp: true, urg: false, step: "", when: "today", top: false, done: false }]; saveDay(today()); }); toast("Added to today's list"); drawTool(); });
act("w-let", el => { reviewWorry(el.dataset.d, el.dataset.id); drawTool(); });
act("w-close", () => { logTool("worry"); closeSheet(); toast("Worry time done. You can put it down now."); });
let goodDraft = null;
onInput("g-thing", el => { goodDraft = goodDraft || [...(mindOf().good || ["", "", ""])]; goodDraft[Number(el.dataset.i)] = el.value; });
act("g-save", () => { const m = M(); m.good = (goodDraft || m.good || []).map(x => (x || "").trim()); goodDraft = null; logTool("good"); closeSheet(); toast("Saved. Sleep on the good stuff."); });

// breathing: pick a pattern, then a paced shape that grows on the in-breath and shrinks on the out-breath
function drawBreathe() {
  const s = tState;
  if (!s.pattern) return sheet("Breathe", `<h1 class="big-title">Breathe</h1><p class="note">Pick a pattern. Breathe in through your nose, out through your mouth.</p>
    <div class="tools">${BREATHS.map(b => `<button class="tool" data-act="b-pick" data-id="${b.id}"><i>${ICON.water}</i><span><b>${esc(b.name)}</b><small>${esc(b.sub)}</small></span><em class="chev">${ICON.next}</em></button>`).join("")}</div>`);
  const b = BREATHS.find(x => x.id === s.pattern);
  sheet("Breathe", `<h1 class="big-title">${esc(b.name)}</h1><p class="note">${esc(b.sub)}</p>
    <div class="breath"><div class="bsq" id="bsq"></div><div class="btxt"><b id="bstep">Get ready</b><span id="bcount"></span></div></div>
    <p class="note" style="text-align:center"><span id="bleft"></span></p>
    <button class="btn big" data-act="b-done">Finish</button>`);
  const seq = []; b.steps.forEach(([l, n]) => { for (let k = n; k > 0; k--) seq.push([l, k, n]); });
  let n = 0; const total = b.secs;
  const paint = () => {
    const [l, k, len] = seq[n % seq.length], st = $("bstep"); if (!st) { stopTimers(); return; }
    st.textContent = l; $("bcount").textContent = k;
    const grow = /in|Top/.test(l), hold = /Hold/.test(l), sq = $("bsq");
    if (k === len) { sq.style.transitionDuration = len + "s"; sq.className = "bsq " + (grow ? "big" : hold ? sq.className.replace("bsq ", "") : "small"); }
    const left = total - n; $("bleft").textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0") + " left";
  };
  paint();
  timers.push(setInterval(() => { n++; if (n >= total) { stopTimers(); const st = $("bstep"); if (st) { st.textContent = "Well done"; $("bcount").textContent = ""; $("bleft").textContent = "Notice how you feel."; } return; } paint(); }, 1000));
}
act("b-pick", el => { tState.pattern = el.dataset.id; drawBreathe(); });
act("b-done", () => { logTool("breathe"); closeSheet(); });
act("unload-open", el => { if ($("mflow")) closeSheet(); openUnload(el.dataset.more === "1"); });

// =============== Journal entry: what's going on, how to resolve it, actions to tick off ===============
let je = null;
export function openEntry(date, id) {
  const src = id ? ((mindOf(date).entries || []).find(e => e.id === id)) : null;
  je = src ? { date, id, story: src.story || "", resolve: src.resolve || "", actions: (src.actions || []).map(a => ({ ...a })), draft: "" }
    : { date: today(), id: null, story: "", resolve: "", actions: [], draft: "" };
  drawEntry();
}
function drawEntry() {
  const done = je.actions.filter(a => a.done).length;
  sheet("Journal", `<h1 class="big-title">${je.id ? esc(nice(je.date)) : "Journal"}</h1>
    <p class="note">Write it the way you'd tell a friend. Nobody else sees this.</p>
    <label class="f jlabel"><b>What's going on?</b><span>Describe the situation and how it's making you feel.</span>
      <textarea data-in="je-story" rows="6" maxlength="4000" placeholder="The kids have been fighting every evening and I end up shouting. I feel worn out and guilty after.">${esc(je.story)}</textarea></label>
    <label class="f jlabel"><b>How could you resolve it?</b><span>Your own ideas. What would make it better, even a little?</span>
      <textarea data-in="je-resolve" rows="4" maxlength="2000" placeholder="A calmer routine after school. Talk to them when we're all relaxed, not in the moment.">${esc(je.resolve)}</textarea></label>
    <div class="f jlabel"><b>What can you handle now?</b><span>Small actions you can tackle one by one. Tick them off as you go.</span>
      ${je.actions.length ? `<div class="tlist">${je.actions.map((a, k) => `<div class="trow${a.done ? " done" : ""}"><button class="tcheck" data-act="je-tick" data-k="${k}" aria-pressed="${!!a.done}" aria-label="${a.done ? "Mark not done" : "Mark done"}: ${esc(a.text)}">${a.done ? ICON.tick : ""}</button><span class="ttext">${esc(a.text)}</span><button class="tstar" data-act="je-del" data-k="${k}" aria-label="Remove ${esc(a.text)}">${ICON.close}</button></div>`).join("")}</div>
        <p class="note">${done} of ${je.actions.length} done</p>` : ""}
      <div class="tadd"><input id="je-new" data-in="je-new" value="${esc(je.draft)}" maxlength="140" placeholder="e.g. Snack and quiet time straight after school" enterkeyhint="done" autocomplete="off"><button class="btn" data-act="je-add">Add</button></div></div>
    <button class="btn primary big" data-act="je-save">Save entry</button>
    ${je.id ? `<button class="btn danger" data-act="je-delete">Delete entry</button>` : ""}`);
}
onInput("je-story", el => { je.story = el.value; });
onInput("je-resolve", el => { je.resolve = el.value; });
onInput("je-new", el => { je.draft = el.value; });
function jeAdd() { const t = (($("je-new") || {}).value || je.draft).trim(); if (!t) return; je.actions.push({ id: uid(), text: t, done: false }); je.draft = ""; drawEntry(); setTimeout(() => { const i = $("je-new"); if (i) i.focus(); }, 30); }
act("je-add", jeAdd);
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.id === "je-new") { e.preventDefault(); jeAdd(); } });
act("je-tick", el => { const a = je.actions[Number(el.dataset.k)]; a.done = !a.done; drawEntry(); });
act("je-del", el => { je.actions.splice(Number(el.dataset.k), 1); drawEntry(); });
act("je-save", () => {
  const pending = (($("je-new") || {}).value || "").trim();
  if (pending) je.actions.push({ id: uid(), text: pending, done: false });
  if (!je.story.trim() && !je.resolve.trim() && !je.actions.length) { toast("Write something first"); return; }
  const m = M(je.date), entry = { id: je.id || uid(), story: je.story.trim(), resolve: je.resolve.trim(), actions: je.actions, at: Date.now() };
  m.entries = je.id ? (m.entries || []).map(e => (e.id === je.id ? { ...e, ...entry, at: e.at || entry.at } : e)) : [...(m.entries || []), entry];
  saveDay(je.date); closeSheet(); toast("Saved to your journal");
});
act("je-delete", el => {
  if (!el.classList.contains("armed")) { el.classList.add("armed"); el.textContent = "Tap again to delete"; setTimeout(() => { if (el.isConnected) { el.classList.remove("armed"); el.textContent = "Delete entry"; } }, 3000); return; }
  const m = M(je.date); m.entries = (m.entries || []).filter(e => e.id !== je.id); saveDay(je.date); closeSheet(); toast("Entry deleted");
});
// tick an action straight from the Mind screen
act("je-quick", el => {
  const m = M(el.dataset.d), e = (m.entries || []).find(x => x.id === el.dataset.e), a = e && (e.actions || []).find(x => x.id === el.dataset.a);
  if (!a) return; a.done = !a.done; saveDay(el.dataset.d); buzz(20); render();
});
act("entry-new", () => openEntry());
act("entry-open", el => openEntry(el.dataset.d, el.dataset.e));
