// Mind: a stress check-in, a brain dump sorted into priorities, today's three, an evening check-in,
// quick reset tools (box breathing, 5-4-3-2-1 grounding, a calm walk) and the week at a glance.
import { act, onInput, openSheet, closeSheet, segHtml, toast, confirmTap, ICON } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { iso, parse, addDays, today, nice, DOW } from "../lib/dates.js";
import { state, day, render } from "../core/state.js";
import { saveDay } from "../core/store.js";
import { LEVELS, CAUSES, QUADRANTS, TOP_MAX, quadrantOf, sortTasks, suggestTop, carryOver, weekStats } from "../domain/mind.js";
import { openWorkout } from "../features/workout.js";

const uid = () => Math.random().toString(36).slice(2, 9);
let ci = null;              // check-in draft: { when: "am" | "pm", level, causes, note }
const M = date => { const d = day(date); if (!d.mind) d.mind = {}; return d.mind; };
const mindOf = date => (state.days[date] || {}).mind || {};
const levelSeg = (id, val, act) => segHtml(id, LEVELS.map((l, i) => [i + 1, l]), val || "", `data-act="${act}" aria-label="Stress level"`);

// ---------- screen ----------
export function renderMind(root) {
  const t = today(), m = mindOf(t), tasks = m.tasks || [], yesterday = iso(addDays(parse(t), -1));
  const carry = carryOver((mindOf(yesterday).tasks || []), yesterday, tasks);
  const top = tasks.filter(x => x.top), w = weekStats(state.days, t);
  root.innerHTML = `<section class="view">
    <button class="backlink" data-act="tab" data-v="today">${ICON.back} Today</button>
    <div class="phead"><h1>Mind</h1><div class="psub"><span class="note">Stress and priorities &middot; ${esc(nice(t))}</span></div></div>
    ${checkinCard(t, m)}
    <section class="card mtop"><div class="card-head"><h3>Today's three</h3><span class="note">${top.filter(x => x.done).length} of ${top.length} done</span></div>
      ${top.length ? `<div class="tlist">${top.map(x => taskRow(x, t, true)).join("")}</div>`
        : `<p class="note">Pick up to three things that would make today a good day. Star them in your list below${tasks.length ? `, or <button class="linkbtn inline" data-act="mind-suggest">let the app suggest three</button>` : ""}.</p>`}
    </section>
    <section class="card"><div class="card-head"><h3>What's on your mind</h3><span class="note">${tasks.length} item${tasks.length === 1 ? "" : "s"}</span></div>
      <p class="note">Write down everything that's taking up space, big or small. Getting it out of your head and onto a list is the first step to feeling in control.</p>
      <div class="tadd"><input id="mind-new" data-in="mind-new" placeholder="e.g. Reply to the bank, book physio, plan the week" maxlength="120" enterkeyhint="done"><button class="btn primary" data-act="mind-add">Add</button></div>
      ${carry.length ? `<button class="linkbtn" data-act="mind-carry">Bring over ${carry.length} unfinished from yesterday</button>` : ""}
      ${tasks.length ? `<p class="note">For each one, tap <b>Important</b> if it matters to your goals or the people you care about, and <b>Urgent</b> if it has a real deadline soon.</p>` : ""}
      ${sortTasks(tasks).filter(q => q.tasks.length).map(q => `<div class="quad q-${q.id}"><div class="qh"><b>${q.name}</b><span>${q.tasks.length}</span></div><p class="qwhy">${esc(q.why)}</p><div class="tlist">${q.tasks.map(x => taskRow(x, t, false)).join("")}</div></div>`).join("")}
    </section>
    <section class="card"><h3>Reset in a few minutes</h3>
      <div class="tools">
        <button class="tool" data-act="mind-breathe"><i>${ICON.water}</i><span><b>Box breathing</b><small>2 minutes, 4 counts in, hold, out, hold</small></span><em class="chev">${ICON.next}</em></button>
        <button class="tool" data-act="mind-ground"><i>${ICON.star}</i><span><b>5-4-3-2-1 grounding</b><small>Bring your attention back to the room</small></span><em class="chev">${ICON.next}</em></button>
        <button class="tool" data-act="mind-walk"><i>${ICON.run}</i><span><b>A 10-minute calm walk</b><small>Easy pace, no phone, guided timer</small></span><em class="chev">${ICON.next}</em></button>
      </div></section>
    ${weekCard(w)}
    <details class="card fold"><summary><h3>Why this works</h3></summary>
      <div class="mguide">
        <p><b>Naming it lowers it.</b> Putting a feeling and its cause into words is linked with a calmer stress response. That's why the check-in asks what's behind it.</p>
        <p><b>A list frees your head.</b> Unfinished tasks keep pulling at your attention. Writing them down, with a next step, lets your mind let go of holding them.</p>
        <p><b>Important beats urgent.</b> Urgent things shout; important things build the life you want. Sorting each item into one of four boxes shows what to do now, what to plan, what to shrink and what to drop.</p>
        <p><b>Three is enough.</b> A short list you finish feels better and builds more confidence than a long one you don't. Pick three, do the first one early.</p>
        <p><b>Your body helps.</b> Slow breathing with a long out-breath, a short walk, regular sleep and training all lower day-to-day stress.</p>
      </div></details>
    <p class="note mfoot">Stress that stays high for weeks, or stops you sleeping, eating or working, is worth talking to your doctor about. If you ever feel unsafe or think about harming yourself, call your local emergency number now.</p>
  </section>`;
}

function checkinCard(t, m) {
  if (ci) return `<section class="card ccard"><h3>${ci.when === "am" ? "How stressed do you feel right now?" : "How do you feel now?"}</h3>
      ${levelSeg("mind-level", ci.level, "mind-level")}
      ${ci.when === "am" ? `<span class="eyebrow">What's behind it? Tap any that apply</span>
        <div class="chips">${CAUSES.map(([id, l]) => `<button class="chip${ci.causes.includes(id) ? " on" : ""}" data-act="mind-cause" data-id="${id}" aria-pressed="${ci.causes.includes(id)}">${l}</button>`).join("")}</div>` : ""}
      <label class="f">${ci.when === "am" ? "What's on your mind? (just for you)" : "What helped, or what didn't?"}<textarea data-in="mind-note" rows="3" maxlength="800" placeholder="${ci.when === "am" ? "Big meeting at 10, behind on emails, slept badly" : "Got the report done, the walk helped"}">${esc(ci.note || "")}</textarea></label>
      <div class="row"><button class="btn" style="flex:1" data-act="mind-cancel">Cancel</button><button class="btn primary" style="flex:2" data-act="mind-save"${ci.level ? "" : " disabled"}>Save check-in</button></div></section>`;
  if (!m.am) return `<section class="card ccard"><h3>How are you today?</h3><p class="note">A 30-second check-in: how stressed you feel and what's behind it.</p>
      <button class="btn primary big" data-act="mind-checkin" data-w="am">Check in</button></section>`;
  const causes = (m.am.causes || []).map(c => (CAUSES.find(x => x[0] === c) || [, c])[1]).join(", ");
  return `<section class="card ccard"><div class="card-head"><h3>Check-in</h3><button class="linkbtn" data-act="mind-checkin" data-w="am">Edit</button></div>
      <div class="cline"><span>This morning</span><b class="lv l${m.am.level}">${LEVELS[m.am.level - 1]}</b></div>
      ${causes ? `<p class="note">Behind it: ${esc(causes)}</p>` : ""}${m.am.note ? `<p class="cnote">${esc(m.am.note)}</p>` : ""}
      ${m.pm ? `<div class="cline"><span>Later</span><b class="lv l${m.pm.level}">${LEVELS[m.pm.level - 1]}</b></div>
        <p class="note">${m.pm.level < m.am.level ? `Down ${m.am.level - m.pm.level} step${m.am.level - m.pm.level === 1 ? "" : "s"} since this morning. Notice what helped.` : m.pm.level === m.am.level ? "About the same as this morning. Tomorrow, try one reset early in the day." : "Higher than this morning. Be kind to yourself tonight: an early night does a lot."}</p>${m.pm.note ? `<p class="cnote">${esc(m.pm.note)}</p>` : ""}
        <button class="linkbtn" data-act="mind-checkin" data-w="pm">Edit evening check-in</button>`
      : `<button class="btn" data-act="mind-checkin" data-w="pm">Check in again: how do you feel now?</button>`}</section>`;
}

const taskRow = (x, t, compact) => `<div class="trow${x.done ? " done" : ""}">
  <button class="tcheck" data-act="mind-done" data-id="${x.id}" aria-label="${x.done ? "Mark not done" : "Mark done"}: ${esc(x.text)}" aria-pressed="${!!x.done}">${x.done ? ICON.tick : ""}</button>
  <span class="ttext">${esc(x.text)}${x.from ? `<small>From ${esc(nice(x.from))}</small>` : ""}</span>
  <button class="tstar${x.top ? " on" : ""}" data-act="mind-top" data-id="${x.id}" aria-label="${x.top ? "Remove from today's three" : "Add to today's three"}" aria-pressed="${!!x.top}">${ICON.star}</button>
  ${compact ? "" : `<div class="ttags"><button class="tag${x.imp ? " on" : ""}" data-act="mind-imp" data-id="${x.id}" aria-pressed="${!!x.imp}">Important</button><button class="tag${x.urg ? " on" : ""}" data-act="mind-urg" data-id="${x.id}" aria-pressed="${!!x.urg}">Urgent</button><button class="tdel" data-act="mind-del" data-id="${x.id}" aria-label="Delete ${esc(x.text)}">${ICON.trash}</button></div>`}
</div>`;

function weekCard(w) {
  if (!w.checkins) return "";
  return `<section class="card"><div class="card-head"><h3>Your week</h3><span class="note">${w.checkins} check-in${w.checkins === 1 ? "" : "s"}, ${w.streak}-day streak</span></div>
    <div class="mweek">${w.days.map(x => `<div><span class="mb" style="height:${x.before ? x.before * 12 : 4}px" title="Morning"></span><span class="ma" style="height:${x.after ? x.after * 12 : 4}px" title="Later"></span><small>${DOW[parse(x.date).getDay()].slice(0, 1)}</small></div>`).join("")}</div>
    <div class="row note jlegend"><span><i style="background:var(--muted)"></i>Morning</span><span><i style="background:var(--accent)"></i>Later</span></div>
    <div class="stats"><div class="stat"><b>${w.avgBefore != null ? LEVELS[Math.round(w.avgBefore) - 1] : "-"}</b><span>typical morning</span></div>
      <div class="stat"><b>${w.drop != null ? (w.drop > 0 ? "-" : "") + Math.abs(w.drop) : "-"}</b><span>steps calmer by evening</span></div>
      <div class="stat"><b>${w.topRate != null ? Math.round(w.topRate * 100) + "%" : "-"}</b><span>of top three done</span></div></div>
    ${w.causes.length ? `<p class="note">Most often behind it: ${esc(w.causes.map(([c]) => (CAUSES.find(x => x[0] === c) || [, c])[1]).join(", "))}. Worth planning around.</p>` : ""}</section>`;
}

// ---------- actions ----------
const find = id => (mindOf(today()).tasks || []).find(x => x.id === id);
const save = () => { saveDay(today()); render(); };
act("mind-open", () => { state.view = "mind"; render(); window.scrollTo(0, 0); });
act("mind-checkin", el => {
  const w = el.dataset.w, cur = mindOf(today())[w];
  ci = { when: w, level: cur ? cur.level : null, causes: cur && cur.causes ? [...cur.causes] : [], note: cur ? cur.note || "" : "" };
  render(); window.scrollTo(0, 0);
});
act("mind-level", (el, ev) => { const b = ev.target.closest("button"); if (!b) return; ci.level = Number(b.dataset.v); render(); });
act("mind-cause", el => { const id = el.dataset.id, s = new Set(ci.causes); s.has(id) ? s.delete(id) : s.add(id); ci.causes = [...s]; render(); });
onInput("mind-note", el => { if (ci) ci.note = el.value; });
act("mind-cancel", () => { ci = null; render(); });
act("mind-save", () => {
  if (!ci || !ci.level) return;
  const m = M(today());
  m[ci.when] = ci.when === "am" ? { level: ci.level, causes: ci.causes, note: ci.note.trim() } : { level: ci.level, note: ci.note.trim() };
  const was = ci.when; ci = null; save();
  toast(was === "am" ? "Checked in. Now write down what's on your mind." : "Evening check-in saved");
});
let newText = "";
onInput("mind-new", el => { newText = el.value; });
function addTask() {
  const text = (document.getElementById("mind-new") || {}).value || newText;
  if (!text.trim()) { toast("Write something first"); return; }
  const m = M(today()); m.tasks = [...(m.tasks || []), { id: uid(), text: text.trim(), imp: false, urg: false, top: false, done: false }];
  newText = ""; save();
  setTimeout(() => { const i = document.getElementById("mind-new"); if (i) i.focus(); }, 30);
}
act("mind-add", addTask);
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.id === "mind-new") { e.preventDefault(); addTask(); } });
act("mind-carry", () => {
  const t = today(), y = iso(addDays(parse(t), -1)), m = M(t), add = carryOver(mindOf(y).tasks || [], y, m.tasks || []);
  m.tasks = [...(m.tasks || []), ...add.map(x => ({ ...x, id: uid() }))]; save(); toast(`${add.length} brought over`);
});
act("mind-imp", el => { const x = find(el.dataset.id); x.imp = !x.imp; save(); });
act("mind-urg", el => { const x = find(el.dataset.id); x.urg = !x.urg; save(); });
act("mind-done", el => { const x = find(el.dataset.id); x.done = !x.done; save(); if (x.done && x.top && (mindOf(today()).tasks || []).filter(t => t.top).every(t => t.done)) toast("All three done. That's a good day."); });
act("mind-top", el => {
  const tasks = mindOf(today()).tasks || [], x = find(el.dataset.id);
  if (!x.top && tasks.filter(t => t.top).length >= TOP_MAX) { toast("Three is the limit. Unstar one first."); return; }
  x.top = !x.top; save();
});
act("mind-suggest", () => { const ids = suggestTop(mindOf(today()).tasks); (mindOf(today()).tasks || []).forEach(x => (x.top = ids.includes(x.id))); save(); });
act("mind-del", el => { if (!confirmTap("mdel" + el.dataset.id, el, "Delete?")) return; const m = M(today()); m.tasks = (m.tasks || []).filter(x => x.id !== el.dataset.id); save(); });

// ---------- box breathing ----------
let bTimer = null;
act("mind-breathe", () => {
  const steps = ["Breathe in", "Hold", "Breathe out", "Hold"];
  let n = 0, total = 120;
  openSheet({ title: "Box breathing", onClose: () => clearInterval(bTimer), html: `<h1 class="big-title">Box breathing</h1>
    <p class="note">Breathe in through your nose for 4, hold for 4, out slowly for 4, hold for 4. Two minutes is enough to feel a difference.</p>
    <div class="breath"><div class="bsq" id="bsq"></div><div class="btxt"><b id="bstep">Breathe in</b><span id="bcount">4</span></div></div>
    <p class="note" style="text-align:center"><span id="bleft">2:00</span> left</p>
    <button class="btn big" data-act="sheet-close">Finish</button>` });
  const paint = () => {
    const phase = Math.floor(n / 4) % 4, c = 4 - (n % 4), left = total - n;
    const st = document.getElementById("bstep"); if (!st) { clearInterval(bTimer); return; }
    st.textContent = steps[phase]; document.getElementById("bcount").textContent = c;
    document.getElementById("bsq").className = "bsq p" + phase;
    document.getElementById("bleft").textContent = Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0");
  };
  paint(); clearInterval(bTimer);
  bTimer = setInterval(() => { n++; if (n >= total) { clearInterval(bTimer); const s = document.getElementById("bstep"); if (s) { s.textContent = "Well done"; document.getElementById("bcount").textContent = ""; } return; } paint(); }, 1000);
});

// ---------- 5-4-3-2-1 grounding ----------
const GROUND = [["5", "things you can see", "Look around slowly. Name them in your head: a cup, a window, your hand."], ["4", "things you can feel", "Your feet on the floor, the chair, your clothes, the air on your skin."],
  ["3", "things you can hear", "Near and far: traffic, a fan, your own breathing."], ["2", "things you can smell", "Or two smells you like, if nothing is around."], ["1", "thing you can taste", "Or take one slow sip of water."]];
let gStep = 0;
function drawGround() {
  const [n, what, how] = GROUND[gStep];
  const html = `<div id="gbody"><h1 class="big-title">5-4-3-2-1</h1><p class="note">Step ${gStep + 1} of 5. Take your time.</p>
    <div class="gstep"><b>${n}</b><span>${what}</span></div><p class="dlead">${how}</p>
    <button class="btn primary big" data-act="${gStep < 4 ? "mind-gnext" : "sheet-close"}">${gStep < 4 ? "Next" : "Done"}</button></div>`;
  if (document.getElementById("gbody")) document.getElementById("sh-body").innerHTML = html; else openSheet({ title: "Grounding", html });
}
act("mind-ground", () => { gStep = 0; drawGround(); });
act("mind-gnext", () => { gStep = Math.min(4, gStep + 1); drawGround(); });

// ---------- calm walk ----------
act("mind-walk", () => openWorkout({ kind: "cross", title: "10 min calm walk", how: "Easy pace. Leave the phone in your pocket and notice what's around you.", blocks: [["w", 600, "Easy walk"]] }, today(), { type: "walk-out", free: true }));

// Today's entry row.
export function mindRow() {
  const m = mindOf(today()), top = (m.tasks || []).filter(x => x.top);
  const sub = m.am ? `${LEVELS[m.am.level - 1]} this morning${top.length ? ` &middot; ${top.filter(x => x.done).length} of ${top.length} priorities done` : ""}` : "How are you today? Check in and set three priorities";
  return `<button class="urow" data-act="mind-open"><i class="ui">${ICON.mind}</i><span class="ut"><b>Mind</b><small>${sub}</small></span><em class="chev" aria-hidden="true">${ICON.next}</em></button>`;
}
