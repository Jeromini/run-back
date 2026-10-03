// Phone notifications for fasting reminders (Web Push). The server (push-tick, run every
// 5 minutes) decides when to send; this module only subscribes or unsubscribes the device.
// iPhone: works for the app added to the Home Screen, iOS 16.4 and later.
import { VAPID_PUBLIC } from "../config.js";
import { state, S } from "../core/state.js";
import { sb, saveProfile } from "../core/store.js";

const b64ToBytes = s => { const p = "=".repeat((4 - (s.length % 4)) % 4), b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(b, c => c.charCodeAt(0)); };
const bytesToB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function pushSupport() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = window.navigator.standalone || matchMedia("(display-mode: standalone)").matches;
    return { ok: false, why: ios && !standalone ? "On iPhone, add the app to your Home Screen first (Share, then Add to Home Screen), then open it from there." : "This browser doesn't support notifications." };
  }
  if (!S.uid) return { ok: false, why: "Sign in to turn on reminders." };
  if (Notification.permission === "denied") return { ok: false, why: "Notifications are blocked for this app. Allow them in your phone's settings." };
  return { ok: true };
}
export async function remindersOn() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  try { const reg = await navigator.serviceWorker.ready; return !!(await reg.pushManager.getSubscription()) && Notification.permission === "granted"; } catch (e) { return false; }
}
export async function enableReminders() {
  const sup = pushSupport(); if (!sup.ok) throw new Error(sup.why);
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Notifications weren't allowed.");
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC) });
  const { error } = await sb.from("push_subscriptions").upsert({ endpoint: sub.endpoint, user_id: S.uid, p256dh: bytesToB64(sub.getKey("p256dh")), auth: bytesToB64(sub.getKey("auth")) });
  if (error) throw new Error("Couldn't save this device. Try again.");
  state.profile.tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  state.profile.remind = true; saveProfile();
}
export async function disableReminders() {
  try {
    const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
    if (sub) { await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint); await sub.unsubscribe(); }
  } catch (e) { /* already gone */ }
  state.profile.remind = false; saveProfile();
}
