// Small DOM toolkit: one delegated listener per event type, so views can re-render freely.
//   <button data-act="fast-start">  ->  act("fast-start", (el, ev) => ...)
//   <input data-in="water-ml">      ->  onInput("water-ml", (el, ev) => ...)
//   <select data-chg="plan">        ->  onChange("plan", (el, ev) => ...)
import { esc } from "./format.js";

export const $ = id => document.getElementById(id);

const handlers = { click: {}, input: {}, change: {} };
export const act = (name, fn) => { handlers.click[name] = fn; };
export const onInput = (name, fn) => { handlers.input[name] = fn; };
export const onChange = (name, fn) => { handlers.change[name] = fn; };

const ATTR = { click: "act", input: "in", change: "chg" };
for (const type of Object.keys(handlers)) {
  document.addEventListener(type, ev => {
    const el = ev.target.closest && ev.target.closest(`[data-${ATTR[type]}]`);
    if (!el || el.disabled) return;
    const fn = handlers[type][el.dataset[ATTR[type]]];
    if (fn) fn(el, ev);
  });
}

// Two-tap confirmation for destructive buttons, with no dialogs.
const armed = new Map();
export function confirmTap(key, el, label = "Tap again to confirm") {
  if (armed.get(key)) { armed.delete(key); return true; }
  armed.set(key, true);
  const prev = el.innerHTML;
  el.classList.add("armed"); el.textContent = label;
  setTimeout(() => { if (armed.get(key)) { armed.delete(key); if (el.isConnected) { el.classList.remove("armed"); el.innerHTML = prev; } } }, 3000);
  return false;
}

// The toast stays in the page (hidden visually) so screen readers announce each new message.
let toastT, toastW;
export function toast(msg, kind = "") {
  const t = $("toast");
  t.textContent = ""; t.className = "toast " + kind;
  clearTimeout(toastW); toastW = setTimeout(() => { t.textContent = msg; t.classList.add("show"); }, 30);
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), Math.max(2800, Math.min(6000, String(msg).length * 60)));
}

// Background content goes inert while a dialog is open, so focus and screen readers stay inside it.
const BG = ["#main", "header.top", "#tabs", "#fab"];
export function setInert(on) {
  BG.forEach(sel => { const el = document.querySelector(sel); if (el) { if (on) el.setAttribute("inert", ""); else el.removeAttribute("inert"); } });
}
// Put focus back where it was before a dialog opened, or on the page.
export function restoreFocus(el) {
  if (el && el.isConnected && el.focus && !el.closest("[inert]")) { el.focus({ preventScroll: true }); return; }
  const m = $("main"); if (m) { m.setAttribute("tabindex", "-1"); m.focus({ preventScroll: true }); }
}

// Full-screen sheet used for details, guides, the calendar and the paywall.
const sheetStack = [];
let sheetReturn = null;
export function openSheet({ title = "", html = "", onClose, cls = "" }) {
  const s = $("sheet");
  if (s.hidden) sheetReturn = document.activeElement;
  sheetStack.push(onClose || null);
  $("sh-title").textContent = title;
  $("sh-body").innerHTML = html;
  s.className = "sheet " + cls;
  s.hidden = false; s.scrollTop = 0;
  document.body.classList.add("locked"); setInert(true);
  // move focus into the dialog, unless something inside it has already taken focus
  setTimeout(() => {
    if (s.hidden || s.contains(document.activeElement)) return;
    const b = $("sh-back"), f = b && b.offsetParent ? b : s.querySelector("button, input, textarea, select, a[href]");
    if (f) f.focus({ preventScroll: true });
  }, 0);
  return $("sh-body");
}
export function closeSheet() {
  const s = $("sheet");
  if (s.hidden) return;
  const fn = sheetStack.pop();
  s.hidden = true; document.body.classList.remove("locked"); setInert(false);
  if (fn) fn();
  // the close handler may open another sheet; only hand focus back once it's really closed
  setTimeout(() => { if (!$("sheet").hidden) return; const r = sheetReturn; sheetReturn = null; restoreFocus(r); }, 0);
}
export const sheetOpen = () => !$("sheet").hidden;

export function segHtml(id, opts, val, attrs = "") {
  return `<div class="seg" id="${id}" role="group" ${attrs}>${opts.map(o =>
    `<button type="button" data-v="${esc(o[0])}" class="${String(val) === String(o[0]) ? "on" : ""}" aria-pressed="${String(val) === String(o[0])}"${o[2] ? ` data-pro="1"` : ""}>${o[1]}${o[2] ? ` <i class="lock" aria-hidden="true">${ICON.lock}</i><span class="sr-only">(Premium)</span>` : ""}</button>`).join("")}</div>`;
}

export const typing = () => { const a = document.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); };

export const ICON = {
  lock: `<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
  play: `<svg viewBox="0 0 24 24" class="fill"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" class="fill"><rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/></svg>`,
  tick: `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  trash: `<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>`,
  back: `<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>`,
  next: `<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  user: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
  water: `<svg viewBox="0 0 24 24"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>`,
  flame: `<svg viewBox="0 0 24 24"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.4-4.6.3 1.6 1.2 2.6 2.1 2.6C11.5 8.7 11 6 12 3z"/></svg>`,
  scale: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9a5 5 0 0 1 8 0M12 9l1.5-2"/></svg>`,
  run: `<svg viewBox="0 0 24 24"><circle cx="13.5" cy="4" r="2"/><path d="M7 21l3-6 3 2v5M10 15l1-5 4 3 3-1M11 10l-3 1-2 3"/></svg>`,
  timer: `<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2h5M12 2v3"/></svg>`,
  food: `<svg viewBox="0 0 24 24"><path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8a2 2 0 0 1-2 2M9 3v6M17 21V3c-2 1-3 4-3 8h3"/></svg>`,
  chart: `<svg viewBox="0 0 24 24"><path d="M4 20V11M10 20V5M16 20v-6M22 20H2"/></svg>`,
  crew: `<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 14.2A5.5 5.5 0 0 1 22 20"/></svg>`,
  book: `<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>`,
  dumbbell: `<svg viewBox="0 0 24 24"><path d="M7 12h10M5 8v8M3 10v4M19 8v8M21 10v4"/></svg>`,
  star: `<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>`,
  share: `<svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>`,
  cal: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>`,
  edit: `<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/></svg>`,
  plus: `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
  minus: `<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>`,
  contrast: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>`,
  mind: `<svg viewBox="0 0 24 24"><path d="M12 20.5c-4.2-2.2-7-5.6-7-9.3C5 8.3 7.2 6.5 9.6 6.5c1.1 0 1.9.4 2.4 1 .5-.6 1.3-1 2.4-1 2.4 0 4.6 1.8 4.6 4.7 0 3.7-2.8 7.1-7 9.3z"/><path d="M12 8.5v11"/></svg>`,
  flag: `<svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>`,
  search: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>`
};
