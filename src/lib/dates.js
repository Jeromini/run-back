// Local-calendar date helpers. Dates in storage are "YYYY-MM-DD" strings in the user's time zone.
export const pad = n => String(n).padStart(2, "0");
export const iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
export const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const daysBetween = (a, b) => Math.round((parse(iso(b)) - parse(iso(a))) / 86400000);
export const today = () => iso(new Date());

export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DOWL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const nice = s => { const d = parse(s); return DOW[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()]; };
export const shortDate = d => d.getDate() + " " + MON[d.getMonth()];

// Plan weeks run Thursday to Wednesday (the plan started on a Thursday).
export const weekStart = s => { const d = parse(s); return addDays(d, -((d.getDay() - 4 + 7) % 7)); };

export function clock(ts) {
  const d = new Date(ts);
  let h = d.getHours(); const m = pad(d.getMinutes()), am = h < 12;
  h = h % 12 || 12;
  return h + ":" + m + (am ? " am" : " pm");
}
export function dayClock(ts, ref = Date.now()) {
  const a = iso(new Date(ts)), b = iso(new Date(ref));
  if (a === b) return clock(ts);
  if (a === iso(addDays(new Date(ref), 1))) return "Tomorrow " + clock(ts);
  if (a === iso(addDays(new Date(ref), -1))) return "Yesterday " + clock(ts);
  return nice(a) + " " + clock(ts);
}
// value for <input type="datetime-local">
export const localInput = ts => { const d = new Date(ts); return iso(d) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()); };
