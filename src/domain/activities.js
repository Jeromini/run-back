// Activity catalogue for cardio, sport and classes. Energy uses METs at three intensities
// (easy / moderate / hard), from the Compendium of Physical Activities, rounded:
//   kcal = MET x body weight (kg) x hours
// gps: distance and pace make sense outdoors. run: counts as a run toward the weekly plan.
export const GROUPS = [
  ["run", "Running & walking"], ["cycle", "Cycling"], ["machine", "Gym machines"], ["water", "Water"],
  ["class", "Classes & HIIT"], ["sport", "Sports"], ["mind", "Yoga & mobility"], ["outdoor", "Outdoors"]
];

// [id, name, group, [easy, moderate, hard] METs, flags]
const RAW = [
  ["run-out", "Running (outdoor)", "run", [8.3, 9.8, 11.5], { gps: true, run: true }],
  ["run-tread", "Treadmill run", "run", [8.3, 9.8, 11.5], { run: true, distance: true }],
  ["walk-out", "Walking (outdoor)", "run", [3, 3.8, 5], { gps: true }],
  ["walk-tread", "Treadmill walk", "run", [3, 3.8, 5], { distance: true }],
  ["walk-incline", "Incline treadmill walk", "run", [5, 6.5, 8.5], { distance: true }],
  ["hike", "Hiking", "outdoor", [5.3, 6.5, 7.8], { gps: true }],
  ["trail-run", "Trail running", "run", [9, 10.5, 12.5], { gps: true, run: true }],
  ["cycle-out", "Cycling (outdoor)", "cycle", [5.8, 8, 10], { gps: true }],
  ["mtb", "Mountain biking", "cycle", [7, 8.5, 11], { gps: true }],
  ["spin", "Spin / indoor cycling class", "cycle", [6.8, 8.5, 11] , {}],
  ["bike-stat", "Stationary bike", "cycle", [5.5, 7, 10.5], { distance: true }],
  ["bike-air", "Air / assault bike", "cycle", [7, 9, 12], {}],
  ["elliptical", "Elliptical / cross-trainer", "machine", [5, 6.5, 8], { distance: true }],
  ["stairs", "Stair climber / StairMaster", "machine", [6, 9, 11], {}],
  ["climber", "Climbing machine (VersaClimber)", "machine", [8, 10, 12], {}],
  ["rower", "Rowing machine", "machine", [4.8, 7, 8.5], { distance: true }],
  ["skierg", "Ski erg", "machine", [6, 8, 10], { distance: true }],
  ["arc", "Arc trainer", "machine", [5, 7, 9], {}],
  ["swim", "Swimming (pool)", "water", [5.8, 8.3, 10], { distance: true }],
  ["swim-open", "Open-water swimming", "water", [6, 8, 10], { gps: true }],
  ["aqua", "Aqua aerobics", "water", [4, 5.5, 6.5], {}],
  ["kayak", "Kayaking / canoeing", "water", [3.5, 5, 8], { gps: true }],
  ["sup", "Stand-up paddleboarding", "water", [4, 6, 7], { gps: true }],
  ["surf", "Surfing", "water", [3, 5, 6], {}],
  ["hiit", "HIIT / circuit training", "class", [6, 8, 10], {}],
  ["bootcamp", "Bootcamp / CrossFit", "class", [6, 8, 10], {}],
  ["jump-rope", "Jump rope", "class", [8.8, 11, 12.3], {}],
  ["boxing", "Boxing / kickboxing", "class", [5.5, 7.8, 10], {}],
  ["martial", "Martial arts", "class", [5, 7.5, 10], {}],
  ["dance", "Dance / Zumba", "class", [5, 6.5, 7.8], {}],
  ["aerobics", "Aerobics / step class", "class", [5, 7, 8.5], {}],
  ["weights", "Weight training (general)", "class", [3.5, 5, 6], {}],
  ["yoga", "Yoga", "mind", [2.5, 3, 4], {}],
  ["pilates", "Pilates", "mind", [3, 3.5, 4.5], {}],
  ["stretch", "Stretching / mobility", "mind", [2.3, 2.3, 2.8], {}],
  ["football", "Football / soccer", "sport", [7, 8, 10], {}],
  ["basketball", "Basketball", "sport", [6, 6.5, 8], {}],
  ["tennis", "Tennis", "sport", [5, 7.3, 8], {}],
  ["padel", "Padel", "sport", [5, 6, 7], {}],
  ["squash", "Squash", "sport", [7.3, 9, 12], {}],
  ["badminton", "Badminton", "sport", [5.5, 6, 7], {}],
  ["volleyball", "Volleyball / beach volleyball", "sport", [3, 4, 8], {}],
  ["cricket", "Cricket", "sport", [4.8, 5, 6], {}],
  ["golf", "Golf (walking)", "sport", [4.3, 4.8, 5.3], {}],
  ["netball", "Netball", "sport", [5.5, 7, 8], {}],
  ["climbing", "Rock climbing / bouldering", "outdoor", [5.8, 7.5, 8], {}],
  ["skate", "Skating / rollerblading", "outdoor", [5, 7.5, 9.8], { gps: true }],
  ["ski", "Skiing (downhill)", "outdoor", [4.3, 5.3, 8], {}],
  ["xc-ski", "Cross-country skiing", "outdoor", [7, 9, 12.5], { gps: true }],
  ["garden", "Gardening / yard work", "outdoor", [3.5, 4, 5], {}]
];
export const ACTIVITIES = RAW.map(([id, name, group, mets, f]) => ({ id, name, group, mets, gps: !!f.gps, run: !!f.run, distance: !!(f.distance || f.gps) }));
export const activityById = id => ACTIVITIES.find(a => a.id === id) || null;
export const INTENSITY = [[0, "Easy", "Can chat in full sentences"], [1, "Moderate", "Short sentences only"], [2, "Hard", "A few words at a time"]];

export const activityKcal = (a, intensity, minutes, kg) => (a && kg ? Math.round(a.mets[intensity ?? 1] * kg * minutes / 60) : 0);

// Older logs stored a free-text crossType; map it to the catalogue where possible.
export function legacyType(t) {
  const s = (t || "").toLowerCase();
  if (/cycl/.test(s)) return "cycle-out";
  if (/swim/.test(s)) return "swim";
  if (/row/.test(s)) return "rower";
  if (/walk/.test(s)) return "walk-out";
  return null;
}

export function searchActivities(q) {
  const w = q.toLowerCase().trim();
  return w ? ACTIVITIES.filter(a => (a.name + " " + a.group).toLowerCase().includes(w)) : ACTIVITIES;
}
