// SVG chart builders. All colours come from CSS tokens so charts follow the theme.
import { esc } from "./format.js";

const W = 520;

function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

// Bars: values may be null (no data). Highlights the last bar.
export function barChart({ labels, values, target = null, targetLabel = "", fmt = v => Math.round(v), color = "var(--accent)", height = 170, highlight = labels.length - 1 }) {
  const H = height, L = 36, R = 10, T = 16, B = 24;
  const top = niceMax(Math.max(target || 0, ...values.map(v => v || 0)) * 1.08);
  const bw = (W - L - R) / labels.length, y = v => T + (H - T - B) * (1 - v / top);
  let g = "";
  for (let i = 0; i <= 4; i++) {
    const v = top * i / 4, yy = y(v);
    g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="grid"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end">${fmt(v)}</text>`;
  }
  values.forEach((v, i) => {
    const x = L + i * bw + bw * 0.2, w = bw * 0.6;
    if (v) {
      const h = Math.max(2, (H - T - B) * v / top);
      g += `<rect x="${x.toFixed(1)}" y="${(H - B - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="5" fill="${color}" opacity="${i === highlight ? 1 : 0.45}"/>`;
    }
    g += `<text x="${(x + w / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle"${i === highlight ? ' class="hl"' : ""}>${esc(labels[i])}</text>`;
  });
  if (target) {
    const yy = y(target);
    g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="target"/>${targetLabel ? `<text x="${W - R}" y="${yy - 5}" text-anchor="end" class="target-t">${esc(targetLabel)}</text>` : ""}`;
  }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
}

// Line with an area fill; nulls break nothing, points are joined across gaps.
export function lineChart({ labels, values, target = null, targetLabel = "", fmt = v => Math.round(v), height = 180, pad = 1 }) {
  const H = height, L = 40, R = 12, T = 16, B = 24;
  const pts = values.map((v, i) => [i, v]).filter(p => p[1] != null);
  if (!pts.length) return "";
  // only stretch the scale to the target when it's near the data, or the line goes flat
  const dLo = Math.min(...pts.map(p => p[1])), dHi = Math.max(...pts.map(p => p[1]));
  const near = target != null && target >= dLo - Math.max(6, dHi - dLo) && target <= dHi + Math.max(6, dHi - dLo);
  if (!near) target = null;
  const all = pts.map(p => p[1]).concat(target != null ? [target] : []);
  let lo = Math.min(...all) - pad, hi = Math.max(...all) + pad;
  if (hi - lo < 4) { const m = (hi + lo) / 2; lo = m - 2; hi = m + 2; }
  const step = (W - L - R) / Math.max(1, labels.length - 1);
  const X = i => L + i * step, Y = v => T + (H - T - B) * (hi - v) / (hi - lo);
  let g = "";
  for (let i = 0; i <= 4; i++) {
    const v = lo + (hi - lo) * i / 4, yy = Y(v);
    g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="grid"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end">${fmt(v)}</text>`;
  }
  labels.forEach((l, i) => { if (labels.length <= 8 || i % Math.ceil(labels.length / 7) === 0 || i === labels.length - 1) g += `<text x="${X(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${esc(l)}</text>`; });
  if (target != null && target >= lo && target <= hi) g += `<line x1="${L}" x2="${W - R}" y1="${Y(target)}" y2="${Y(target)}" class="target"/>${targetLabel ? `<text x="${W - R}" y="${Y(target) - 5}" text-anchor="end" class="target-t">${esc(targetLabel)}</text>` : ""}`;
  const d = pts.map((p, k) => (k ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1)).join(" ");
  if (pts.length > 1) g += `<path d="${d} L${X(pts[pts.length - 1][0]).toFixed(1)} ${H - B} L${X(pts[0][0]).toFixed(1)} ${H - B} Z" class="area"/>`;
  g += `<path d="${d}" class="line"/>`;
  pts.forEach((p, k) => { g += `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${k === pts.length - 1 ? 5.5 : 3}" class="${k === pts.length - 1 ? "dot-end" : "dot"}"/>`; });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
}

// Concentric activity rings. vals: [{v, max, color}] outer to inner.
export function rings(vals, size = 116) {
  const C = size / 2, sw = size * 0.095, R = [C - sw / 2 - 1, C - sw * 1.65, C - sw * 2.8];
  let g = "";
  vals.forEach((x, i) => {
    const r = R[i], c = 2 * Math.PI * r, p = Math.min(1, x.v / x.max);
    g += `<circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="${x.color}" stroke-opacity=".16" stroke-width="${sw}"/>`;
    if (p > 0) g += `<circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="${x.color}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${C} ${C})"/>`;
  });
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Weekly goals">${g}</svg>`;
}

// Single progress ring with content in the middle.
export function ring(p, { size = 120, stroke = 12, color = "var(--accent)", inner = "" } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, C = size / 2;
  return `<div class="ringbox" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}"><circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="${color}" stroke-opacity=".15" stroke-width="${stroke}"/>
    ${p > 0 ? `<circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * Math.min(1, p)).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${C} ${C})"/>` : ""}</svg><div class="ringmid">${inner}</div></div>`;
}

// Stacked bars: series = [{ values, color }], bottom to top. barColor(i) may outline a bar (goal met / missed).
export function stackedBars({ labels, series, target = null, targetLabel = "", fmt = v => Math.round(v), height = 180, marks = [] }) {
  const H = height, L = 36, R = 10, T = 16, B = 34, totals = labels.map((_, i) => series.reduce((a, s) => a + (s.values[i] || 0), 0));
  const top = niceMax(Math.max(target || 0, ...totals) * 1.08), bw = (W - L - R) / labels.length, y = v => T + (H - T - B) * (1 - v / top);
  let g = "";
  for (let i = 0; i <= 4; i++) { const v = top * i / 4, yy = y(v); g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="grid"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end">${fmt(v)}</text>`; }
  labels.forEach((l, i) => {
    const x = L + i * bw + bw * 0.2, w = bw * 0.6;
    let acc = 0;
    series.forEach(s => {
      const v = s.values[i] || 0; if (!v) return;
      const y0 = y(acc), y1 = y(acc + v); acc += v;
      g += `<rect x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(1, y0 - y1).toFixed(1)}" fill="${s.color}"/>`;
    });
    g += `<text x="${(x + w / 2).toFixed(1)}" y="${H - 18}" text-anchor="middle"${i === labels.length - 1 ? ' class="hl"' : ""}>${esc(l)}</text>`;
    if (marks[i] != null) g += `<circle cx="${(x + w / 2).toFixed(1)}" cy="${H - 6}" r="4" fill="${marks[i] ? "var(--good)" : "var(--warn)"}" stroke="none"/>`;
  });
  if (target) { const yy = y(target); g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="target"/>${targetLabel ? `<text x="${W - R}" y="${yy - 5}" text-anchor="end" class="target-t">${esc(targetLabel)}</text>` : ""}`; }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
}
