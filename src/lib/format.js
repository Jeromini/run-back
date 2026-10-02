import { pad } from "./dates.js";

export const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// 75 -> "1:15", 3725 -> "1:02:05"
export const mmss = s => {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600); s -= h * 3600;
  return (h ? h + ":" + pad(Math.floor(s / 60)) : Math.floor(s / 60)) + ":" + pad(s % 60);
};
// 3725 -> "1h 02m", 300 -> "5m"
export const hm = s => {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? h + "h " + pad(m) + "m" : m + "m";
};
export const UNIT_M = { mi: 1609.344, km: 1000 };
export const LB_PER_KG = 2.20462;
export const fmtPace = secPerUnit => (!secPerUnit || !isFinite(secPerUnit) || secPerUnit > 3600) ? "--:--" : mmss(secPerUnit);
export const round1 = n => Math.round(n * 10) / 10;
export const num = n => Math.round(n).toLocaleString();
