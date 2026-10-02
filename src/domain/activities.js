// Activity catalogue for cardio, sport and classes. Energy uses METs at three intensities
// (easy / moderate / hard), from the Compendium of Physical Activities, rounded:
//   kcal = MET x body weight (kg) x hours
// gps: distance and pace make sense outdoors. run: counts as a run toward the weekly plan.
export const GROUPS = [
  ["machine", "Gym cardio machines"], ["run", "Running & walking (outdoors)"], ["cycle", "Cycling (outdoors & classes)"], ["water", "Water"],
  ["class", "Classes, HIIT & functional"], ["sport", "Sports"], ["mind", "Yoga & mobility"], ["outdoor", "Outdoors & other"]
];

// [id, name, group, [easy, moderate, hard] METs, flags]
const RAW = [
  // ---- gym cardio machines ----
  ["run-tread", "Treadmill run", "machine", [8.3, 9.8, 11.5], { run: true, distance: true }],
  ["tread-intervals", "Treadmill intervals / sprints", "machine", [9, 11, 13], { run: true, distance: true }],
  ["walk-tread", "Treadmill walk", "machine", [3, 3.8, 5], { distance: true }],
  ["walk-incline", "Incline treadmill walk (12-3-30 style)", "machine", [5, 6.5, 8.5], { distance: true }],
  ["tread-curved", "Curved / manual treadmill (Assault Runner, Woodway)", "machine", [7, 10, 12.5], { run: true, distance: true }],
  ["treadclimber", "TreadClimber", "machine", [5, 6.5, 8], {}],
  ["elliptical", "Elliptical / cross-trainer", "machine", [5, 6.5, 8], { distance: true }],
  ["amt", "Adaptive motion trainer (Precor AMT)", "machine", [5, 7, 9], {}],
  ["lateral", "Lateral trainer (side-to-side elliptical)", "machine", [5, 7, 9], {}],
  ["arc", "Arc trainer", "machine", [5, 7, 9], {}],
  ["stairs", "Stair climber / StairMaster", "machine", [6, 9, 11], {}],
  ["stepmill", "StepMill (revolving staircase)", "machine", [7, 9, 11], {}],
  ["stepper", "Stepper (pedal step machine)", "machine", [4.5, 6, 8], {}],
  ["climber", "Climbing machine (VersaClimber)", "machine", [8, 10, 12], {}],
  ["jacobs", "Jacob's Ladder", "machine", [7, 9, 11], {}],
  ["rope-climber", "Rope climber (endless rope)", "machine", [6, 8, 10], {}],
  ["rower", "Rowing machine", "machine", [4.8, 7, 8.5], { distance: true }],
  ["skierg", "Ski erg", "machine", [6, 8, 10], { distance: true }],
  ["bike-stat", "Upright stationary bike", "machine", [5.5, 7, 10.5], { distance: true }],
  ["bike-recumbent", "Recumbent bike", "machine", [4, 5.5, 8], { distance: true }],
  ["bike-erg", "Bike erg (Concept2 BikeErg)", "machine", [5.5, 7, 10.5], { distance: true }],
  ["bike-air", "Air / assault bike (Echo, Assault)", "machine", [7, 9, 12], {}],
  ["arm-bike", "Arm bike / upper-body ergometer", "machine", [2.8, 4, 6], {}],
  ["nustep", "Recumbent cross-trainer (NuStep)", "machine", [3, 4.5, 6], {}],
  ["sled", "Sled push / pull (prowler)", "machine", [6, 8, 10], {}],
  ["battle-ropes", "Battle ropes", "machine", [6, 8, 10.3], {}],
  ["wall-climb", "Rotating climbing wall / treadwall", "machine", [6, 8, 9.5], {}],
  // ---- running & walking outdoors ----
  ["run-out", "Running (outdoor)", "run", [8.3, 9.8, 11.5], { gps: true, run: true }],
  ["trail-run", "Trail running", "run", [9, 10.5, 12.5], { gps: true, run: true }],
  ["track", "Track session / sprints", "run", [9, 11, 14], { gps: true, run: true }],
  ["walk-out", "Walking (outdoor)", "run", [3, 3.8, 5], { gps: true }],
  ["stairs-real", "Stair climbing (real stairs or stadium)", "run", [6, 8, 9.5], {}],
  ["hike", "Hiking", "outdoor", [5.3, 6.5, 7.8], { gps: true }],
  // ---- cycling outdoors & classes ----
  ["cycle-out", "Cycling (outdoor)", "cycle", [5.8, 8, 10], { gps: true }],
  ["mtb", "Mountain biking", "cycle", [7, 8.5, 11], { gps: true }],
  ["ebike", "E-bike riding", "cycle", [4, 5, 6.5], { gps: true }],
  ["spin", "Spin / indoor cycling class (Peloton, SoulCycle)", "cycle", [6.8, 8.5, 11], {}],
  ["swim", "Swimming (pool)", "water", [5.8, 8.3, 10], { distance: true }],
  ["swim-open", "Open-water swimming", "water", [6, 8, 10], { gps: true }],
  ["aqua", "Aqua aerobics", "water", [4, 5.5, 6.5], {}],
  ["kayak", "Kayaking / canoeing", "water", [3.5, 5, 8], { gps: true }],
  ["sup", "Stand-up paddleboarding", "water", [4, 6, 7], { gps: true }],
  ["surf", "Surfing", "water", [3, 5, 6], {}],
  ["hiit", "HIIT / circuit training", "class", [6, 8, 10], {}],
  ["kettlebell", "Kettlebell workout", "class", [6, 8, 9.8], {}],
  ["rebounder", "Mini trampoline / rebounder", "class", [3.5, 4.5, 6], {}],
  ["barre", "Barre class", "class", [3, 4, 5], {}],
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
