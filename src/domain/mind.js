// Mind: unload, sort and focus. Pure: day records are passed in.
//   day.mind = {
//     am: { level 1-5, signals: [ids], causes: [ids], note },      morning check-in
//     pm: { level 1-5, note },                                       evening check-in
//     tasks:   [{ id, text, imp, urg, step, when: "today"|"week"|"later", top, done, from? }],   things you can act on
//     worries: [{ id, text, outcome: "let"|"park", reframe?, reviewed? }],                     things you can't
//     tools:   [{ id: tool id, at: ms }],                            resets used today
//     thoughts: [{ situation, thought, before, for, against, balanced, after }],
//     good: [three good things]
//   }

export const LEVELS = ["Calm", "Mild", "Moderate", "High", "Overwhelmed"];
export const SIGNALS = [["tense", "Tense body"], ["racing", "Racing thoughts"], ["tired", "Tired"], ["irritable", "Irritable"], ["focus", "Can't focus"], ["sleep", "Slept badly"], ["chest", "Tight chest"], ["appetite", "Off my food"]];
export const CAUSES = [
  ["work", "Work"], ["money", "Money"], ["health", "Health"], ["family", "Family"], ["relationships", "Relationships"],
  ["sleep", "Sleep"], ["training", "Training or body"], ["time", "Too much to do"], ["news", "News or world"], ["other", "Something else"]
];
export const WHEN = [["today", "Today"], ["week", "This week"], ["later", "Later"]];

// The four boxes of the Eisenhower matrix, in the order to deal with them.
export const QUADRANTS = [
  { id: "do", name: "Do first", why: "Important and urgent. These are today's real priorities: do them while your energy is highest.", imp: true, urg: true },
  { id: "plan", name: "Schedule", why: "Important, not urgent. This is where progress lives (training, health, planning). Give each one a time so it doesn't get crowded out.", imp: true, urg: false },
  { id: "shrink", name: "Shrink or hand off", why: "Urgent but not important to you. Keep them small: a quick reply, a shorter version, or someone else does it.", imp: false, urg: true },
  { id: "drop", name: "Let go", why: "Neither important nor urgent. Writing them down is enough. Drop them, or park them for a quiet day.", imp: false, urg: false }
];
export const quadrantOf = t => QUADRANTS.find(q => q.imp === !!t.imp && q.urg === !!t.urg);
export const TOP_MAX = 3;

// The toolkit. `mins` is a rough length shown on the card.
export const TOOLS = [
  { id: "breathe", name: "Breathe", sub: "Three patterns, 1 to 3 minutes", mins: 2 },
  { id: "ground", name: "5-4-3-2-1 grounding", sub: "Come back to the room you're in", mins: 2 },
  { id: "thought", name: "Thought check", sub: "Test a stressful thought, find a fairer one", mins: 4 },
  { id: "relax", name: "Body relax", sub: "Tense and release, head to toe", mins: 5 },
  { id: "worry", name: "Worry time", sub: "Give parked worries 15 minutes, then stop", mins: 15 },
  { id: "good", name: "Three good things", sub: "End the day on what went right", mins: 2 },
  { id: "walk", name: "Calm walk", sub: "10 minutes, easy pace, no phone", mins: 10 }
];

// Breathing patterns: [phase label, seconds] repeated. Longer out-breaths calm the body fastest.
export const BREATHS = [
  { id: "sigh", name: "Physiological sigh", sub: "Two breaths in, one long breath out. The quickest way to settle.", steps: [["Breathe in", 2], ["Top up", 1], ["Long breath out", 6]], secs: 90 },
  { id: "calm", name: "Long exhale", sub: "In for 4, out for 6. Good any time.", steps: [["Breathe in", 4], ["Breathe out", 6]], secs: 120 },
  { id: "box", name: "Box breathing", sub: "In 4, hold 4, out 4, hold 4. Steadies you before something big.", steps: [["Breathe in", 4], ["Hold", 4], ["Breathe out", 4], ["Hold", 4]], secs: 128 }
];

// Body relax: tense each group for about 5 seconds, then let go for 10.
export const RELAX = [
  ["Hands and arms", "Make fists and tighten your arms. Hold... and let go. Feel the warmth."],
  ["Shoulders", "Lift your shoulders to your ears. Hold... and drop them. Let them stay low."],
  ["Face and jaw", "Scrunch your face, clench your jaw. Hold... and soften. Let your tongue rest."],
  ["Chest and belly", "Take a deep breath and tighten your stomach. Hold... and breathe out slowly."],
  ["Legs and feet", "Press your feet down and tighten your legs. Hold... and release."],
  ["Whole body", "Scan from head to toe. Breathe out any tension that's left. Stay here for three slow breaths."]
];

// Thought check prompts (a simple version of a cognitive behavioural therapy thought record).
export const THOUGHT_STEPS = [
  ["situation", "What happened?", "Just the facts, like a camera would see it.", "My manager moved our meeting with no reason"],
  ["thought", "What went through your mind?", "The thought that stings most.", "I'm about to get bad news, I've messed up"],
  ["for", "What supports that thought?", "Facts only, not feelings.", "The last project ran late"],
  ["against", "What doesn't fit it?", "What would a friend point out?", "Meetings move all the time. I got good feedback last month"],
  ["balanced", "What's a fairer way to see it?", "Something you can believe, not forced positivity.", "It's probably a scheduling thing. If it's about the project, I can explain the delay"]
];

// Tasks grouped by box, unfinished first within each.
export function sortTasks(tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  return QUADRANTS.map(q => ({ ...q, tasks: list.filter(t => quadrantOf(t).id === q.id).sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1)) }));
}

// Suggest today's three: unfinished items for today from the most pressing boxes first.
export function suggestTop(tasks, max = TOP_MAX) {
  const order = { do: 0, plan: 1, shrink: 2, drop: 3 }, w = t => (t.when === "today" || !t.when ? 0 : t.when === "week" ? 10 : 20);
  // never suggest the "Let go" box: neither important nor urgent
  return (tasks || []).filter(t => !t.done && quadrantOf(t).id !== "drop").sort((a, b) => (w(a) + order[quadrantOf(a).id]) - (w(b) + order[quadrantOf(b).id])).slice(0, max).map(t => t.id);
}

// Focus order: today's three not yet done, in the order they're listed.
export const focusQueue = tasks => (tasks || []).filter(t => t.top && !t.done);

// Unfinished items from an earlier day, ready to bring forward (stars cleared, origin kept).
export function carryOver(prevTasks, prevDate, existing = []) {
  const have = new Set((existing || []).map(t => t.text.trim().toLowerCase()));
  return (prevTasks || []).filter(t => !t.done && !have.has(t.text.trim().toLowerCase()))
    .map(t => ({ ...t, top: false, done: false, from: t.from || prevDate }));
}

// Parked worries from the last `back` days that haven't been looked at in worry time.
export function parkedWorries(days, ref, back = 7) {
  const out = [];
  for (let i = back; i >= 0; i--) {
    const d = parse(ref); d.setDate(d.getDate() - i); const k = iso(d);
    ((((days[k] || {}).mind) || {}).worries || []).forEach(w => { if (w.outcome === "park" && !w.reviewed) out.push({ ...w, date: k }); });
  }
  return out;
}

// What the unload produced, for the closing summary.
export function unloadSummary(m) {
  const tasks = (m && m.tasks) || [], worries = (m && m.worries) || [];
  return {
    total: tasks.length + worries.length, today: tasks.filter(t => t.when === "today" || !t.when).length,
    later: tasks.filter(t => t.when === "week" || t.when === "later").length,
    letGo: worries.filter(w => w.outcome === "let").length, parked: worries.filter(w => w.outcome === "park").length,
    top: tasks.filter(t => t.top).length
  };
}

export function daySummary(m) {
  const tasks = (m && m.tasks) || [], top = tasks.filter(t => t.top);
  return {
    before: m && m.am ? m.am.level : null, after: m && m.pm ? m.pm.level : null,
    total: tasks.length, done: tasks.filter(t => t.done).length, top: top.length, topDone: top.filter(t => t.done).length,
    tools: [...new Set(((m && m.tools) || []).map(x => x.id))]
  };
}

const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const avg = xs => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 10) / 10 : null);

// The last n days ending on `ref`: averages, how much stress dropped by evening, priorities done,
// the causes seen most, and which tools went with the biggest drops (needs a few days of data).
export function weekStats(days, ref, n = 7) {
  const out = [], causes = {};
  for (let i = n - 1; i >= 0; i--) {
    const d = parse(ref); d.setDate(d.getDate() - i);
    const k = iso(d), m = (days[k] || {}).mind, s = daySummary(m);
    out.push({ date: k, ...s });
    ((m && m.am && m.am.causes) || []).forEach(c => (causes[c] = (causes[c] || 0) + 1));
  }
  const both = out.filter(x => x.before != null && x.after != null);
  const tops = out.reduce((a, x) => a + x.top, 0), topsDone = out.reduce((a, x) => a + x.topDone, 0);
  let streak = 0;
  for (let i = out.length - 1; i >= 0; i--) { if (out[i].before != null) streak++; else if (i === out.length - 1) continue; else break; }
  // tools: compare the evening drop on days a tool was used with days it wasn't (at least 2 of each)
  const helped = TOOLS.map(tl => {
    const withT = both.filter(x => x.tools.includes(tl.id)), without = both.filter(x => !x.tools.includes(tl.id));
    if (withT.length < 2 || without.length < 2) return null;
    const diff = avg(withT.map(x => x.before - x.after)) - avg(without.map(x => x.before - x.after));
    return diff > 0 ? { id: tl.id, name: tl.name, diff: Math.round(diff * 10) / 10 } : null;
  }).filter(Boolean).sort((a, b) => b.diff - a.diff);
  return {
    days: out, checkins: out.filter(x => x.before != null).length,
    avgBefore: avg(out.filter(x => x.before != null).map(x => x.before)), avgAfter: avg(out.filter(x => x.after != null).map(x => x.after)),
    drop: both.length ? avg(both.map(x => x.before - x.after)) : null,
    topRate: tops ? topsDone / tops : null, tops, topsDone, streak,
    causes: Object.entries(causes).sort((a, b) => b[1] - a[1]).slice(0, 3), helped
  };
}

// Journal: free entries about what's going on, how to resolve it, and the actions to take.
//   day.mind.entries = [{ id, story, resolve, actions: [{ id, text, done }], at }]
// Newest first across the last `back` days, each with its date and action progress.
export function journalEntries(days, ref, back = 60) {
  const out = [];
  for (let i = 0; i <= back; i++) {
    const d = parse(ref); d.setDate(d.getDate() - i); const k = iso(d);
    ((((days[k] || {}).mind) || {}).entries || []).slice().reverse().forEach(e => {
      const acts = e.actions || [];
      out.push({ ...e, date: k, open: acts.filter(a => !a.done).length, total: acts.length });
    });
  }
  return out;
}
