// Mind: clear your head and tackle what matters. The Unload flow (feel, release, sort one by one,
// pick three), Focus on one priority at a time, a journal (what's going on, how to resolve it, actions
// to tick off), worry time, a toolkit of short resets, and the week at a glance.
import { act, segHtml, toast, confirmTap, ICON } from "../lib/dom.js";
import { esc } from "../lib/format.js";
import { iso, parse, addDays, today, nice, DOW } from "../lib/dates.js";
import { state, day, render } from "../core/state.js";
import { saveDay } from "../core/store.js";
import { LEVELS, SIGNALS, CAUSES, WHEN, TOOLS, TOP_MAX, quadrantOf, sortTasks, suggestTop, carryOver, weekStats, parkedWorries, journalEntries, focusQueue } from "../domain/mind.js";
import "../features/mindflow.js";

const uid = () => Math.random().toString(36).slice(2, 9);
const M = (date = today()) => { const d = day(date); if (!d.mind) d.mind = {}; return d.mind; };
const mindOf = (date = today()) => (state.days[date] || {}).mind || {};
const TOOL_ICON = { breathe: "water", ground: "star", thought: "edit", relax: "bolt", worry: "timer", good: "tick", walk: "run" };
const label = (list, id) => (list.find(x => x[0] === id) || [, id])[1];
let pm = null, showAllJournal = false;

export function renderMind(root) {
  const t = today(), m = mindOf(t), tasks = m.tasks || [], top = tasks.filter(x => x.top);
  const yesterday = iso(addDays(parse(t), -1)), carry = carryOver(mindOf(yesterday).tasks || [], yesterday, tasks);
  const rest = tasks.filter(x => !x.top), parked = parkedWorries(state.days, t), w = weekStats(state.days, t);
  root.innerHTML = `<section class="view">
    <button class="backlink" data-act="tab" data-v="today">${ICON.back} Today</button>
    <div class="phead"><h1>Mind</h1><div class="psub"><span class="note">Clear your head, then take things one at a time</span></div></div>
    ${startCard(m)}
    ${top.length ? threeCard(top) : ""}
    ${journalCard(t)}
    ${parked.length ? `<button class="urow" data-act="tool-open" data-id="worry"><i class="ui">${ICON.timer}</i><span class="ut"><b>Worry time</b><small>${parked.length} worr${parked.length === 1 ? "y" : "ies"} parked. Give them 15 minutes, then stop.</small></span><em class="chev" aria-hidden="true">${ICON.next}</em></button>` : ""}
    ${rest.length || carry.length ? `<details class="card fold"${top.length ? "" : " open"}><summary><h3>Everything on your list</h3><span class="note">${rest.length} more</span></summary>
      ${carry.length ? `<button class="linkbtn" data-act="mind-carry">Bring over ${carry.length} unfinished from yesterday</button>` : ""}
      ${rest.length && top.length < TOP_MAX ? `<p class="note">Star up to ${TOP_MAX - top.length} more for today${rest.some(x => !x.done) ? ", or <button class=\"linkbtn inline\" data-act=\"mind-suggest\">let the app pick</button>" : ""}.</p>` : ""}
      ${sortTasks(rest).filter(q => q.tasks.length).map(q => `<div class="quad q-${q.id}"><div class="qh"><b>${q.name}</b><span>${q.tasks.length}</span></div><p class="qwhy">${esc(q.why)}</p><div class="tlist">${q.tasks.map(x => taskRow(x)).join("")}</div></div>`).join("")}
    </details>` : ""}
    <section class="card"><h3>Toolkit</h3><p class="note">Short resets for when stress builds. Use one, then notice how you feel.</p>
      <div class="tools">${TOOLS.map(tl => `<button class="tool" data-act="tool-open" data-id="${tl.id}"><i>${ICON[TOOL_ICON[tl.id]]}</i><span><b>${esc(tl.name)}</b><small>${esc(tl.sub)}</small></span><em class="chev">${ICON.next}</em></button>`).join("")}</div></section>
    ${weekCard(w)}
    <details class="card fold"><summary><h3>Why this works</h3></summary>
      <div class="mguide">
        <p><b>Naming it lowers it.</b> Putting a feeling and its cause into words is linked with a calmer stress response. That's why you start by noticing how you feel.</p>
        <p><b>Out of your head, onto the page.</b> Unfinished things keep pulling at your attention. Writing them down, each with a next step, lets your mind stop holding them.</p>
        <p><b>Not everything is yours to fix.</b> Sorting what you can act on from what you can't lets you put real effort where it counts, and set the rest down or give it a set worry time.</p>
        <p><b>One at a time.</b> Switching between tasks costs focus. Three priorities, worked on one by one with a timer, get more done and feel calmer than a long list.</p>
        <p><b>Writing it through helps.</b> Journaling about a hard situation, then your own ideas for resolving it, turns a loop of worry into steps you can take.</p>
        <p><b>Your body helps too.</b> Slow breathing with a long out-breath, a walk, regular sleep and training all lower day-to-day stress.</p>
      </div></details>
    <p class="note mfoot">This is a self-help tool, not therapy. If stress stays high for weeks, or stops you sleeping, eating or working, talk to your doctor. If you ever feel unsafe or think about harming yourself, call your local emergency number now.</p>
  </section>`;
}

function startCard(m) {
  if (!m.am) return `<section class="card mstart"><h3>Clear your head</h3>
      <p class="note">About three minutes. Notice how you feel, get everything out of your head, sort what you can act on from what you can't, then pick three things for today.</p>
      <ol class="msteps"><li><b>Feel</b><span>How stressed, and why</span></li><li><b>Release</b><span>Everything on your mind</span></li><li><b>Sort</b><span>One item at a time</span></li><li><b>Focus</b><span>Today's three</span></li></ol>
      <button class="btn primary big" data-act="unload-open">Unload my mind</button></section>`;
  const sig = (m.am.signals || []).map(s => label(SIGNALS, s)), cau = (m.am.causes || []).map(c => label(CAUSES, c));
  return `<section class="card ccard"><div class="card-head"><h3>Today</h3><button class="linkbtn" data-act="unload-open" data-more="1">Unload more</button></div>
      <div class="cline"><span>This morning</span><b class="lv l${m.am.level}">${LEVELS[m.am.level - 1]}</b></div>
      ${cau.length ? `<p class="note">Behind it: ${esc(cau.join(", "))}${sig.length ? ". Feeling: " + esc(sig.join(", ").toLowerCase()) : ""}.</p>` : ""}
      ${m.am.note ? `<p class="cnote">${esc(m.am.note)}</p>` : ""}
      ${m.pm ? `<div class="cline"><span>Later</span><b class="lv l${m.pm.level}">${LEVELS[m.pm.level - 1]}</b></div>
        <p class="note">${m.pm.level < m.am.level ? `Down ${m.am.level - m.pm.level} step${m.am.level - m.pm.level === 1 ? "" : "s"} since this morning. Notice what helped.` : m.pm.level === m.am.level ? "About the same as this morning. Tomorrow, try one reset early in the day." : "Higher than this morning. Be kind to yourself tonight: an early night does a lot."}</p>`
      : pm ? `<span class="eyebrow">How do you feel now?</span>${segHtml("pm-level", LEVELS.map((l, i) => [i + 1, l]), pm.level || "", 'data-act="pm-level" aria-label="Stress now"')}
        <div class="row"><button class="btn" style="flex:1" data-act="pm-cancel">Cancel</button><button class="btn primary" style="flex:2" data-act="pm-save"${pm.level ? "" : " disabled"}>Save</button></div>`
      : `<button class="btn" data-act="pm-open">Check in again: how do you feel now?</button>`}</section>`;
}

function threeCard(top) {
  const left = top.filter(x => !x.done).length;
  return `<section class="card mtop"><div class="card-head"><h3>Today's three</h3><span class="note">${top.length - left} of ${top.length} done</span></div>
    <div class="tlist">${top.map(x => taskRow(x, true)).join("")}</div>
    ${left ? `<button class="btn primary big" data-act="focus-open">${ICON.play} Focus: one at a time</button>` : `<p class="note">All done. That's a good day.</p>`}</section>`;
}

const taskRow = (x, compact) => `<div class="trow${x.done ? " done" : ""}">
  <button class="tcheck" data-act="mind-done" data-id="${x.id}" aria-label="${x.done ? "Mark not done" : "Mark done"}: ${esc(x.text)}" aria-pressed="${!!x.done}">${x.done ? ICON.tick : ""}</button>
  <span class="ttext">${esc(x.text)}<small>${[x.step && "Next: " + esc(x.step), x.when && x.when !== "today" && esc(label(WHEN, x.when)), x.from && "From " + esc(nice(x.from))].filter(Boolean).join(" &middot; ")}</small></span>
  <button class="tstar${x.top ? " on" : ""}" data-act="mind-top" data-id="${x.id}" aria-label="${x.top ? "Remove from today's three" : "Add to today's three"}" aria-pressed="${!!x.top}">${ICON.star}</button>
  ${compact ? "" : `<div class="ttags"><button class="tag${x.imp ? " on" : ""}" data-act="mind-imp" data-id="${x.id}" aria-pressed="${!!x.imp}">Important</button><button class="tag${x.urg ? " on" : ""}" data-act="mind-urg" data-id="${x.id}" aria-pressed="${!!x.urg}">Urgent</button><button class="tdel" data-act="mind-del" data-id="${x.id}" aria-label="Delete ${esc(x.text)}">${ICON.trash}</button></div>`}
</div>`;

function journalCard(t) {
  const all = journalEntries(state.days, t), open = all.flatMap(e => (e.actions || []).filter(a => !a.done).map(a => ({ ...a, e: e.id, d: e.date, story: e.story }))).slice(0, 6);
  const shown = showAllJournal ? all : all.slice(0, 3);
  return `<section class="card"><div class="card-head"><h3>Journal</h3><button class="linkbtn" data-act="entry-new">${ICON.plus} New entry</button></div>
    ${all.length ? "" : `<p class="note">Write about what's going on, how you might resolve it, and the small actions you can take. Tick them off one by one.</p>
      <button class="btn big" data-act="entry-new">Write an entry</button>`}
    ${open.length ? `<span class="eyebrow">Actions to tackle</span><div class="tlist">${open.map(a => `<div class="trow"><button class="tcheck" data-act="je-quick" data-d="${a.d}" data-e="${a.e}" data-a="${a.id}" aria-label="Mark done: ${esc(a.text)}"></button><span class="ttext">${esc(a.text)}<small>From your entry on ${esc(nice(a.d))}</small></span><span></span></div>`).join("")}</div>` : ""}
    ${all.length ? `<span class="eyebrow">Entries</span><div class="jentries">${shown.map(e => `<button class="jentryrow" data-act="entry-open" data-d="${e.date}" data-e="${e.id}">
        <span class="jdate">${esc(nice(e.date))}</span><span class="jtext">${esc((e.story || e.resolve || "").slice(0, 120))}${(e.story || "").length > 120 ? "..." : ""}</span>
        ${e.total ? `<span class="jprog">${e.total - e.open} of ${e.total} actions done</span>` : ""}</button>`).join("")}</div>
      ${all.length > 3 ? `<button class="linkbtn" data-act="journal-all">${showAllJournal ? "Show fewer" : `Show all ${all.length} entries`}</button>` : ""}` : ""}
  </section>`;
}

function weekCard(w) {
  if (!w.checkins) return "";
  return `<section class="card"><div class="card-head"><h3>Your week</h3><span class="note">${w.checkins} check-in${w.checkins === 1 ? "" : "s"}, ${w.streak}-day streak</span></div>
    <div class="mweek">${w.days.map(x => `<div><span class="mb" style="height:${x.before ? x.before * 12 : 4}px" title="Morning"></span><span class="ma" style="height:${x.after ? x.after * 12 : 4}px" title="Later"></span><small>${DOW[parse(x.date).getDay()].slice(0, 1)}</small></div>`).join("")}</div>
    <div class="row note jlegend"><span><i style="background:var(--muted)"></i>Morning</span><span><i style="background:var(--accent)"></i>Later</span></div>
    <div class="stats"><div class="stat"><b>${w.avgBefore != null ? LEVELS[Math.round(w.avgBefore) - 1] : "-"}</b><span>typical morning</span></div>
      <div class="stat"><b>${w.drop != null ? (w.drop > 0 ? "-" : "") + Math.abs(w.drop) : "-"}</b><span>steps calmer by evening</span></div>
      <div class="stat"><b>${w.topRate != null ? Math.round(w.topRate * 100) + "%" : "-"}</b><span>of top three done</span></div></div>
    ${w.causes.length ? `<p class="note">Most often behind it: ${esc(w.causes.map(([c]) => label(CAUSES, c)).join(", "))}. Worth planning around.</p>` : ""}
    ${w.helped.length ? `<p class="note">On days you used <b>${esc(w.helped[0].name.toLowerCase())}</b>, you were ${w.helped[0].diff} step${w.helped[0].diff === 1 ? "" : "s"} calmer by evening than on days you didn't.</p>` : w.checkins >= 2 ? `<p class="note">Keep checking in morning and evening and using the toolkit. After a few days you'll see which tools help you most.</p>` : ""}
  </section>`;
}

// ---------- actions ----------
const find = id => (mindOf().tasks || []).find(x => x.id === id);
const save = () => { saveDay(today()); render(); };
act("mind-open", () => { state.view = "mind"; render(); window.scrollTo(0, 0); });
act("journal-all", () => { showAllJournal = !showAllJournal; render(); });
act("pm-open", () => { pm = { level: null }; render(); });
act("pm-level", (el, ev) => { const b = ev.target.closest("button"); if (b) { pm.level = Number(b.dataset.v); render(); } });
act("pm-cancel", () => { pm = null; render(); });
act("pm-save", () => { if (!pm || !pm.level) return; M().pm = { level: pm.level }; pm = null; save(); toast("Evening check-in saved"); });
act("mind-carry", () => {
  const t = today(), y = iso(addDays(parse(t), -1)), m = M(t), add = carryOver(mindOf(y).tasks || [], y, m.tasks || []);
  m.tasks = [...(m.tasks || []), ...add.map(x => ({ ...x, id: uid() }))]; save(); toast(`${add.length} brought over`);
});
act("mind-imp", el => { const x = find(el.dataset.id); x.imp = !x.imp; save(); });
act("mind-urg", el => { const x = find(el.dataset.id); x.urg = !x.urg; save(); });
act("mind-done", el => { const x = find(el.dataset.id); x.done = !x.done; save(); if (x.done && x.top && focusQueue(mindOf().tasks).length === 0) toast("All three done. That's a good day."); });
act("mind-top", el => {
  const tasks = mindOf().tasks || [], x = find(el.dataset.id);
  if (!x.top && tasks.filter(t => t.top).length >= TOP_MAX) { toast("Three is the limit. Unstar one first."); return; }
  x.top = !x.top; save();
});
act("mind-suggest", () => { const ids = suggestTop(mindOf().tasks); (mindOf().tasks || []).forEach(x => (x.top = x.top || ids.includes(x.id))); const n = (mindOf().tasks || []).filter(x => x.top); if (n.length > TOP_MAX) n.slice(TOP_MAX).forEach(x => (x.top = false)); save(); });
act("mind-del", el => { if (!confirmTap("mdel" + el.dataset.id, el, "Delete?")) return; const m = M(); m.tasks = (m.tasks || []).filter(x => x.id !== el.dataset.id); save(); });

// Today's entry row.
export function mindRow() {
  const m = mindOf(), top = (m.tasks || []).filter(x => x.top);
  const sub = m.am ? `${LEVELS[m.am.level - 1]} this morning${top.length ? ` &middot; ${top.filter(x => x.done).length} of ${top.length} priorities done` : ""}` : "Clear your head: unload, sort, focus";
  return `<button class="urow" data-act="mind-open"><i class="ui">${ICON.mind}</i><span class="ut"><b>Mind</b><small>${sub}</small></span><em class="chev" aria-hidden="true">${ICON.next}</em></button>`;
}
