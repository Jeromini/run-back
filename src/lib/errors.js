// Crash reports: uncaught errors and rejected promises are sent to public.client_errors
// (insert-only for the signed-in user). Capped per session so a loop can't flood it.
const MAX = 5, seen = new Set();
let sent = 0, client = null, who = () => null, where = () => "";

export function initErrorReporting(sb, getUid, getView) {
  client = sb; who = getUid; where = getView;
  window.addEventListener("error", e => report(e.message, e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : "", e.error && e.error.stack));
  window.addEventListener("unhandledrejection", e => { const r = e.reason || {}; report(r.message || String(r), "promise", r.stack); });
}

export function report(message, source = "", stack = "") {
  try {
    const msg = String(message || "Unknown error").slice(0, 500), key = msg + source;
    // ignore noise the app can't act on
    if (!client || !who() || sent >= MAX || seen.has(key) || /ResizeObserver loop|Script error\.?$/.test(msg)) return;
    seen.add(key); sent++;
    client.from("client_errors").insert({
      message: msg, source: String(source || "").slice(0, 300), stack: String(stack || "").slice(0, 4000),
      view: String(where() || "").slice(0, 40), app_version: (typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : ""), ua: navigator.userAgent.slice(0, 300)
    }).then(() => {}, () => {});
  } catch (e) { /* reporting must never throw */ }
}
