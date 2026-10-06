// Offline-first sync. Supabase is the record; localStorage is a cache plus a queue of unsent
// changes ("dirty"), so anything logged with no signal is sent the next time the phone is online.
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "../config.js";
import { state, S, DEFAULT_PROFILE, render } from "./state.js";
import { $, typing } from "../lib/dom.js";

export const sb = (() => {
  try { return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } }); }
  catch (e) { return null; }
})();

let dirty = {}, seq = Date.now(), flushT = null, flushing = false, failures = 0, storageOk = true, flushedAt = 0;
const pulledCbs = [];
// runs after each successful pull from the server, once the real profile is in memory
export const onPulled = fn => pulledCbs.push(fn);
const lsKey = () => "runback.v2:" + (S.uid || "local");

export function lsLoad() {
  state.profile = { ...DEFAULT_PROFILE }; state.days = {}; dirty = {};
  try {
    const j = JSON.parse(localStorage.getItem(lsKey()) || "null");
    if (j) { state.profile = { ...DEFAULT_PROFILE, ...j.profile }; state.days = j.days || {}; dirty = j.dirty || {}; }
  } catch (e) { /* storage blocked */ }
}
// Returns false (and warns once) when the phone refuses to store the data, so nothing pretends to be saved.
export function lsSave() {
  try { localStorage.setItem(lsKey(), JSON.stringify({ profile: state.profile, days: state.days, dirty })); storageOk = true; return true; }
  catch (e) {
    if (storageOk) {
      storageOk = false;
      import("../lib/dom.js").then(({ toast }) => toast("This phone's storage is full or blocked: recent changes may not be saved here. They'll still sync while you're online.", "warn"));
      import("../lib/errors.js").then(({ report }) => report("localStorage save failed: " + (e && e.name), "store.lsSave"));
    }
    return false;
  }
}
export function readLocal(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } }

function markDirty(id) { dirty[id] = ++seq; lsSave(); clearTimeout(flushT); flushT = setTimeout(flush, 600); }
export const saveProfile = () => markDirty("profile");
// True once this account's profile has come back from the server (or when the app runs without an account).
// Automatic bookkeeping waits for this so it can never push a blank profile over the real one.
let pulledFor = null;
export const profileReady = () => S.localOnly || (!!S.uid && pulledFor === S.uid);
export const saveDay = date => markDirty(date);
export const hasPending = () => Object.keys(dirty).length > 0;
export function markAllDirty() { Object.keys(state.days).forEach(d => (dirty[d] = ++seq)); dirty.profile = ++seq; lsSave(); }

export async function flush() {
  if (!sb || !S.uid || flushing) return;
  const ids = Object.keys(dirty);
  if (!ids.length) { setSync("ok"); return; }
  if (!navigator.onLine) { setSync("offline"); return; }
  flushing = true;
  try {
    const now = new Date().toISOString(), sent = { ...dirty };
    const clear = id => { if (dirty[id] === sent[id]) delete dirty[id]; };
    if (sent.profile) {
      const { error } = await sb.from("profiles").upsert({ user_id: S.uid, data: state.profile, updated_at: now });
      if (error) throw error;
      clear("profile");
    }
    const keep = ids.filter(id => id !== "profile");
    const rows = keep.filter(id => state.days[id]).map(id => ({ user_id: S.uid, date: id, data: state.days[id], updated_at: now }));
    const gone = keep.filter(id => !state.days[id]);
    if (rows.length) { const { error } = await sb.from("day_logs").upsert(rows); if (error) throw error; rows.forEach(r => clear(r.date)); }
    for (const id of gone) { const { error } = await sb.from("day_logs").delete().eq("user_id", S.uid).eq("date", id); if (error) throw error; clear(id); }
    lsSave(); failures = 0; flushedAt = Date.now(); setSync(hasPending() ? "offline" : "ok");
  } catch (e) {
    failures++;
    // an expired session or a server rejection is not "offline": say so, report it, and back off
    if (failures === 1 || failures === 5) import("../lib/errors.js").then(({ report }) => report("sync failed: " + ((e && (e.message || e.code)) || e), "store.flush"));
    setSync(failures >= 3 && navigator.onLine ? "problem" : "offline");
  }
  flushing = false;
  if (hasPending() && navigator.onLine) { clearTimeout(flushT); flushT = setTimeout(flush, Math.min(60000, 1500 * 2 ** Math.min(failures, 6))); }
}

// Every day row for this account, a page at a time (the server returns at most 1000 rows per request).
async function allDays() {
  const out = [], size = 1000;
  for (let from = 0; ; from += size) {
    const r = await sb.from("day_logs").select("date,data").eq("user_id", S.uid).order("date").range(from, from + size - 1);
    if (r.error) return r;
    out.push(...(r.data || []));
    if (!r.data || r.data.length < size) return { data: out, error: null };
  }
}

export async function pull() {
  if (!sb || !S.uid || !navigator.onLine || S.workoutLive) return;
  // don't race a save that's in flight: try again once it's done
  if (flushing) { setTimeout(pull, 800); return; }
  const startedAt = Date.now();
  try {
    const [p, d] = await Promise.all([
      sb.from("profiles").select("data").eq("user_id", S.uid).maybeSingle(),
      allDays()
    ]);
    if (p.error || d.error) throw p.error || d.error;
    // a save finished while we were fetching: the server copy we got may be older than this phone's
    if (flushedAt > startedAt || flushing) { setTimeout(pull, 800); return; }
    if (p.data && !dirty.profile) state.profile = { ...DEFAULT_PROFILE, ...p.data.data };
    pulledFor = S.uid;
    const days = {};
    (d.data || []).forEach(r => { days[r.date] = { ...r.data, date: r.date }; });
    // keep local edits that have not reached the server yet
    Object.keys(dirty).forEach(id => { if (id !== "profile") { if (state.days[id]) days[id] = state.days[id]; else delete days[id]; } });
    state.days = days;
    if (!p.data) dirty.profile = ++seq;
    lsSave();
    if (!typing()) render();
    pulledCbs.forEach(fn => fn());
    flush();
  } catch (e) { setSync("offline"); }
}

export function setSync(m) {
  const el = $("sync");
  if (!el) return;
  if (S.localOnly) m = "local";
  el.className = "sync " + (m === "ok" ? "ok" : (m === "local" || m === "offline") ? "warn" : m === "problem" ? "bad" : "");
  el.title = m === "ok" ? "All changes synced" : m === "offline" ? "Offline: changes will sync when you reconnect" : m === "local" ? "Saved on this phone only"
    : m === "problem" ? "Sync problem: changes are saved on this phone but haven't reached your account. Try signing out and in again." : "Connecting";
  el.setAttribute("aria-label", el.title);
}
