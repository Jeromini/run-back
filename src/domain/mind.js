// Mind: stress check-ins and priorities. Pure: day records are passed in.
//   day.mind = { am: { level 1-5, causes: [ids], note }, pm: { level 1-5, note },
//                tasks: [{ id, text, imp: bool, urg: bool, top: bool, done: bool, from?: "YYYY-MM-DD" }] }

export const LEVELS = ["Calm", "Mild", "Moderate", "High", "Overwhelmed"];
export const CAUSES = [
  ["work", "Work"], ["money", "Money"], ["health", "Health"], ["family", "Family"], ["relationships", "Relationships"],
  ["sleep", "Sleep"], ["training", "Training or body"], ["time", "Too much to do"], ["news", "News or world"], ["other", "Something else"]
];

// The four boxes of the Eisenhower matrix, in the order to deal with them.
export const QUADRANTS = [
  { id: "do", name: "Do first", why: "Important and urgent. These are today's real priorities: do them while your energy is highest.", imp: true, urg: true },
  { id: "plan", name: "Schedule", why: "Important, not urgent. This is where progress lives (training, health, planning). Give each one a time so it doesn't get crowded out.", imp: true, urg: false },
  { id: "shrink", name: "Shrink or hand off", why: "Urgent but not important to you. Keep them small: a quick reply, a shorter version, or someone else does it.", imp: false, urg: true },
  { id: "drop", name: "Let go", why: "Neither important nor urgent. Writing them down is enough. Drop them, or park them for a quiet day.", imp: false, urg: false }
];
export const quadrantOf = t => QUADRANTS.find(q => q.imp === !!t.imp && q.urg === !!t.urg);
export const TOP_MAX = 3;

// Tasks grouped by box, unfinished first within each.
export function sortTasks(tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  return QUADRANTS.map(q => ({ ...q, tasks: list.filter(t => quadrantOf(t).id === q.id).sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1)) }));
}

// Suggest today's three: unfinished items from the most pressing boxes first.
export function suggestTop(tasks, max = TOP_MAX) {
  const order = { do: 0, plan: 1, shrink: 2, drop: 3 };
  return (tasks || []).filter(t => !t.done).sort((a, b) => order[quadrantOf(a).id] - order[quadrantOf(b).id]).slice(0, max).map(t => t.id);
}

// Unfinished items from an earlier day, ready to bring forward (stars cleared, origin kept).
export function carryOver(prevTasks, prevDate, existing = []) {
  const have = new Set((existing || []).map(t => t.text.trim().toLowerCase()));
  return (prevTasks || []).filter(t => !t.done && !have.has(t.text.trim().toLowerCase()))
    .map(t => ({ ...t, top: false, done: false, from: t.from || prevDate }));
}

export function daySummary(m) {
  const tasks = (m && m.tasks) || [], top = tasks.filter(t => t.top);
  return {
    before: m && m.am ? m.am.level : null, after: m && m.pm ? m.pm.level : null,
    total: tasks.length, done: tasks.filter(t => t.done).length, top: top.length, topDone: top.filter(t => t.done).length
  };
}

const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

// The last n days ending on `ref`: averages, how much check-ins dropped, priorities done, causes seen most.
export function weekStats(days, ref, n = 7) {
  const out = [], causes = {};
  for (let i = n - 1; i >= 0; i--) {
    const d = parse(ref); d.setDate(d.getDate() - i);
    const k = iso(d), m = (days[k] || {}).mind, s = daySummary(m);
    out.push({ date: k, ...s });
    ((m && m.am && m.am.causes) || []).forEach(c => (causes[c] = (causes[c] || 0) + 1));
  }
  const avg = xs => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length * 10) / 10 : null);
  const both = out.filter(x => x.before != null && x.after != null);
  const tops = out.reduce((a, x) => a + x.top, 0), topsDone = out.reduce((a, x) => a + x.topDone, 0);
  let streak = 0;
  for (let i = out.length - 1; i >= 0; i--) { if (out[i].before != null) streak++; else if (i === out.length - 1) continue; else break; }
  return {
    days: out, checkins: out.filter(x => x.before != null).length,
    avgBefore: avg(out.filter(x => x.before != null).map(x => x.before)), avgAfter: avg(out.filter(x => x.after != null).map(x => x.after)),
    drop: both.length ? avg(both.map(x => x.before - x.after)) : null,
    topRate: tops ? topsDone / tops : null, tops, topsDone, streak,
    causes: Object.entries(causes).sort((a, b) => b[1] - a[1]).slice(0, 3)
  };
}
