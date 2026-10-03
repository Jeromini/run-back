// Fasting: plans, stages, history stats and the Fast + Train coach. Pure functions.
// Stage wording sticks to well-established physiology and avoids exact-hour claims about
// autophagy, growth hormone or immunity, which the evidence does not support.
import { FAST_PLANS, CUSTOM_FAST } from "../config.js";
import { clock, dayClock } from "../lib/dates.js";
import { fastsOf } from "./metrics.js";

const H = 3600000;
export const planById = id => FAST_PLANS.find(p => p.id === id) || FAST_PLANS.find(p => p.id === "16:8");
// The plan in force for a profile, resolving "custom" to the user's chosen length.
export function planFor(profile) {
  const p = planById(profile.fastPlan);
  if (p.id !== "custom") return p;
  const h = Math.max(CUSTOM_FAST.min, Math.min(CUSTOM_FAST.max, Math.round(profile.fastCustomH || 24)));
  return { ...p, hours: h, label: h % 24 === 0 && h >= 48 ? h / 24 + " days" : h + " h" };
}
export const EXTENDED_H = 36;        // from here the app shows the extended-fast checklist
export const SUPERVISED_H = 72;      // beyond this, medical supervision is advised

// What happens in the body as a fast goes on. Timings are typical for a healthy adult and
// vary with diet, activity and body composition. Wording sticks to what human studies show;
// where evidence is mainly from animals (autophagy), it says so.
export const STAGES = [
  { from: 0, name: "Digesting", text: "Your last meal is being absorbed and your body runs mainly on that food.",
    changes: ["Blood sugar and insulin are raised after eating", "Nutrients are being stored as glycogen and fat"] },
  { from: 4, name: "Blood sugar settling", text: "Insulin drifts back towards baseline and your body starts drawing on stored energy.",
    changes: ["Insulin falls, glucagon rises", "Liver glycogen starts supplying blood sugar", "Fat release from fat cells begins to increase"] },
  { from: 12, name: "Fat-burning shift", text: "With liver glycogen running lower, a larger share of your energy comes from fat.",
    changes: ["Fat becomes a bigger share of the fuel mix", "Hunger comes in waves around usual meal times and passes in 15-20 minutes", "Water and black coffee or tea are fine"] },
  { from: 18, name: "Ketosis begins", text: "Your liver starts turning fat into ketones, an alternative fuel for muscles and brain.",
    changes: ["Ketones begin to rise in the blood", "Many people notice steadier energy once past the hunger waves", "Keep training easy unless you have eaten"] },
  { from: 24, name: "Glycogen largely used", text: "Liver glycogen is mostly depleted, so your body makes the glucose it needs from other sources.",
    changes: ["Gluconeogenesis: glucose made from glycerol, lactate and some amino acids", "Ketones commonly around 0.5 mmol/L", "Salt and water loss rise: add electrolytes", "Skip hard training from here on"] },
  { from: 36, name: "Fat-adapted", text: "Fat and ketones are now your main fuel, and the brain is starting to use ketones meaningfully.",
    changes: ["Ketones typically 1 mmol/L or more", "Headaches or low energy usually mean you need more salt and water", "Sleep can be lighter"] },
  { from: 48, name: "Hormone shift", text: "Studies of 2-day fasts show growth hormone rising several-fold, which helps protect muscle while fat is used.",
    changes: ["Growth hormone rises markedly", "Insulin at its lowest", "Many people find hunger eases as hunger hormones settle", "Feeling dizzy on standing is a sign to break the fast"] },
  { from: 72, name: "Deep ketosis", text: "Ketones are high and supply a large share of the brain's energy. In animal studies cell recycling (autophagy) is strongly raised by now; in humans the timing isn't established.",
    changes: ["Ketones often 2-4 mmol/L", "Beyond 3 days, fasting should be medically supervised", "Break the fast gently: small, protein-led meals first"] },
  { from: 96, name: "Prolonged fast", text: "Only under medical supervision. The longer the fast, the higher the risk from electrolyte imbalance and from refeeding too quickly.",
    changes: ["Electrolyte levels need monitoring", "Refeeding syndrome is a real risk after 5 or more days", "Reintroduce food over 1-2 days"] }
];
export function stageAt(hours) {
  let s = STAGES[0];
  for (const st of STAGES) if (hours >= st.from) s = st;
  const next = STAGES[STAGES.indexOf(s) + 1] || null;
  return { ...s, next, nextIn: next ? next.from - hours : null };
}

// A completed fast is stored on the day it ended: day.fasts = [{ s, e, g }] (ms, ms, goal hours).
export function allFasts(days) {
  const out = [];
  Object.values(days).forEach(d => fastsOf(d).forEach(f => out.push({ ...f, date: d.date })));
  return out.sort((a, b) => b.e - a.e);
}
export function fastStats(days) {
  const fs = allFasts(days);
  if (!fs.length) return { count: 0, avg: 0, longest: 0, hitRate: 0, total: 0 };
  const hrs = fs.map(f => (f.e - f.s) / H);
  const total = hrs.reduce((a, b) => a + b, 0);
  return {
    count: fs.length, total, avg: total / fs.length, longest: Math.max(...hrs),
    hitRate: fs.filter(f => (f.e - f.s) / H >= f.g - 0.01).length / fs.length
  };
}

// Daily plans leave (24 - fast) hours to eat; after a fast of a day or more, allow a full day of eating.
const eatGap = h => (h >= 24 ? 24 : Math.max(1, 24 - h));
// When the eating window opens and closes, and when the next fast should start.
export function windowFor(active, lastFast, planHours, now = Date.now()) {
  if (active) {
    const goalAt = active.s + active.h * H;
    return { fasting: true, goalAt, opensAt: goalAt, closesAt: goalAt + eatGap(active.h) * H };
  }
  if (lastFast) {
    const closesAt = lastFast.e + eatGap(planHours) * H;
    return { fasting: false, opensAt: lastFast.e, closesAt, nextFastAt: closesAt, overdue: now > closesAt };
  }
  return { fasting: false, opensAt: null, closesAt: null, nextFastAt: null };
}

// The Fast + Train coach: when to train today, given the fast and the session.
// Returns { tone: "good" | "caution" | "stop" | "info", title, body, slot? }.
export function coach({ session, done, active, lastFast, planHours, now = Date.now() }) {
  const kind = session.kind, training = kind === "run" || kind === "cross";
  const hard = !!session.hard;
  const el = active ? (now - active.s) / H : 0;
  const w = windowFor(active, lastFast, planHours, now);

  if (!training) {
    if (kind === "rest") return { tone: "info", title: "Rest day: a good day for your full fast", body: "No training load today, so it's the easiest day to reach your fasting goal. Keep moving with an easy walk." };
    return { tone: "info", title: "Plan not started yet", body: "Once your plan starts, I'll time each session around your fast." };
  }
  if (done) return { tone: "good", title: "Session done. Now refuel well", body: "Make your next meal count: about 30-40 g of protein plus some carbs helps your legs recover for the next run." };

  if (active) {
    if (el >= 24) return { tone: "stop", title: "Eat before you train today", body: `You're ${Math.floor(el)} hours into a fast. Training this deep into a fast raises the risk of dizziness and poor recovery. Break the fast, wait 1-2 hours, then do your session.` };
    if (hard) return { tone: "caution", title: "Hard session: train in your eating window", body: `Today's session has faster efforts. Quality is better fed: train 2-3 hours after your first meal, around ${clock(w.opensAt + 2.5 * H)}.`, slot: w.opensAt + 2.5 * H };
    if (el >= 20) return { tone: "caution", title: "Keep it easy and short, or eat first", body: "You're 20+ hours in. An easy session is fine if you feel good, but stop if you feel light-headed and eat soon after." };
    if (now >= w.goalAt) return { tone: "good", title: "Fasting goal reached: a good time for easy training", body: "Do your easy session now and break the fast within an hour after it, with protein and carbs.", slot: now };
    const slot = Math.max(now, w.goalAt - 1.5 * H);
    return { tone: "good", title: `Best time to train: ${dayClock(slot, now)}`, body: `Easy work suits the last hour or two of your fast. Train around ${clock(slot)}, then break your fast at ${clock(w.goalAt)} with protein and carbs within an hour.`, slot };
  }
  // eating window
  if (w.closesAt && now < w.closesAt) {
    const latest = w.closesAt - 2 * H;
    return now < latest
      ? { tone: "good", title: "You're in your eating window: good time to train", body: `Eat 1-3 hours before if you can, and finish with a protein-rich meal before your window closes at ${clock(w.closesAt)}.`, slot: now }
      : { tone: "caution", title: "Window closes soon: eat after you train", body: `Your eating window closes at ${clock(w.closesAt)}. If you train now, have your recovery meal right after, even if it runs a little past the window.` };
  }
  return { tone: "info", title: hard ? "Hard session: train fed" : "Train when it suits you", body: hard ? "Have a meal 2-3 hours before today's faster efforts." : "Easy sessions work fasted or fed. Start a fast to get a timed recommendation." };
}
