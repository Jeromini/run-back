// The single in-memory model. Views read from it; store.js persists it.
import { today } from "../lib/dates.js";

export const DEFAULT_PROFILE = {
  displayName: "", age: null, heightCm: null, unit: "lb", dunit: "mi",
  startWeight: null, goalWeight: null, startDate: "2026-10-01", weekOffset: 0, health: "",
  voice: true, gps: true, beeps: true,
  kcalTarget: null, proteinTarget: null,
  fastPlan: "16:8", fastActive: null, // fastActive: { s: startMs, h: goalHours }
  crewId: null, badges: null
};

export const state = {
  profile: { ...DEFAULT_PROFILE },
  days: {},           // "YYYY-MM-DD" -> day record
  view: "today",
  sel: today(),       // selected day on Today
  trendsTab: "overview"
};

// Session facts shared across modules (who is signed in, Premium status).
export const S = { uid: null, email: "", localOnly: false, pro: false, proInfo: null, workoutLive: false };

export function day(date) { return state.days[date] || (state.days[date] = { date }); }

let renderer = () => {};
export const setRenderer = fn => { renderer = fn; };
export const render = () => renderer();
