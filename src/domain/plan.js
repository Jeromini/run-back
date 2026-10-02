// The 12-week comeback plan: run/walk build (weeks 1-9), then speed (10+).
import { parse, daysBetween, nice } from "../lib/dates.js";

// Weekly rhythm keyed by JS day number. Weeks run Thursday to Wednesday from the start date.
export const RHYTHM = { 4: "run", 5: "cross", 6: "rest", 0: "run", 1: "cross", 2: "rest", 3: "run" };
const WALK = 300;

function intervals(n, run, walk) {
  const b = [];
  for (let i = 0; i < n; i++) { b.push(["r", run]); if (i < n - 1) b.push(["w", walk]); }
  return b;
}

// Blocks are [kind, seconds, label?]; kind r = easy run, h = faster, w = walk.
export function runFor(week, dow) {
  const wu = ["w", WALK, "Warm-up"], cd = ["w", WALK, "Cool-down"], easy = m => [["r", m * 60]];
  let body, title, how, hard = false;
  if (week <= 1) { body = intervals(8, 60, 90); title = "8 x 1 min jog"; how = "1 min very easy jog, 90 s walk. Six rounds is fine if eight is too much."; }
  else if (week === 2) { body = intervals(8, 90, 90); title = "8 x 90 s jog"; how = "90 s easy jog, 90 s walk."; }
  else if (week === 3) { body = intervals(6, 120, 120); title = "6 x 2 min jog"; how = "2 min easy jog, 2 min walk."; }
  else if (week === 4) { body = intervals(6, 180, 120); title = "6 x 3 min jog"; how = "3 min easy jog, 2 min walk."; }
  else if (week === 5) { body = intervals(4, 300, 120); title = "4 x 5 min jog"; how = "5 min easy jog, 2 min walk."; }
  else if (week === 6) { body = intervals(3, 480, 120); title = "3 x 8 min jog"; how = "8 min easy jog, 2 min walk."; }
  else if (week === 7) { body = intervals(2, 720, 120); title = "2 x 12 min jog"; how = "12 min easy jog, 2 min walk."; }
  else if (week === 8) { body = easy(20); title = "20 min run"; how = "20 minutes continuous, conversational pace."; }
  else if (week === 9) { body = easy(30); title = "30 min run"; how = "Milestone: 30 easy minutes without stopping."; }
  else if (dow === 0) { const m = Math.min(70, 35 + 5 * (week - 10)); body = easy(m); title = m + " min long run"; how = "Easy with friends. Talking pace the whole way."; }
  else if (dow === 3) {
    hard = true;
    if (week <= 11) {
      body = [["r", 600]]; for (let i = 0; i < 6; i++) { body.push(["h", 20]); body.push(["w", 70]); } body.push(["r", 300]);
      title = "Easy + 6 strides"; how = "10 min easy, 6 x 20 s quick and relaxed with 70 s easy, then 5 min easy.";
    } else {
      const reps = week === 12 ? 3 : 4;
      body = [["r", 600]]; for (let i = 0; i < reps; i++) { body.push(["h", 240]); body.push(["r", 120]); } body.push(["r", 300]);
      title = reps + " x 4 min steady"; how = "10 min easy, " + reps + " x 4 min comfortably hard (short sentences only) with 2 min easy, then 5 min easy.";
    }
  } else { body = easy(30); title = "30 min easy"; how = "Easy, conversational. No watch-checking."; }
  return { kind: "run", title, how, hard, blocks: [wu, ...body, cd] };
}

export const LIFTS = [
  ["squat", "Squat or sit-to-stand", "8-12 reps. Sit back, chest up, knees track over toes."],
  ["hinge", "Hip hinge (good morning or RDL)", "8-12 reps. Push hips back, flat back."],
  ["calf", "Calf raises", "12-15 reps. Slow down, pause at the top."],
  ["push", "Push-up variation", "8-12 reps. Wall, bench or floor."],
  ["row", "Row (band, dumbbell or TRX)", "8-12 reps. Squeeze shoulder blades."]
];

export function weekOf(dateStr, profile) {
  const start = parse(profile.startDate || "2026-10-01");
  const d = daysBetween(start, parse(dateStr));
  if (d < 0) return 0;
  return Math.max(1, Math.floor(d / 7) + 1 - (profile.weekOffset || 0));
}

export function sessionFor(dateStr, profile) {
  const d = parse(dateStr), dow = d.getDay(), wk = weekOf(dateStr, profile), type = RHYTHM[dow];
  if (wk === 0) return { kind: "pre", title: "Not started", how: "Your plan starts " + nice(profile.startDate) + "." };
  if (type === "run") { const s = runFor(wk, dow); if (dow === 0) s.how += " Sunday is the run with friends: let the slowest person set the pace."; return s; }
  if (type === "cross") { const m = dow === 5 ? 30 : 35; return { kind: "cross", title: "Cardio + strength", how: m + " min easy cycling or brisk walk, then 2 sets of each strength move.", blocks: [["w", m * 60, "Easy cardio"]] }; }
  return { kind: "rest", title: "Rest day", how: "Easy walk if you like, plus 10 minutes of calf, hip and hamstring stretching. Sleep is training too." };
}

export const blocksTotal = b => b.reduce((a, x) => a + x[1], 0);
export const runSeconds = b => b.filter(x => x[0] !== "w").reduce((a, x) => a + x[1], 0);
