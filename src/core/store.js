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

let dirty = {}, seq = Date.now(), flushT = null, flushing = false;
const lsKey = () => "runback.v2:" + (S.uid || "local");

export function lsLoad() {
  state.profile = { ...DEFAULT_PROFILE }; state.days = {}; dirty = {};
  try {
    const j = JSON.parse(localStorage.getItem(lsKey()) || "null");
    if (j) { state.profile = { ...DEFAULT_PROFILE, ...j.profile }; state.days = j.days || {}; dirty = j.dirty || {}; }
  } catch (e) { /* storage blocked */ }
}
export function lsSave() {
  try { localStorage.setItem(lsKey(), JSON.stringify({ profile: state.profile, days: state.days, dirty })); } catch (e) { /* storage full or blocked */ }
}
export function readLocal(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } }

function markDirty(id) { dirty[id] = ++seq; lsSave(); clearTimeout(flushT); flushT = setTimeout(flush, 600); }
export const saveProfile = () => markDirty("profile");
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
    lsSave(); setSync(hasPending() ? "offline" : "ok");
  } catch (e) { setSync("offline"); }
  flushing = false;
  if (hasPending() && navigator.onLine) { clearTimeout(flushT); flushT = setTimeout(flush, 1500); }
}

export async function pull() {
  if (!sb || !S.uid || !navigator.onLine || S.workoutLive) return;
  try {
    const [p, d] = await Promise.all([
      sb.from("profiles").select("data").eq("user_id", S.uid).maybeSingle(),
      sb.from("day_logs").select("date,data").eq("user_id", S.uid)
    ]);
    if (p.error || d.error) throw p.error || d.error;
    if (p.data && !dirty.profile) state.profile = { ...DEFAULT_PROFILE, ...p.data.data };
    const days = {};
    (d.data || []).forEach(r => { days[r.date] = { ...r.data, date: r.date }; });
    // keep local edits that have not reached the server yet
    Object.keys(dirty).forEach(id => { if (id !== "profile") { if (state.days[id]) days[id] = state.days[id]; else delete days[id]; } });
    state.days = days;
    if (!p.data) dirty.profile = ++seq;
    lsSave();
    if (!typing()) render();
    flush();
  } catch (e) { setSync("offline"); }
}

export function setSync(m) {
  const el = $("sync");
  if (!el) return;
  if (S.localOnly) m = "local";
  el.className = "sync " + (m === "ok" ? "ok" : (m === "local" || m === "offline") ? "warn" : "");
  el.title = m === "ok" ? "All changes synced" : m === "offline" ? "Offline: changes will sync when you reconnect" : m === "local" ? "Saved on this phone only" : "Connecting";
}
